# Animated Authentication & Adaptive Dashboard

Implementation checkpoint: 14 October 2026.

## Experience

- `/masuk` and `/daftar` share `app/(auth)/layout.tsx`. URLs remain compatible. Marketing navigation, Lenis and footer are not mounted inside authentication.
- Both RHF forms remain mounted during mode navigation. Separate values and validation are retained in memory, inactive panels are hidden/inert/disabled, and password visibility resets when switching. No credentials enter browser preference storage.
- GSAP owns form/artwork motion. SVG circuit artwork is static without motion and uses existing theme tokens. Mobile uses one form, native scrolling, 44px controls, and no input autofocus.
- Login and immediate-session registration verify `/api/auth/session` before the rolling-door handoff. Email confirmation, invalid credentials and unavailable Google do not trigger success. Verified users with an account-level reduced-motion preference bypass the door; callback landing also honors reduced motion.
- Root transition state contains only a presentation intent. The overlay is lazy-loaded, closes/opens briefly, and releases after an 1800ms deadline. Failed navigation exposes retry without resubmitting credentials. Callback intro markers expire within 60 seconds, are consumed once, and never authorize access.
- Google application integration is retained. Provider remains blocked by Google Cloud registration; the button explains current unavailability and offers email login.

## Dashboard

- Authentication is verified before the Suspense boundary, preserving real anonymous HTTP redirects. Private profile/avatar/content may stream afterwards; an initial neutral fallback contains no private data.
- Desktop sidebar uses 256px / 80px geometry, shared account preferences, an owner-bound SSR cookie hint, accessible collapsed labels, tooltips, and bottom logout. Existing preference objects upgrade with a default sidebar field.
- Header remains fixed at 64px, outside the transformed content column. FLIP-style sidebar motion applies one geometry change and temporary transforms; text is not scaled.
- Mobile has five primary controls: Dashboard, Belajar, Lab, Proyek, Lainnya. More contains Tantangan, Progress, Pengaturan, identity and logout. Radix owns focus trapping, Escape and return. Lab opens the existing `/simulator` without creating a project.
- Dock follows active routes, respects safe area and hides for editable focus or other modal interaction. Its state persists across dashboard routes.
- Optional swipe only applies to `/dashboard`, `/dashboard/learn`, `/dashboard/projects`. It skips Lab/More, rejects screen edges, vertical movement, interactive/form/code/chart/scroll areas, selection and multiple pointers. The simulator and Settings never mount swipe handling.
- Content motion uses local observers and a WeakSet of revealed elements. Dynamic cards/notices can enter without replaying the rest of the page. Settings and Cirra retain their own animation owners.
- Lesson content, objectives, concepts, practice and navigation use grouped motion; code/text remain selectable. Challenge progress failure is shown as unavailable rather than an empty completion history.

## Password recovery

- `/lupa-kata-sandi` requests Supabase recovery with a generic acknowledgement.
- `/auth/callback` supports a bounded recovery hash or PKCE exchange, verifies the authenticated user, and issues a short-lived HttpOnly recovery proof bound to that access token.
- `/atur-ulang-kata-sandi` and POST `/api/auth/reset` require both server `getUser()` and matching recovery proof; `getSession()` supplies the binding token and is not the authorization source.
- Password confirmation, 8–128 characters, strict bounded payloads and same-origin checks apply. Success consumes recovery proof, signs out locally and returns to login.
- No remote password was changed during this milestone. Actual recovery email delivery and reset through a received email still require remote verification and the recovery callback redirect allowlist.

## Validation

Final command and browser results are recorded below after the implementation run. Fixture tests prove application behavior, not Google provider configuration or remote RLS.

## Limits

Physical Android/iOS keyboard, native autofill and edge gestures require device testing. Pointer-event E2E gestures and viewport emulation are not a substitute. No new dependency, database migration, deployment or commit is required by this UI milestone.

## Final verification

- pnpm lint: PASS.
- pnpm typecheck: PASS.
- pnpm test: 353 PASS, 6 SKIPPED; 76 files PASS, 1 SKIPPED.
- pnpm build: PASS; Next 16.3.8, 31 pages, existing auth/dashboard/workspace routes plus recovery pages.
- Playwright primary local batch: 26/26 PASS.
- Playwright final adaptive + public/workspace/runtime/Cirra regression batch: 17/17 PASS. Five adaptive scenarios overlap, so 38 unique local scenarios (43 executions), followed by 5/5 adaptive rerun PASS after account-level reduced-motion handling (48 local executions total).
- Playwright real Supabase cloud persistence: 1/1 PASS. Initial sandbox attempt could not reach Auth; rerun with authorized network access passed. Actual browser save HTTP 200, reload, offline retry, new mobile session, stale revision HTTP 409, cross-account denial, rename/delete, logout/relogin and synthetic-project cleanup were verified. This is not a new standalone RLS audit.
- git diff --check: PASS. Environment and generated test artifacts remain ignored.

Local fixture servers on Windows required stopping their exact owned process IDs after workers completed to finish teardown. User development processes were not stopped. No failing assertions were removed.

## Visual and motion evidence

Screenshots inspected: auth desktop/mobile, collapsed desktop sidebar, mobile More Sheet. Local browser tests cover 360/390/430/768/1024/1280/1440 for auth/dashboard overflow and 360/390/430/768/1280/1440 across all five public routes. Light/Dark/System and reduced motion were exercised. A screenshot captured during More entrance is not evidence of its final frame; navigation and logout accessibility were separately asserted.

Edge on Windows, 1.2-second auth-switch rAF samples:

| Run | Width | P95 interval | Peak interval | Long tasks | CLS |
|---|---:|---:|---:|---:|---:|
| Primary local batch | 390 | 17.2ms | 66.7ms | 0 | 0 |
| Primary local batch | 1440 | 17.2ms | 50.0ms | 0 | 0 |
| Concurrent remote/local regression | 390 | 33.3ms | 49.9ms | 0 | 0 |
| Concurrent remote/local regression | 1440 | 17.1ms | 33.4ms | 0 | 0 |
| Final adaptive rerun | 390 | 33.2ms | 33.4ms | 0 | 0 |
| Final adaptive rerun | 1440 | 16.8ms | 50.1ms | 0 | 0 |

These are host/browser samples with viewport emulation, not physical mobile or 120Hz verification. The mobile 20ms P95 target was not consistently met in viewport-emulated runs, including the final adaptive rerun. No zero-lag or universal frame-rate claim is made.

Some aborted rapid-navigation requests in the primary batch produced a Next server 'destination stream closed early' log. Related browser scenarios passed. The log was not suppressed; production occurrence has not been verified.

## Manual configuration still required

- Google Cloud OAuth client/provider activation remains deferred under VIR-212 and VIR-463. Keep its current design and unavailable message.
- Confirm Supabase Site URL/redirect allowlist accepts the deployed `/auth/callback?flow=recovery` destination and test a received recovery email. No remote recovery email/password mutation was performed.
- Physical Android/iOS keyboard, autofill, browser edge gestures, and lower-end-device performance need device QA.

## Main changed areas

`app/(auth)`, auth API/callback, root transition provider, dashboard shell/navigation/motion, account preferences, grouped lesson/status presentation, affected Vitest/Playwright suites. Simulator/runtime, database/RLS and AI backend implementations were not changed.
