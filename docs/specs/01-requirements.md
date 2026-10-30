# 01 · Requirements

> Spec-driven: every requirement has an ID. Design (`02-design.md`), tasks (`03-tasks.md`), code comments and
> test names refer back to these IDs, so each behaviour can be traced from brief → spec → code → test.

## 1. Source material

| Input | Where | Notes |
| --- | --- | --- |
| Brief | `Frontend Technical Assignment v3.0.pdf` | Web (Next.js + React + TS) and mobile (Expo + RN + TS, iOS first). |
| Dataset | `packages/core/src/data/commenting-assignment-data.json` | Copied verbatim; never mutated at runtime. |
| Design | Figma “Frontend Candidate Assignment – Commenting Journey” | 5 frames: Web desktop, Mobile EN discussion, Mobile EN reply, Mobile AR (RTL), Required states. See §6 for how it was read. |

## 2. Journey requirements

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| **J-1** | View a published record and its discussion | Record title, summary, source and publish date are shown in the active language. The discussion shows a total comment count, top-level comments, and their replies nested one level deep. |
| **J-2** | Add a new comment | A labelled multi-line composer posts a top-level comment as the current user (`currentUser` in the dataset). The new comment appears at the top of the discussion without a page reload, and the count updates. |
| **J-3** | Reply to an existing comment | Every top-level comment offers **Reply**. The reply appears under its parent. One level only: replies cannot be replied to (brief: “one level of replies is sufficient”). |
| **J-4** | Navigate between records | A record list leads to each record. Record 002 has no comments, so the empty state (S-3) can be reached with the real data. |

## 3. State requirements

| ID | State | Acceptance criteria |
| --- | --- | --- |
| **S-1** | Loading | A skeleton that matches the final layout is shown while data loads, and is announced to assistive tech as busy or loading. There is no layout jump when content arrives. |
| **S-2** | Unavailable | An unknown or removed record shows an “unavailable” screen with a way back. It is not a crash or a blank page. |
| **S-3** | Empty | A record with no comments says so and invites the first comment (the action focuses the composer). |
| **S-4** | Load failure | If the discussion fails to load, the record stays visible, and the discussion area explains the failure and offers **Try again**. |
| **S-5** | Submission failure | If posting fails: (a) the entered text is **never lost**; (b) an error explains what happened; (c) **Retry** re-sends; (d) retrying cannot create duplicates; (e) the user can still edit the text before retrying. |
| **S-6** | Submitting | While a request is in flight, the action shows progress, double submission is impossible, and the text stays visible. |
| **S-7** | Validation | Empty or whitespace-only text is rejected with a message. A maximum length (1,000 characters) is enforced, with a counter that appears near the limit. |

## 4. Internationalisation requirements

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| **I-1** | English and Arabic | All UI copy exists in both languages. The two dictionaries are checked for parity at compile time. The user can switch language at any time without losing drafts or posted comments. |
| **I-2** | LTR and RTL layout | In Arabic, the layout mirrors (start/end, icon direction, navigation direction). Web sets `<html dir>`. Mobile flips layout and navigation at runtime. |
| **I-3** | Mixed-direction content | Each comment is rendered in its own direction (`language` field, or detected for new comments), so an English comment in the Arabic UI reads LTR and vice versa. Latin-only names and sources are isolated from the surrounding Arabic text. |
| **I-4** | Locale-aware formatting | Counts use correct plural forms (Arabic has six: zero, one, two, few, many, other). Dates use the Gregorian calendar in both languages (the `ar-SA` default would be Hijri). Relative times (“3 days ago”) are localised. |

