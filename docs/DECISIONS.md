# Technical decisions, assumptions, limitations and improvements

## 1. Main technical decisions

### D1 · Share behaviour, not UI
`@commenting/core` holds the domain, data layer, i18n, tokens and React hooks. Each app renders its own UI.
react-native-web would let the two apps share components, but the brief asks for each platform's conventions:
semantic HTML, SSR and CSS on the web; native navigation, gestures and VoiceOver on iOS. Sharing the hooks
means the behaviour a reviewer would probe ("what if the post fails twice and I edit the text?") has
**one implementation and one test suite**. The source is consumed as TypeScript (`transpilePackages` on
web, Metro natively), so there is no build step and no publish step.

### D2 · Repository interface + simulated network
UI code only talks to `CommentingRepository`. Today an in-memory implementation is seeded from the
supplied JSON. A real API means one new `HttpRepository`, and no component changes. The
`NetworkSimulator` adds realistic latency and on-demand failures (`AbortSignal`-aware). That is what makes
the loading, failure and retry states testable and demonstrable instead of theoretical.

### D3 · TanStack Query for server state, a tiny external store for drafts
TanStack Query (the same library on both platforms) handles caching, de-duplication, cancellation and
loading/error state. Reads retry once on network errors only. Writes never retry by themselves.
Drafts are deliberately *not* server state: a `useSyncExternalStore` store keyed per composer, so typing
re-renders only that composer.

### D4 · Pessimistic submission with a write-through cache (not optimistic)
The design shows a failed comment as the composer turning red **with the text still in it**. Optimistic
insertion would clear the field on send and then have to put the text back on failure, which clobbers
anything typed in the meantime and makes the comment flash in and out. Instead the text stays put
(read-only) until the server confirms. On success the response is upserted into the cache, so there is no
refetch and no flicker.
**Idempotency:** each attempt carries a `clientId`, and a retry of unchanged text reuses it, so a retry
after an ambiguous failure (request landed, response lost) cannot duplicate. Edited text gets a new key.

### D5 · Web rendering split: static record, dynamic discussion
The published record is a Server Component, prerendered per locale and record (Cache Components / PPR): it is
the LCP element and ships zero JS. The discussion is the only client island, and it is per-user and changes often. Unknown
record ids still get an instant static shell, then resolve to the "unavailable" state.

### D6 · Locale in the URL on web, in app state on mobile
Web uses `/en/...` and `/ar/...`. URLs are shareable and indexable, `<html lang dir>` is right from the first
byte, and `proxy.ts` negotiates cookie → `Accept-Language` → English. Mobile keeps the locale in state
(initialised from the device), because apps have no URL bar to carry it.

### D7 · RTL without restarting the app (mobile)
The usual React Native approach, `I18nManager.forceRTL`, needs an app reload. That would wipe the in-memory session,
and per the Expo docs it does not work in Expo Go. Instead:
* Expo Router's `LocaleProvider` flips navigation (push animation, swipe-back edge).
* A root `direction` style flips Yoga layout, so `row`, `marginStart` and `end` mirror everywhere.
* Text uses `textAlign: 'start' | 'end'`. I checked React Native 0.88's source: both platforms resolve
  alignment against the Yoga layout direction (`RCTAttributedTextUtils.mm`, `TextAttributeProps.kt`), so
  `start` is right in Arabic without relying on `I18nManager`.
* `supportsRTL: false` in `app.json` keeps the native direction fixed, so the app is the single owner of direction.

### D8 · i18n without a library
Two languages with typed dictionaries (a missing Arabic key is a compile error, and a test checks
placeholder parity). Arabic needs all six CLDR plural forms ("تعليقان", "5 تعليقات", "12 تعليقًا"). These
are implemented and unit-tested rather than delegated to `Intl.PluralRules`, which Hermes does not provide
on every target, so web and mobile print identical strings. Dates use the Gregorian calendar explicitly
(`ar-SA` defaults to Hijri) with Western digits. Formatting is feature-detected, with a manual fallback that
a test proves produces identical output.

### D9 · Bidirectional content is per comment
A comment's language is in the data (`language`, or detected for new comments from the first strong
character, the same rule as `dir="auto"`). Web renders each body with `lang` and `dir` and isolates names
and sources with `<bdi>`. Mobile sets `writingDirection`, alignment and `accessibilityLanguage`, so
VoiceOver reads Arabic comments with an Arabic voice inside the English UI and vice versa.

### D10 · Styling: CSS Modules + tokens (web), StyleSheet + the same tokens (mobile)
There is no UI kit, so the client bundle stays small. One token file in `core` produces both the web CSS variables
and the RN values, and a unit test enforces WCAG AA contrast on the token pairs. Web CSS uses logical properties
only, so the Arabic layout comes from `dir="rtl"` with no RTL stylesheet.

### D11 · Performance and scalability
* **Web:** prerendered pages, a single client island, CSS Modules, self-hosted fonts via `next/font` (no layout
  shift), `content-visibility: auto` on threads, React Compiler, one shared 30-second clock for all relative
  timestamps (not one timer per comment), and a timestamp component that re-renders on its own.
