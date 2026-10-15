# Marketing background system

Scope: `/`, `/fitur`, `/belajar`, `/jelajahi`, `/harga`. No new dependencies,
canvas, scroll listener or animation frame loop. Product copy and foreground
scenes retain their existing owners.

## Art direction

| Route | Composition | Deliberate contrast |
| --- | --- | --- |
| Home | Technical hero, quiet broken traces, dark learning story, board blueprint, workspace grid, violet Cirra network | Challenge and final CTA invert with theme |
| Fitur | Precision grid, stage-dependent geometry, diagnostic traces, assistant network | Dark hero/CTA; runtime section inverts |
| Belajar | Connected roadmap nodes, course cycle paths, educational blueprint | Learning cycle inverts; closing stays dark |
| Jelajahi | Modular gallery tiles, capstone framing, level-specific traces | Capstone inverts; closing stays dark |
| Harga | Paired plan spotlights, precise comparison grid, quiet FAQ lines | Comparison inverts; closing stays dark |

The composition takes hierarchy and contrast inspiration from
[Nick Ho Motorsports](https://nickho-motorsports.nl/), without reusing its assets
or assuming how its effects are implemented.

## Authoring

`components/marketing/backgrounds/background-scenes.ts` contains 37 authored
treatments. Add a typed scene, then place `SectionBackground` directly inside
the semantic section. `PageHero` and `CtaSection` expose an optional background
prop. Their default behavior remains available outside these five pages.

The direct-child relationship scopes semantic tokens through CSS `:has()`.
Only the decorative plane bleeds to viewport width. Section ancestors never
receive a new clipping or transform rule, so existing sticky scenes remain
intact. Page-hero layout selectors target `data-page-hero-content` specifically.

Base, pattern, accent atmosphere and SVG signals form the visual layers.
Patterns leave the central reading area quiet. Hardware materials in
`.component-art` remain separate from section UI colors.

## Theme and motion ownership

`--section-bg`, `--section-fg`, `--section-muted`, `--section-card`,
`--section-border`, `--section-accent`, `--section-pattern`, `--section-glow`
and `--section-ambient` drive local UI surfaces, text, controls and SVG colors.
Selected `inverse` sections use navy in Light and pale blue in Dark. Registered
color properties interpolate board/filter accent changes on decorative layers
only. `MarketingThemeMotion` uses one IntersectionObserver to limit these 240ms
interaction transitions to visible sections; nested sections own their duration.
During a theme swap, next-themes suppresses color interpolation across the page.
Surfaces, foreground and patterns switch together; only visible atmosphere layers
get a short 180ms opacity fade. Offscreen layers stay idle. This avoids painting
every foreground element and gradient for the whole transition. Inherited tokens
on section ancestors never interpolate each frame. Existing next-themes and
the marketing theme toggle remain the source of theme state.

Theme selection performs no full-page View Transition capture or body-opacity
animation. Selection/Escape and mobile Sheet close restore keyboard focus with
`preventScroll`; outside clicks retain their own focus. No forced scroll position restoration,
Lenis restart or ScrollTrigger refresh is used for theme changes. The public
header has a 64px inner row (65px including border), small logo and constant
8px backdrop blur on its translucent strip. Blur is never animated.

HomepageExperience and PublicMotion own decorative scroll timelines through
their existing GSAP contexts. Feature-story and learning-roadmap backgrounds
join their existing timelines instead of adding another story controller.
Board spotlight colors follow the existing active-board attribute; feature
motifs follow the existing stage, and gallery accents follow the filter.

Scroll drawing, node opacity, short drift and scanner translation are bounded,
reversible motions. There are no permanent background loops or will-change
hints. Mobile illumination stays static instead of compositing a tall moving
gradient; signal drawing remains active and scanner travel is reduced. The
shared compact navbar logo also fits every marketing route at 360px. Reduced
motion uses complete static paths and no drift; the same complete artwork is
rendered without JS. Stage/filter accent selectors match the specificity of
Dark theme defaults so their state changes work in both themes.

## Validation

See `tests/unit/marketing-backgrounds.test.ts` and
`tests/e2e/marketing-backgrounds.spec.ts`. Browser checks cover all authored
scenes, six viewport sizes, Light/Dark/System, inversion colors, semantic
contrast, overflow, reversible drawing, reduced motion and no-JS rendering.
Existing homepage/public-page suites cover foreground scenes, sticky behavior,
navigation and synthetic production performance.

Screenshots and reports are local ignored Playwright artifacts. Measurements
are local Windows Edge samples, not physical-device or production field data.

### Verified results — 2026-10-12

- `pnpm lint`, `pnpm typecheck`, `pnpm build`: PASS on the final implementation.
- `pnpm test`: 221 passed; 6 opt-in live AI tests skipped.
- Broad marketing Playwright checkpoint: 67/70 passed. The failures were a
  360px navbar overflow (two checks) and a mobile rAF budget sample of 33.5ms.
  Compact logo sizing now applies to every marketing route; mobile background
  illumination no longer drifts as a tall composited layer.
- Follow-up: 21/22 passed, including all five routes at 360/390/430/768/1280/
  1440px, Light/Dark/System, mid-page theme changes, foreground/muted semantic
  contrast, reduced motion, no JS, reverse scrubbing, hero fit, sticky controls
  and mobile/desktop 3D budgets. It exposed Dark-mode filter accent specificity.
- Final targeted rerun after that fix: 3/3 passed (gallery filter accents,
  feature stage illumination in both themes, existing card/story/control
  ownership and route cleanup). The full application E2E suite was not rerun.
- Synthetic cold-cache marketing samples at 4x CPU / 1.6Mbps / 40ms RTT:
  LCP 960–1,256ms and CLS 0 across the five routes at 390/1440px. These samples
  precede the final CSS specificity fix and are not field INP or Lighthouse
  scores. Long tasks were observed under throttling.
- Final warm-world forward/reverse scroll sample: rAF p95 16.9ms at both
  390px and 1440px; story 33 draw calls / 7,304 triangles. Deferred world
  payload remains 251,649 bytes gzip. No background WebGL was introduced.

Visual inspection covered all five desktop heroes and representative mobile,
inverted-theme sections. After screenshots are retained in
`playwright-report/backgrounds/` (ignored), including `background-home-360-light.png`
and `background-home-1440-inverted.png`. No fresh before screenshots were taken.
Reports: `marketing-backgrounds-checkpoint.json`,
`marketing-backgrounds-layout-themes.json` and `marketing-backgrounds-final.json`
under `playwright-report/`. Physical devices, Safari and production field
performance remain unverified. No deploy or commit was performed.

### Theme / navbar fix verification — 2026-10-12

- Final `pnpm lint`, `pnpm typecheck`, `pnpm build`: PASS.
- `pnpm test`: 221 passed / 6 opt-in live checks skipped.
- Final affected Playwright suite: 26/26 passed. This includes all five routes,
  Light/Dark/System, real desktop pointer and mobile touch input, focus restore,
  sticky header, 360–1440px hero fit, no-JS/reduced motion, reversible backgrounds,
  filter accents and existing 3D budgets. Full application E2E was not rerun.
- Thirty Light/Dark interaction samples across five routes at 360/430/1440px
  recorded zero scroll displacement, including mobile Sheet close. Tests use
  screen-coordinate input because Locator.click itself can scroll sticky controls.
  No application scroll compensation was added.
- Local headless Edge theme samples: rAF p95 16.7–49.6ms. These include menu
  close and painting; they are not field INP or a universal zero-jank guarantee.
  Warm story scroll remains p95 16.7ms mobile / 16.8ms desktop, with the unchanged
  251,649-byte deferred world. Measurements use a local production build.
- Fifteen final navbar screenshots are retained under `playwright-report/theme/`;
  representative desktop/mobile screenshots were visually inspected. Detailed
  measurements are in `playwright-report/theme-final.json` (ignored).

The mobile scroll bug came from the Sheet's default focus return to its sticky
trigger. Both Sheet and theme-menu close now use explicit `preventScroll`.
Full-page snapshots and repeated theme-color painting were removed; only the
visible atmosphere fades. Physical devices and Safari remain unverified.

## Full-bleed footer wordmark and synchronized product themes — 2026-10-15 (current)

- All five public footers now end with a full-width, monochrome wordmark using the existing `public/logo-teks.webp` as a CSS mask. It sits outside the content container, scales by aspect ratio, follows the foreground token, and is decorative/aria-hidden because the accessible brand link remains above. No logo icon, controls, dependency or extra image asset was added. Back to Top moves above the wordmark when it enters view, preserving the existing control and avoiding covered letters on mobile.
- A global `ThemeMotion` under the existing next-themes provider coordinates registered color tokens on the document and marketing section owners. Colors use one 300ms easing curve; inherited child paint does not start a second transition on every palette frame. Gradients, SVG paint, borders, shadows and text resolve the same changing tokens. Dashboard/auth/Settings/Virtual Lab keep their existing theme controls and theme storage; no second preference store was introduced.
- Removed the dashboard's native full-page View Transition and the marketing atmosphere's extra opacity animation. No full-page screenshots, new WebGL canvas, continuous RAF loop, scroll compensation or duplicate scroll controller were added. OS/reduced-motion changes remain supported. Monaco surfaces/default text/line numbers now use the application palette while syntax highlighting retains Monaco's own theme. Existing 3D palette observers reread the final CSS colors when the shared transition settles, without remounting a canvas.
- Validation exposed two actual coordination issues and they were fixed: some scene palette observers flush styles before a class-change observer, so palette transitions must be armed before the class swap; a fixed cleanup timer can finish before a delayed CSS transition under load, so cleanup now waits for the actual palette animations' `finished` promises and two one-shot paint frames. Generation checks cancel stale cleanup during rapid changes. No transition assertions were removed. Pointer tests use screen coordinates, matching the existing scroll regression method; Locator.click can itself move a sticky control. A rapid reversal uses the Settings radio while the theme menu closes, avoiding automation reopening a disappearing portal.
- Final LOCAL checks: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` PASS; unit suite **353 PASS / 6 SKIPPED**. **11 unique affected browser scenarios verified across final batches/reruns**: four new footer/theme scenarios, three existing five-route theme/scroll regressions, three real runtime programs (Blink, button, analog/PWM), and the login intro regression. The last regression batch was 7 PASS / 1 timing assertion failure; that existing intro test now measures menu entry relative to actual panel completion instead of an arbitrary first rAF sample, preserving the panel-first/stagger requirements. Its final rerun passed. Production intro timings were not changed.
- Twenty Light/Dark swaps across five routes at 390/1440px verified intermediate colors, a common 300ms palette duration with zero delay and start-time spread below 35ms, zero remaining paint transitions at the observation endpoint, and **0px scroll displacement**. Existing touch/desktop theme tests at 360/430/1440px also confirmed zero snapshots, stable scroll and compact sticky header. Footer widths **360/390/430/768/1280/1440px** were checked with JavaScript disabled. Back to Top clearance and its scroll-to-top action passed on both new responsive route inventories. System preference, Settings control, reduced motion and rapid theme reversal passed.
- Visual/manual checks: inspected desktop dark and mobile light/dark footer screenshots, plus the final mobile footer with Back to Top above the letters. Final production-browser Code workspace check: `vs-dark`, editor background equals the surface token (`rgb(10,10,10)`), unchanged code, no overflow/page errors. Final 3D check: WebGL remained active, the same canvas survived the theme swap, and **0 additional idle frames over 500ms** after settling. These are local headless Edge observations, not physical-device/field-FPS claims. Physical Android/iOS/Safari and production traffic were not tested.
- Screenshots retained locally under `test-results/footer-theme-complete/`, `test-results/footer-theme-regression/` and `test-results/footer-theme-intro-verified/`; no before screenshot was captured for this revision. Relevant sources: `app/theme-motion.css`, `app/globals.css`, `components/shared/theme-motion.tsx`, `components/shared/theme-provider.tsx`, `components/marketing/public-footer.tsx`, `components/marketing/home-controls.module.css`, `components/marketing/scenes/back-to-top.tsx`, the marketing background motion/CSS and two existing 3D palette observers, `features/dashboard/ui/theme-popover.tsx`, `tests/e2e/footer-theme-sync.spec.ts`, and the existing intro regression's sampling assertion.
- No database/auth verification, project persistence, simulator engine, product copy, commit or deploy changes. Owned test fixture/server processes were stopped; user development processes were preserved.

## Marketing navigation and motion pacing — 2026-10-15

- Public theme and navigation capsules share the same surface/border tokens, including the Fitur hero. The mobile hamburger uses three CSS lines that morph into a close icon. The full-screen Sheet retains focus trapping, scroll lock and focus return; its Virtual Lab CTA sits above Masuk. Menu motion is 380ms open / 280ms close, with a static 4px backdrop blur and a neutral keyboard focus outline.
- Homepage and public-page reveals use 620ms desktop / 480ms mobile entrances, with bounded staggers and a softer easing. Long illustration sequences now cap total part stagger; mobile animates fewer technical subparts while keeping the full artwork visible. Challenge illustration beats overlap more closely. Reveal timelines no longer jump to their end at an IntersectionObserver boundary.
- Pending full scene measurements wait for 120ms of native scroll quiet, coalesce requests and remove temporary listeners when finished/unmounted. Story text, frame visibility and labels update only when their semantic state changes. Mobile background sweeps fade without translating large surfaces; the filtered hero SVG no longer floats continuously on mobile, while board cycling, entrance, wiring and output remain. Desktop Lenis, mobile native scroll, existing 3D owners, SSR content and reduced-motion fallbacks are preserved.
- Final LOCAL validation: lint/typecheck/build PASS; **363 unit tests PASS / 6 skipped**; **20 affected Playwright scenarios PASS in the final batch**, covering all five public routes, 360/390/430/768/1280/1440px, landscape, Light/Dark/System, keyboard/Escape/focus return, reduced motion, no-JS, artwork choreography, reverse scroll, Canvas exclusivity and route teardown. Initial browser failures were test hydration/scoping issues and an obsolete assertion expecting a marketing scroll marker on Auth; helpers now wait for enabled controls and assert actual ownership cleanup. No production timing assertion was removed.
- Synthetic 390px scroll at 4x CPU: final p95 **33.3–33.4ms** on Fitur/Belajar/Jelajahi/Harga and **50ms** on Home. Home still has a **399.8ms maximum frame** (baseline 383.2ms); it is not claimed as solved. A saved CPU profile shows deferred 3D module instantiation and ScrollTrigger/native layout reads during this interval. Warm 3D samples remain p95 **16.8ms mobile / 16.7ms desktop** with seven draw calls. These are headless Edge measurements, not physical-phone FPS or field INP. Physical Android/iOS/Safari remain unverified.
- Final screenshots are in `test-results/marketing-polish-verified/` (mobile menus and desktop capsule); mobile screenshots were visually inspected. Raw before/after frame attachments and `test-results/marketing-home-mobile.cpuprofile` are retained locally. Main changed areas: `public-navbar.tsx`, `home-controls.module.css`, homepage/public motion configuration and timelines, `scene-refresh.ts`, `homepage.module.css`, background motion and the related unit/E2E suites. No dashboard, simulator, auth, backend, dependency or deployment changes.

## Minimal mobile menu and primary action palette — 2026-10-16

The mobile navigation header contains only Close visually, with hidden dialog title/description retained for accessibility. Close uses the same 44px target and position as the header hamburger: 10px below the top safe area, 16px from the right (32px at the existing tablet padding breakpoint). Navigation links and Virtual Lab/Masuk actions remain; theme selection stays on the website header outside the menu.

Filled primary Buttons use the shared `--button-primary` palette. Following the user's corrected direction, Light uses black text on brighter blue, and Dark uses white text on deeper blue, including hover/pressed states. Inverted marketing section colors no longer override this pair. Section illustration/text tokens, secondary/ghost/destructive buttons and status indicators retain their original roles. The root palette coordinator animates the registered button colors together with the existing 300ms theme transition; no extra theme state or animation loop was added. The same shared Button applies in Auth, Dashboard, Settings, Cirra and Virtual Lab.

LOCAL validation: lint/typecheck/build PASS; unit suite **363 PASS / 6 skipped**. **14 unique browser scenarios verified across batches/reruns**: menu/alignment at 360/390/430/768/1440px, five-route theme/scroll regressions at 360/430/1440px, and Light/Dark/System button checks at 390/1440px across five marketing pages, login, register, dashboard, projects, settings and simulator. Hover colors and OS theme changes also passed. Test selectors were corrected to choose the active Auth heading and wait for streamed page actions; no color assertion was relaxed. Screenshots under `test-results/menu-button-theme/` and `test-results/primary-button-verified/` were inspected for the empty mobile header and Light/Dark dashboard buttons. The final isolated desktop Dark rerun is under `test-results/primary-button-final/`. Browser tests use loopback account fixtures, not remote Auth changes or physical devices. No deploy or commit.

### Corrected button direction and compact Back to Top — 2026-10-16

The latest user correction supersedes the earlier white-Light/black-Dark direction: filled actions now use **black text in Light / white text in Dark**. Their blue shades are paired for readable contrast across normal/hover/pressed states. Four registered action palette properties join the existing 300ms root theme transition, preserving smooth System changes. Back to Top has no shadow and a 38px visible surface with an 18px icon; a transparent 3px perimeter retains a 44px touch target. Keyboard focus, footer-wordmark clearance and scroll-to-top behavior remain.

Latest LOCAL checks: lint/typecheck/build PASS; unit suite **363 PASS / 6 skipped**. The full affected Playwright batch passed **9/9**; final touch-area verification is tracked separately below. Six cases verify the corrected colors across eleven marketing/Auth/dashboard/Settings/simulator routes at 390/1440px in Light/Dark/System, two verify Back to Top dimensions/shadow/function, and one samples intermediate button text colors during an actual OS theme change. Screenshots: `test-results/button-direction-backtop/`. The Light dashboard screenshot was visually inspected. No auth/storage/backend logic, dependency, commit or deployment changes.

Final Back to Top touch rerun: **2/2 PASS** at 390/1440px (`test-results/backtop-hitarea-verified/`). The native button owns a real 44px target and paints a centered 38px surface; the test clicks the transparent edge and verifies scroll reaches zero. An earlier pseudo-element extension missed a mobile edge tap, so hit testing now belongs to the button itself. Final build and lint pass. Across the batch and final rerun, nine unique affected browser scenarios are verified.

### White primary button labels in every theme — 2026-10-16

The user's latest instruction supersedes the earlier theme-dependent label colors: filled blue Buttons now keep white text in Light, Dark and System. Both themes use the deeper blue action palette, with darker hover/pressed surfaces to maintain readable contrast. The shared Button continues to cover marketing, Auth, Dashboard, Settings, Cirra and Virtual Lab, including inverted marketing sections. Back to Top sizing and shadow behavior are unchanged. The System transition test now asserts that labels stay white throughout the palette transition.

Latest white-label LOCAL validation: lint, typecheck and production build PASS; affected Playwright suite **9/9 PASS**, covering eleven marketing/Auth/dashboard/Settings/simulator routes at 390/1440px in Light/Dark/System, hover, stable white labels during an OS theme transition, and existing Back to Top touch behavior. Screenshots: test-results/primary-white-labels/. Test accounts use local fixtures; no remote Auth/database changes or deploy. Unit tests were not rerun for this CSS palette correction.

## Borderless blurred marketing header — 2026-10-16

All five marketing routes now use a static 12px backdrop blur (including the WebKit property) on the sticky header. The top surface remains transparent; after scrolling it uses the existing elevated surface at 82% opacity, exposing more background through the blur. The header's bottom border, shadow and gradient divider pseudo-element are removed. The desktop navigation capsule and theme trigger retain matching fills but have no decorative border. Light/Dark/System, keyboard focus indicators, 44px controls, active route state, mobile drawer and existing theme/scroll coordination remain. No filter animation or new controller/listener was added. The row now measures 64px without the old 1px border, consistently at top and after scrolling.

LOCAL validation: lint, typecheck and production build PASS; final affected Playwright **9/9 PASS**. Covers 360/390/430/768/1440px, theme options, matching capsule/trigger surfaces, border/divider/shadow absence, top/scrolled blur, mobile close alignment, Escape/focus/scroll restoration, reduced motion and Light/Dark swaps across all five public routes. Mobile and desktop top/scrolled screenshots were visually inspected. Screenshots: test-results/marketing-header-borderless/ and test-results/theme-header-*.png. Unit tests were not repeated for this CSS-only change; physical-device GPU/frame-rate and Safari performance were not profiled. Dashboard, simulator, Auth and backend styles are unchanged. No commit or deploy.
