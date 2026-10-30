# 02 · Design

## 1. Architecture at a glance

```
┌──────────────────────── packages/core  (@commenting/core) ─────────────────────────┐
│ domain/   types · dataset schema (zod/mini) · buildThreads · validation · language │
│ data/     CommentingRepository (interface) · InMemoryRepository · NetworkSimulator │
│           DraftStore · storage adapters                                            │
│ i18n/     typed en/ar dictionaries · plural rules · date/relative-time formatting  │
│ theme/    design tokens (one source for CSS variables and RN styles)               │
│ react/    CommentingProvider · I18nProvider · useRecord/useThreads/useCreateComment│
│           useCommentComposer (the submission state machine) · useNow               │
└───────────────▲─────────────────────────────────────────────▲──────────────────────┘
                │ UI only                                     │ UI only
   apps/web  (Next.js 16 App Router)               apps/mobile  (Expo SDK 58 + Expo Router)
   RSC record page + client discussion island      Native stack, FlatList, reply screen
```

**Rule of thumb:** behaviour lives in `core`, pixels live in each app. Everything a reviewer could ask about
(“what happens when the post fails twice and the user edits the text?”) has one implementation and one test
suite. Both apps render it in their own idiom. *Why not share UI with react-native-web?* The brief asks for each
platform’s conventions (semantic HTML, CSS, SSR on web; native navigation and gestures on iOS). Sharing hooks
gives parity of behaviour without compromising either platform.

## 2. Data layer (D-1, D-2, D-3)

```ts
interface CommentingRepository {
  getCurrentUser(): UserSummary
  listRecords(opts?): Promise<readonly PublishedRecord[]>
  getRecord(recordId, opts?): Promise<PublishedRecord>              // throws RepositoryError('not_found')
  listComments(recordId, opts?): Promise<readonly Comment[]>        // authors joined, like a real API
  createComment(input: NewComment, opts?): Promise<Comment>          // idempotent on input.clientId
}
```

* **InMemoryRepository** is seeded from the validated dataset. It keeps comments created in this session in
  its own map, so the dataset is never mutated. It can mirror them to a `KeyValueStorage` (sessionStorage on web), and
  corrupt storage is ignored rather than crashing the app.
* **NetworkSimulator** wraps every call: latency profile (`instant | normal | slow`), `failSubmissions`
  (`off | once | always`), and `failDiscussionLoad`. Calls honour `AbortSignal`, so TanStack Query can cancel
  a request when the screen unmounts.
* **Idempotency (S-5d):** the client creates a `clientId` per submission attempt and reuses it for retries of
  the same text. The server keys the new comment on it, so a retry after an ambiguous failure cannot duplicate.
  Editing the text after a failure creates a new key, because it is a new comment.
* **Server state** uses TanStack Query (same library on both platforms): caching, request de-duplication,
  cancellation, and loading/error state. A successful post writes into the cache with `setQueryData` (an upsert
  by id), with no refetch and no flicker. Queries retry once; mutations never auto-retry, because only the user decides to re-send.

### Why the submission is *not* optimistic

The design shows a failed comment as the composer turning red with the text still inside it, plus a Retry
button. An optimistic insert would remove the text from the field at the moment of sending. On failure it
would have to put the text back, which clobbers anything typed in the meantime and makes a comment appear and
then disappear. The flow below keeps the text in place until the server confirms it:

```
            submit (valid)                 success
   idle ───────────────────▶ submitting ───────────▶ idle (draft cleared, comment in cache, announced)
    ▲  │ submit (invalid)        │ failure
    │  ▼                         ▼
    │ idle + validation msg    failed (text kept, error panel, Retry; editing allowed)
    └──────────────────────────────┘ retry = submit (same clientId if text unchanged)
```

Perceived latency is handled by the in-button progress state and a fast success path (no refetch).

## 3. Drafts (S-5a, D-2)

`DraftStore` is a tiny external store keyed by `recordId:parentId|root`, read through `useSyncExternalStore`.
Typing re-renders only the composer that owns the key, never the comment list. Drafts survive navigation
(the mobile reply screen and back), a language switch, and, on web, a reload in the same tab.

## 4. Internationalisation (I-1…I-4)

* Dictionaries are flat `as const` objects. `ar` is typed `Record<MessageKey, Message>`, so a missing key fails
  `tsc`, and a test asserts placeholder parity (`{name}`, `{count}`) between the two languages.
* Plural messages carry CLDR categories. Arabic rules are implemented and unit tested explicitly
  (0, 1, 2, 3–10, 11–99, 100+). Hermes does not ship `Intl.PluralRules` / `RelativeTimeFormat` on every
  target, so the same code runs on web and mobile and the output is identical.
* Dates use `Intl.DateTimeFormat` with `calendar: 'gregory'`, short months, Saudi time, and the design's digits
  (Arabic-Indic in Arabic, Western in English), with a manual fallback that produces identical output.