## 5. Platform, accessibility and quality requirements

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| **P-1** | Responsive web | Usable from 320 px to wide desktop. Content width is capped for readability. Touch targets are at least 44 px on small screens. |
| **P-2** | iOS conventions | Safe areas, keyboard avoidance, native stack navigation with swipe-back, pull to refresh, success haptic, Dynamic Type. |
| **P-3** | Feature parity | Web and mobile have the same capabilities (J-*, S-*, I-*). Interactions follow each platform: inline reply on web, dedicated reply screen on mobile (as in the design). |
| **A-1** | Keyboard | The whole web journey works with the keyboard. ⌘/Ctrl + Enter posts, Esc cancels a reply, focus is always visible. |
| **A-2** | Screen readers | Semantic landmarks and headings. Comments are articles with named authors. Success and failure are announced (live region on web, `announceForAccessibility` on mobile). Each comment carries its language (`lang` on web, `accessibilityLanguage` on iOS) so VoiceOver uses the right voice. |
| **A-3** | Focus management | Opening a reply moves focus to its field. Cancelling returns focus to the Reply button. After a reply is posted, focus moves to the new reply. On failure, focus stays where it was (in the field after ⌘/Ctrl+Enter, on Retry after a click), and the error is announced. |
| **A-4** | Contrast and motion | Text meets WCAG 2.2 AA contrast. Loading animation stops under `prefers-reduced-motion`. |
| **D-1** | Data layer | The supplied JSON is the starting point. Data access sits behind a repository interface, so a real HTTP API can replace the in-memory one without UI changes. |
| **D-2** | Session persistence | Posted comments last for the app session. On web they also survive a reload within the same tab (sessionStorage). Drafts persist the same way. |
| **D-3** | Realistic network | Simulated latency and failure injection make S-1, S-4, S-5 and S-6 reproducible on demand (Reviewer tools). |
| **T-1** | Automated tests | Domain logic, the data layer, the composer state machine, both apps’ journeys, accessibility (axe) and an end-to-end browser journey in both languages. |

## 6. Assumptions (decisions the brief or design leaves open)

1. **The Figma file was matched by measurement.** The Figma API and MCP need edit access to the file. Instead, the
   implementation uses the exported frames plus the brand hex codes (#1C2933, #FFF5D6, #B82424, #FFEBEB) and the
   typeface (Cairo). Sizes, weights and spacing were measured from the frames at their 1.0713× export scale. Font
   sizes were solved from Cairo's real glyph advances. The built pages were then re-measured against the frames
   (see DECISIONS § Design fidelity).
2. **Ordering:** top-level threads are newest first, because the composer sits above the list in the design, so a
   new comment appears right under where it was written. Replies within a thread are oldest first, so they read as a conversation.
3. **Current user** is `currentUser` from the dataset (Noura Alharbi). There is no authentication, as the brief says.
4. **Reply depth:** only top-level comments can be replied to. Replies are not repliable, so no thread is deeper than one level.
5. **Untranslated data:** `source` and user names exist only in English. They are shown as is and isolated with
   `<bdi>`/`lang` rather than machine-translated.
6. **Digits:** Arabic-Indic digits in Arabic and Western digits in English, as in the design's Arabic frame
   ("قبل ١٢ دقيقة"). Identifiers such as record ids stay Latin. It is one map to change (`NUMBERING_SYSTEM` in
   `packages/core/src/i18n/format.ts`).
7. **Language detection** for new comments uses the first strong directional character, the same rule as HTML `dir="auto"`.
8. **Edit and delete** of comments are out of scope (not in the brief). `updatedAt` is shown as “Edited”.
9. **Design placeholders mapped to the dataset.** The design's mock record shows a reference ("MR-2048") and a
   status ("Needs review"). The dataset has neither, so the reference is the record `id` and the status is
   "Published". The breadcrumb's "Monitoring" level is shown as text, because there is no such page. "Reply" appears
   on every comment, as in the design; answering a reply joins the same thread, addressed to that reply's author,
   so threads stay one level deep.
10. **Time zone:** dates and times are shown in Saudi time (`Asia/Riyadh`, UTC+3). A date prerendered on a
   build server and a timestamp rendered on the viewer's device then always agree. Relative times
   ("5 minutes ago") do not depend on the time zone.