* **Mobile:** virtualised `FlatList` (tuned `windowSize` and `initialNumToRender`), memoised rows,
  React Compiler, native-driver animations.
* **Data:** threads are built in O(n log n) from a flat list and memoised through TanStack `select`, so
  posting a comment patches the cache instead of refetching.
* **At real scale** the same seams take cursor pagination (`listComments({ cursor })` +
  `useInfiniteQuery`), server-side thread assembly, and live updates (SSE or WebSocket invalidating the query).

### D12 · Testing pyramid
200 automated tests across four layers. See [TESTING.md](TESTING.md). The highest-value suites are the
composer state machine (core) and the two journey suites, which exercise the real data layer rather than mocks.

## 2. Assumptions

The full list is in [requirements §6](specs/01-requirements.md#6-assumptions-decisions-the-brief-or-design-leaves-open).
In short:

1. **Figma was read from its rendered preview.** The Figma API and Dev Mode MCP need edit access to the file. The layout,
   hierarchy, components and colour intent were taken from the published thumbnail of all five frames. Exact
   pixel values and tokens are approximations. With edit access, the next step would be to pull variables
   from Figma's Variables API and replace `tokens.ts`.
2. Top-level threads are newest first, because the composer sits above the list. Replies are oldest first, so they read as a conversation.
3. The current user is the dataset's `currentUser`. There is no authentication, as the brief says.
4. Only top-level comments can be replied to, so nothing goes deeper than one level.
5. `source` and user names are not translated (the data has no Arabic versions). They are shown as is and bidi-isolated.
6. Western digits in Arabic, the common convention in Saudi digital services. It is one constant (`NUMBERING_SYSTEM`).
7. Closing a reply composer (Cancel, Esc, Back) keeps its draft. Only a successful post clears text.
8. Editing and deleting comments are out of scope. `updatedAt` is shown as "Edited".

## 3. Limitations and shortcuts

* **Native iOS was not run.** The development machine has no Xcode. The mobile app was verified with the
  jest-expo journey suite (real Expo Router navigator) and run on an **Android emulator** in Expo Go, which
  is where the mobile screenshots come from. iOS-specific behaviour (keyboard insets, the modal sheet,
  VoiceOver language switching, haptics) follows the Expo/RN APIs for iOS but was not checked on an iPhone. To
  check it: `npm run dev:mobile`, then scan the QR code with Expo Go 58 on an iPhone.
* **Android findings from the emulator (Expo Go 58, Pixel 8 image, software GPU).** These don't affect iOS
  correctness but are worth stating:
  * When English is typed into the Arabic composer (or the reverse), the *field* keeps the UI alignment. I tried
    `start`/`end`, absolute `left`/`right`, and remounting the field: Android's TextInput did not follow the
    `textAlign` prop reliably. Posted comments still render in their own direction everywhere. On iOS the
    alignment logic follows React Native's resolver (`RCTResolveTextAlignment`), but it is unverified on a device.
  * `adb shell input text` with a long string at machine speed lost characters after about 15–30 in React
    Native's TextInput, both controlled and uncontrolled. The native Contacts field received the same burst
    intact, and the same text typed in short chunks arrived complete. Human-speed typing and paste were not
    affected. It looks like an RN/IME interaction under emulator load. I'd re-test it on a physical device
    before calling it fixed or a non-issue.
* **Persistence is per session by design:** sessionStorage per tab on web, memory per process on mobile.
  Two tabs do not see each other's comments.
* **Unknown record URLs return HTTP 200 with the "unavailable" UI.** With Partial Prerendering the static
  shell has already streamed when `notFound()` runs. Next.js adds `noindex`, but the status code cannot change. A
  real backend would know valid ids before streaming.
* **The mobile language choice is not persisted** across app launches. It starts from the device language.
  Adding AsyncStorage is a few lines but adds a dependency that was not needed for the brief.
* **No real-time updates or pagination.** The dataset is tiny, and §D11 describes the seams.
* `@expo/vector-icons` is mocked in Jest (icons are decorative; every control has a text label).
* The npm workspace pins `expo-router` at the root so `@expo/cli` and the app share one copy.
  npm otherwise nests it under `apps/mobile` because of an optional-peer chain.

## 4. Potential improvements

1. Replace the in-memory repository with an HTTP one (with a zod-validated response), and add an MSW mock server
   so the same failure scenarios stay testable.
2. Cursor pagination and "load more" for long discussions; `@shopify/flash-list` on mobile.
3. Live updates (SSE) and a "new comments" pill instead of shifting content under the reader.
4. Edit and delete own comments, plus moderation states (pending, hidden).
5. Persist drafts and the language choice on mobile (AsyncStorage / MMKV).
6. An offline outbox: queue posts while offline and send them with the same idempotency key when back online.
7. Visual regression (Playwright screenshots in CI) and a Maestro flow running on an iOS simulator in CI.
8. Pull exact Figma tokens from the Variables API and map the main components with Code Connect.
9. Error reporting (Sentry) in the web error boundary and the mobile error paths.
