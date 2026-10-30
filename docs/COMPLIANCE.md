# Brief compliance checklist

Every line of *Frontend Technical Assignment v3.0* mapped to where it is implemented and how it was verified.
✅ = implemented and verified · ⚠️ = implemented, with a caveat stated next to it.

Verification run on 30 Oct 2026, from a fresh `git clone` with Node 22.17 / npm 10.9 (see §6).

## 1. Requirements — "The solution should allow a user to:"

| Brief | Status | Web | Mobile | Proof |
| --- | --- | --- | --- | --- |
| View a published record and its discussion | ✅ | Prerendered record page + discussion island | Record card + virtualised thread list | Web/mobile journey tests; E2E; videos 0:05 |
| Add a new comment | ✅ | Composer (Post comment, ⌘/Ctrl+Enter) | Composer (Post comment) | `posts a comment…` (web, mobile, E2E) |
| Reply to an existing comment | ✅ | Inline reply under the thread | Dedicated reply screen (design frame 03) | `replies inline…`, `replies on a dedicated screen…`, E2E |
| Understand when content is **loading** | ✅ | Loading card (skeleton) | Loading card (skeleton) | `shows a loading state…` |
| … **unavailable** | ✅ | "Record unavailable" page for unknown ids | Same, with Back to records | E2E `empty, unavailable and load-failure`; mobile `unavailable state` |
| … **empty** | ✅ | "No comments yet" + Add first comment | Same | `shows the empty state…` (web, mobile, E2E) |
| … **unsuccessful** | ✅ | "Couldn't load discussion" + Try again; "Comment wasn't posted" | Same | `load error…`, `keeps the text when posting fails…` |
| Recover from an unsuccessful submission **without losing the entered text** | ✅ | Text kept in the field, "Draft preserved", Retry, no duplicates (idempotency key) | Same | 4 core state-machine tests + web + mobile + E2E |
| English and Arabic, with LTR and RTL layouts | ✅ | `/en` `/ar`, `<html dir>`, logical CSS, per-comment `lang`/`dir` | Runtime switch, Yoga direction + navigation direction, per-comment direction | Dictionary parity tests, RTL tests, E2E language switch |
| One level of replies | ✅ | Replying to a reply joins the same thread | Same | `accepts replies to top-level comments only`, `replies to a reply…` |
| Authentication and backend not required | ✅ | Current user from the dataset; in-memory repository behind an interface | Same | DECISIONS D2 |
| Same core functionality on web and mobile, following each platform's conventions | ✅ | Semantic HTML, SSR, keyboard shortcuts, focus management | Native stack, swipe-back, modal sheet, pull to refresh, haptics, VoiceOver | Shared `@commenting/core`; parallel test suites |

## 2. Technical requirements

| Brief | Status | Evidence |
| --- | --- | --- |
| Web: React | ✅ | React 19.3 |
| Web: Next.js | ✅ | Next.js 16.4 App Router, Cache Components |
| Web: TypeScript | ✅ | Strict TS, `noUncheckedIndexedAccess`; `npm run typecheck` |
| Responsive desktop and mobile-browser layouts | ✅ | Breakpoints at 480/767/1279 px. E2E runs at 1280 px and on Pixel 7. Phone-width layout follows the Expo frames (`docs/screenshots/web-mobile-*`) |
| Mobile: React Native | ✅ | React Native 0.88 |
| Mobile: Expo | ✅ | Expo SDK 58, Expo Router; `expo-doctor` 20/20 |
| Mobile: TypeScript | ✅ | Strict TS; `npm run typecheck` |
| Support for iOS mainly | ⚠️ | Built on iOS-first APIs: VoiceOver `accessibilityLanguage`, `automaticallyAdjustKeyboardInsets`, modal sheet, notification haptics, start/end alignment per `RCTResolveTextAlignment`. **Not run on an iPhone or the iOS Simulator** (no Xcode on the development machine). Verified with jest-expo and on an Android emulator. Steps to check on iOS are in the README |
| Any supporting libraries | ✅ | TanStack Query, zod/mini, Expo modules; rationale in DECISIONS |
| Code sharing allowed | ✅ | `packages/core` shares domain, data, i18n, tokens and hooks |
| Use the supplied JSON dataset | ✅ | `packages/core/src/data/commenting-assignment-data.json`, copied unchanged, validated at load |
| Data layer in any reasonable way | ✅ | `CommentingRepository` interface + in-memory implementation + network simulator |
| Submitted comments persist for the current session | ✅ | Web: sessionStorage per tab (survives reload). Mobile: memory per app process |
| Automated tests for the most important behaviours | ✅ | 213 tests (core 171, web 19, mobile 11, E2E 12), see TESTING.md |