* **Web direction:** the `[locale]` segment is the root layout and sets `<html lang dir>`. All CSS uses logical
  properties (`margin-inline-start`, `inset-inline-end`, `text-align: start`), so RTL needs no separate stylesheet.
  Only directional icons get `:dir(rtl)` mirroring.
* **Mobile direction:** the language switches **instantly, without restarting the app**. Expo Router’s
  `LocaleProvider` flips navigation (push animation, swipe-back edge, header), and a root `direction` style
  flips Yoga layout (`row`, `start`/`end`). The alternative, `I18nManager.forceRTL` plus a reload, would lose
  in-memory session state, and per the Expo docs it does not work in Expo Go.
* **Bidi content:** web renders bodies with `dir` from the comment’s language and `lang`; names and sources use
  `<bdi>`. Mobile sets `writingDirection`/`textAlign` per comment and `accessibilityLanguage` for VoiceOver.

## 5. Web (Next.js 16, Cache Components)

| Route | Rendering |
| --- | --- |
| `/` | `proxy.ts` negotiates locale (cookie → `Accept-Language` → `en`) and redirects. |
| `/[locale]` | Record list. Server Component, prerendered for `en` and `ar`. |
| `/[locale]/records/[recordId]` | Record article is a **Server Component** (static, SEO-friendly, zero JS). The discussion is a **client island** (`<Discussion>`). Both listed records are prerendered. An unknown id streams the shell, then `notFound()` → S-2. |

* The record is published, cacheable content. The discussion is per-user and changes often. That split puts
  the LCP element in static HTML and keeps client JS small: no UI kit, CSS Modules, design tokens as CSS variables
  generated from `core/theme`.
* `<Discussion>` states: skeleton (S-1) → error panel (S-4) | empty (S-3) | threads. The composer is labelled and
  auto-grows (`field-sizing: content`), uses ⌘/Ctrl+Enter, and shows the error panel with `role="alert"`.
* Inline reply composer under the thread. Only one is open at a time, but drafts of the others are kept. Esc or Cancel returns focus to its trigger (A-3).
* Long threads: `content-visibility: auto` on thread items lets the browser skip layout and paint off-screen.

## 6. Mobile (Expo SDK 58, Expo Router, iOS first)

| Screen | Notes |
| --- | --- |
| `index` | Record list. |
| `records/[recordId]` | `FlatList` virtualises threads. Its header holds the record card and composer. Pull to refresh refetches. |
| `records/[recordId]/reply/[commentId]` | Matches design frame 03: parent comment, reply field, Post reply. On success it pops back with a haptic and an announcement. On failure it stays with the text kept. |
| `settings` | Language and Reviewer tools (simulation), opened as a modal sheet. |

* A custom header (dark bar from the design) is rendered through the native stack, so it gets the native back
  gesture and transitions.
* Keyboard: `KeyboardAvoidingView` (`padding` on iOS) plus `keyboardShouldPersistTaps="handled"`.
* `React.memo` rows, stable callbacks from React Compiler, and `FlatList` window tuning keep scrolling smooth with many comments.

## 7. Accessibility map

| Concern | Web | Mobile |
| --- | --- | --- |
| Structure | `header`/`main`/`article`/`section[aria-labelledby]`, `ol` of threads, nested `ol` of replies | `accessibilityRole` header/button/text, grouped comment cells |
| Labels | `<label>` + `aria-describedby` (hint, counter, error) | `accessibilityLabel` / `accessibilityHint` |
| Announcements | Polite live region (posted), `role="alert"` (failed) | `AccessibilityInfo.announceForAccessibility` |
| Busy | `aria-busy`, `aria-disabled` on the in-flight button | `accessibilityState={{ busy, disabled }}` |
| Language | `lang` + `dir` per comment, `<bdi>` for names | `accessibilityLanguage`, `writingDirection` |
| Targets | ≥ 44 px on coarse pointers | ≥ 44 pt hit slop |

## 8. Testing strategy (T-1)

| Layer | Tool | What it proves |
| --- | --- | --- |
| core domain + data | Vitest | Thread building (ordering, orphans, flattening), validation, language detection, Arabic plurals, Gregorian dates, repository (not found, idempotency, abort, failure injection, storage corruption). |
| core React | Vitest + Testing Library (jsdom) | The composer state machine: success clears the draft, failure keeps the text, retry reuses the key, no double submit. |
| web | Vitest + Testing Library + axe | Discussion journey (load → post → fail → retry → reply), focus management, empty and error states, RTL rendering, no axe violations. |
| web E2E | Playwright (desktop + iPhone viewport) | The real journey in a real browser, in English and Arabic. Also produces the screenshots in `docs/screenshots`. |
| mobile | jest-expo + React Native Testing Library | Discussion screen journey, failure recovery, reply screen, RTL direction. |