## 3. Design reference

| Brief | Status | Evidence |
| --- | --- | --- |
| Use the Figma reference as the visual starting point | ✅ | Cairo, brand colours #1C2933 / #FFF5D6 / #B82424 / #FFEBEB, measured spacing (DECISIONS D13) |
| Follow its layout and visual intent | ✅ | Web re-measured against the web frame at export scale: within 1 pt. Mobile compared with frames 02–04, states with frame 05 |
| Adapt interactions for web and mobile | ✅ | Inline reply on web; reply screen on mobile; keyboard and VoiceOver specifics per platform |
| Decide on states and interactions that are not shown | ✅ | Records list, settings/Reviewer tools, reply on replies, focus rules (requirements §6) |
| Document significant assumptions | ✅ | `docs/specs/01-requirements.md` §6, DECISIONS §2 |

## 4. Deliverables

| Brief | Status | Where |
| --- | --- | --- |
| Source code in a Git repository or ZIP | ✅ | This repository; commits in the candidate's name |
| Instructions for installing and running both apps | ✅ | README › Quick start (checked from a fresh clone) |
| Instructions for running the tests | ✅ | README › Tests, TESTING.md |
| Screenshots or a short recording, web and mobile | ✅ | `docs/screenshots/` (21 images), `docs/videos/web-journey.mp4`, `docs/videos/mobile-journey.mp4` |
| Short explanation of the main technical decisions | ✅ | DECISIONS §1 (D1–D14) |
| Assumptions, limitations and potential improvements | ✅ | DECISIONS §2–§4, requirements §6 |

## 5. Evaluation criteria

| Criterion | Where to look |
| --- | --- |
| Completion and usability of the core journey | §1 above; videos; E2E journeys |
| Code quality and maintainability | One shared state machine (`useCommentComposer`), typed repository seam, strict TS, ESLint clean, small components |
| Quality across web and mobile | Same behaviour from `core`; per-platform UI; screenshots of both |
| Accessibility and multilingual support | axe (jsdom + real browser, WCAG 2.2 AA rules), focus management, live regions/VoiceOver announcements, Arabic plurals, Arabic-Indic digits, bidi per comment |
| Reliability and handling of states | Loading / empty / unavailable / load error / submit error / submitting; idempotent retry; corrupt-storage tolerance; abortable requests |
| Testing approach | TESTING.md; traceability matrix in `specs/03-tasks.md` |
| Performance and scalability | DECISIONS D11: prerendering, one client island, `content-visibility`, virtualised list, memoised rows, shared clock, cache write-through |
| Documentation and clarity | README, SDD specs, DECISIONS, TESTING, this file |
| Overall technical judgment | DECISIONS: pessimistic submission vs optimistic (D4), RTL without restart (D7), i18n without a library (D8), design measurement (D13) |

## 6. Verification performed

| Check | Result |
| --- | --- |
| `git clone` → `npm ci` (npm 10.9.2) | ✅ 12 s |
| `npm run verify` (typecheck + lint + unit/integration, all workspaces) | ✅ 201 tests |
| `npm run test:e2e` (production build, desktop + phone, axe in browser) | ✅ 12 / 12 |
| `expo-doctor` | ✅ 20 / 20 |
| Web visual check vs Figma frame (measured) | ✅ ≤ 1 pt on measured features |
| Mobile run in Expo Go on Android emulator | ✅ (videos and screenshots) |
| Mobile on iOS | ⚠️ not run (no Xcode) |
