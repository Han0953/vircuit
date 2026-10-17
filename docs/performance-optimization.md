# Performance optimization — 16 October 2026

Scope: simulator batching, theme compositing, editor startup, routing/persistence subscriptions and assets. No database, runtime language, challenge evaluator, Cirra backend or deployment changes.

## Theme regression correction — 16 October 2026

The snapshot theme optimization below was superseded after visual feedback. The application now uses live 300ms CSS palette interpolation again, with zero CSS transition delay and no class rollback, snapshot capture or screenshot readiness wait. Root and section owners interpolate together; inherited text/cards/SVG/gradients resolve that clock directly without nested color transitions. Existing GSAP/R3F motion keeps running; physical hardware colors and demand rendering remain unchanged, with no additional render loop.

The before/after benchmark tables below document the earlier optimization build. In particular, their theme timing numbers belong to the superseded snapshot implementation and **must not be presented as measurements of this corrected live transition**. New regression tests require real intermediate colors in body, wordmark, background, gradient, pattern and inverse surfaces; opacity-only screenshot fades are no longer accepted as theme animation.

Correction validation: lint, typecheck and final production build PASS; Vitest 366 PASS / 6 SKIPPED. The first scoped browser batch passed 39/40, exposing a legacy assertion for separate 240ms visible / 0ms offscreen section timing. That assertion now verifies the requested common 300ms / zero-delay section clock instead. The final production rerun passed 22/22 (theme synchronization, dashboard/System/reduced motion, 3D readiness/reversibility/demand/fallback, hero and mobile navigation). Across batches/reruns, all 40 scoped scenarios passed. Twenty final Light/Dark swaps across five routes at 390/1440px showed live intermediate palette colors, owner duration 300ms, delay 0ms, start-time spread below 35ms, no trailing color transitions and 0px scroll displacement. Root class changes unrelated to theme cannot restart the animation. Actual desktop/mobile footer screenshots were inspected. Physical-device frame latency is not claimed verified.

## Implementation

- Grouped node positions commit once per XYFlow event. Equal positions produce no update; drag checkpoints and project history remain intact. Selection validity checks run against topology rather than rebuilding a selection set for each movement.
- Component SVGs ignore translation-only prop changes. Pin handles, breadboard visuals and immutable catalog layouts/rotations are reused. All logical pins and DOM hit targets remain available.
- Routing subscribes to components/wires rather than code/viewport changes, computes its scene signature once and pauses pending jobs in the hidden workspace. Resuming unchanged geometry preserves completed routes. Global obstacle invalidation remains conservative.
- Autosave keeps its existing 1800 ms debounce and all account/error/conflict guards through an imperative subscription, avoiding a React render/effect cycle for every draft update. Local persistence remains immediate in memory, debounced 600 ms on disk, with the existing flush/revision/operation contracts.
- Code and Circuit load independently on first use and warm on navigation intent. A direct Code load starts downloading Monaco alongside draft recovery instead of initializing the hidden XYFlow canvas. Both views remain mounted after their first visit, retaining models, undo, selection and viewport. Hidden Monaco layout and canvas display subscriptions pause; simulation and Serial remain live.
- Theme changes use live registered palette interpolation for 300 ms. Backgrounds, gradients, glow, cards, SVG and inverse sections follow the same clock while existing GSAP/Three.js timelines keep their owners. System/cross-tab changes share the owner; reduced motion remains immediate. The original snapshot experiment and its measurements below are retained as historical evidence, not the current behavior.
- Read-only authenticated Supabase clients are deduplicated within a React Server Component request. Mutations still verify independently. Ownership filters, cookie boundaries, RLS and no-store behavior remain unchanged. Dashboard prefetch is retained to preserve fast navigation.
- Brand logos use existing Next Image resizing at their displayed sizes instead of transferring the original images. Dimensions, assets and theme filters remain unchanged.
- Marketing navbar height uses ResizeObserver's supplied box size and deduplicates CSS writes, avoiding an immediate forced layout. WebGL imports follow their existing section proximity rather than loading on an unrelated first scroll. Mobile story stages reserve the same space before and after motion initialization; cinematic scrolling, models and quality remain intact.

## Reproducible measurements

Run `node tests/performance/workspace.mjs <output.json>` against a production server on localhost:3002. Each context is disposable and unauthenticated; imported snapshots remain in its isolated IndexedDB. Do not point this benchmark at a user's persistent browser context.

Both before and after measurements used freshly built production code, Edge headless, DPR 1, 1440×900 desktop and 390×900 mobile emulation. The mobile main thread was throttled 4×; Monaco cold loading additionally used 1.6 Mbps / 150 ms network emulation. Main scenarios use three repetitions and medians. Breadboard selection has one sample per profile and is not a median.

| Metric | Before | After |
| --- | ---: | ---: |
| 50-node desktop drag, frame p95 | 33.5 ms | 33.4 ms |
| 100-node desktop drag, frame p95 | 100.0 ms | 66.6 ms |
| 50-node mobile CPU4 drag, frame p95 | 283.3 ms | 299.9 ms |
| 100-node mobile CPU4 drag, frame p95 | 649.8 ms | 466.5 ms |
| Desktop theme, frame p95 | 33.7 ms | 16.8 ms |
| Mobile CPU4 theme, frame p95 | 216.7 ms | 33.4 ms |
| Desktop theme, total style recalculation | 377.96 ms | 128.66 ms |
| Mobile CPU4 theme, total style recalculation | 1081.64 ms | 600.15 ms |
| Monaco mobile CPU4/network, cold-ready | 10032 ms | 9361 ms |
| Monaco mobile CPU4/network, LCP | 4828 ms | 4228 ms |
| Monaco cold JS transferred | 1240.33 KiB | 1179.32 KiB |

Raw samples: [before](performance/optimization-before.json), [after](performance/optimization-after.json).

Frame p95 samples omit the initial two sampler frames; they do not hide the separate recorded maximum long task. Theme capture still has long tasks on the CPU4 profile (median maximum 391 ms after vs 439 ms before; desktop 73 ms after vs 68 ms before). Large group drags remain below a stable 60 FPS target. The final 50-node mobile p95 did not improve; its operation wall time was 6329 ms after vs 6495 ms before, while style recalculation increased. Results vary across runs, and earlier more favorable samples were not substituted for the final measurements. Monaco remains network/parse heavy. Its final three samples ran separately from lint/typecheck/unit tests. No claim of 120 FPS, physical mobile performance, field INP or production Supabase latency is made.

Breadboard selection (one sample, not a median) retained all 2646 handles: desktop p95 66.6 → 66.7 ms, mobile CPU4 366.5 → 283.3 ms. DOM pin density remains a cost; no pin hit target was removed. Measured image responses were 91106 → 1883 bytes for the displayed 128px logo and 29404 → 2264 bytes for the displayed 256px wordmark. These are individual resource sizes, not total-page savings; footer masks/favicon can still request originals.

### Cold homepage interaction budget still not met

An isolated production rebuild of pre-change HEAD `caa021b` confirmed the existing first-FAQ interaction test already failed at both widths. The dependency junction required a temporary-only Turbopack root setting; the project's actual configuration was unchanged. Each width has three cold samples with CPU4, 1.6 Mbps and 40 ms latency, on both versions.

| Metric | Before | After |
| --- | ---: | ---: |
| Mobile 390px LCP | 1800 ms | 1476 ms |
| Mobile observed CLS | 0.5022 | 0 |
| Mobile first FAQ interaction | 624 ms | 368 ms |
| Desktop 1440px LCP (CPU4) | 1668 ms | 1512 ms |
| Desktop observed CLS | 0 | 0 |
| Desktop first FAQ interaction (CPU4) | 544 ms | 496 ms |

Samples and event/task evidence: [cold interaction](performance/faq-cold-interaction.json). This is lab Event Timing, not field INP. Both first-interaction tests still fail their unchanged 200 ms budget. CPU profiling localized most remaining pointerdown processing to React hydration/event dispatch, rather than simulation, circuit routing or the 3D loader. A broader hydration change needs further work; it was not concealed by delaying the test, relaxing its budget or removing animation.

A tested CSS layout containment experiment increased mobile drag costs and was removed. A reference-only controller shortcut broke tests that mutate geometry inputs; it was removed while retaining safe selective application-store subscriptions. A section Suspense experiment caused additional streaming CLS and was reverted completely.

## Validation

Status: implementation complete for the targeted changes, **PARTIAL against the overall performance budgets**.

- `pnpm lint`: PASS; `pnpm typecheck`: PASS; `pnpm test`: 366 PASS / 6 SKIPPED; production `pnpm build`: PASS. `git diff --check`: PASS (Git reported existing line-ending normalization warnings).
- Playwright scoped regression execution: initial 125 scenarios, then a 59-scenario follow-up and a corrected persistence-test rerun. Across these batches/reruns, 147 distinct scenarios passed; two cold-FAQ interaction budget scenarios remain failed as documented above. This is not a claim that the entire repository E2E suite passed.
- After the final production rebuild, a further 16-scenario rerun passed in 2.2 minutes: theme fallback/race, five-route footer/palette synchronization, dashboard/system/reduced theme, mobile/desktop scroll stability, guest/cloud fixture persistence, and the 100-component gesture recovery test.
- Covered real group gesture movement of 100 components, exact wires/code, one-step Undo/Redo and IndexedDB reload recovery; wiring/rotation/breadboard routes; C++ digital/analog/PWM/Serial/error and Run/Stop lifecycle; cloud fixture autosave/reload/offline/retry/conflicts/account isolation/guest migration/logout/delete; dashboard and Code/Circuit navigation.
- Covered Light/Dark/System, native snapshot and CSS transition fallback, rapid theme reversal, reduced motion, focus/scroll preservation, all five marketing routes, scroll forward/reverse, 3D demand/readiness/fallback, no-JS content, and mobile stages at the exercised 360–1440px widths. Selected desktop/mobile 3D screenshots were actually inspected. Physical Android/iOS keyboard behavior and 120 Hz hardware were not tested.
- A discovered theme race with Lenis root-class changes was fixed: only changes to the palette classes trigger a transition, so unrelated class writes cannot cancel/reverse the intended theme. Browser regression added.
- Old tests assumed hidden Circuit DOM exists on a direct Code load and that Monaco exists on Circuit; updated to check the deliberately lazy workspace and persisted data instead. The legacy login fixture was corrected to return the existing verified local auth response/cookies. No application auth or persistence contract was weakened to make tests pass.
- Remote Supabase production was not queried or modified. Persistence E2E used local fixtures; RLS behavior outside the existing local test stack and remote timing are not claimed verified here.

Primary changed areas: `features/simulator/{stores,routing,ui}`, `features/projects/{server/service.ts,ui/autosave.tsx}`, `components/shared/{theme-motion.tsx,brand-logo.tsx}`, `app/theme-motion.css`, the navbar/homepage scene loading and stage CSS, regression tests, and `tests/performance/workspace.mjs`. The ignored `agent/docs/DESIGN.md` also documents the theme compositor/fallback boundary. No TODO task was marked DONE on the basis of unverified performance targets.

## Changed files

Application:

- `app/theme-motion.css`
- `components/marketing/homepage.module.css`
- `components/marketing/public-navbar.tsx`
- `components/marketing/scenes/homepage-experience.tsx`
- `components/marketing/scenes/story-visual.tsx`
- `components/shared/brand-logo.tsx`
- `components/shared/theme-motion.tsx`
- `features/projects/server/service.ts`
- `features/projects/ui/autosave.tsx`
- `features/simulator/routing/routing-controller.ts`
- `features/simulator/routing/routing-scene.ts`
- `features/simulator/stores/project-store.ts`
- `features/simulator/ui/components/component-node.tsx`
- `features/simulator/ui/components/pin-handles.tsx`
- `features/simulator/ui/components/runtime-controls.tsx`
- `features/simulator/ui/panels/code-editor.tsx`
- `features/simulator/ui/panels/code-panel.tsx`
- `features/simulator/ui/panels/properties-panel.tsx`
- `features/simulator/ui/visuals/breadboard-visual.tsx`
- `features/simulator/ui/visuals/pin-layout.ts`
- `features/simulator/ui/workspace/canvas-activity.ts` (new)
- `features/simulator/ui/workspace/circuit-canvas.tsx`
- `features/simulator/ui/workspace/use-wire-routing.ts`
- `features/simulator/ui/workspace/workspace-shell.tsx`

Verification/documentation:

- `features/simulator/routing/routing-controller.test.ts`
- `features/simulator/stores/project-performance.test.ts` (new)
- `tests/e2e/dashboard.spec.ts`
- `tests/e2e/footer-theme-sync.spec.ts`
- `tests/e2e/marketing-theme-regression.spec.ts`
- `tests/e2e/persistence.spec.ts`
- `tests/e2e/workspace-performance-regression.spec.ts` (new)
- `tests/performance/workspace.mjs` (new)
- `agent/docs/DESIGN.md` (ignored documentation)
- `docs/performance-optimization.md` (new)
- `docs/performance/optimization-before.json` (new)
- `docs/performance/optimization-after.json` (new)
- `docs/performance/faq-cold-interaction.json` (new)

No deployment or commit was performed. The pre-existing generated `next-env.d.ts` difference is unrelated to the optimization.

## Hero / Titik awal scroll correction — 2026-10-17

Refinement of VIR-033/VIR-034. The deferred Learning by doing renderer can now
prepare its JavaScript during an idle period after the GSAP hero intro. Pending
preparation yields to wheel, touch, keyboard, scrolling and hidden tabs. This
does not mount a Canvas: the existing proximity observer and exclusive scene
ownership still decide when the renderer appears. Reduced motion and route
teardown cancel pending work. The same import serves an overlapping viewport
request, so entering during an unfinished download cannot lose that request.

Speculative preparation does not start the existing 15-second scene timeout or
force an SVG fallback. That timeout and error behavior still belong to an actual
request to enter the scene. No animation timelines, scene poses, board geometry,
CSS, theme transitions, Lenis settings or workspace/backend logic were changed
by this correction.

### Measured before / after

Fresh Edge headless contexts, local production builds, light theme, 900px height,
DPR 1, no CPU/network throttling. Three runs per width and build. Wheel input
starts 2500ms after networkidle, then 34 increments of 70px spaced by 50ms.
Numbers below describe that initial Hero → Titik awal → story traversal, not
physical-device FPS, GPU timing or field INP.

| Metric (median of three runs) | Before | After |
| --- | ---: | ---: |
| Desktop 1440px: largest long task during scroll | 80ms | None observed |
| Desktop: maximum rAF interval | 66.7ms | 33.3ms |
| Desktop: Hero rAF p95 | 16.8ms | 16.8ms |
| Mobile emulation 390px: largest long task | 93ms | 89ms |
| Mobile emulation: maximum rAF interval | 183.3ms | 199.9ms |

Desktop long-task counts changed from 1/1/1 to 0/0/0. The 68–92ms import/evaluation
work still exists, but in these after samples it completed at scrollY=0 before
the gesture. No additional scene script downloads occurred during the measured
after scroll. Mobile still has costly first WebGL/renderer initialization:
its long-task counts were 3/3/3 before and 2/2/1 after. The mobile maximum frame
interval did not improve consistently; this is not a general mobile smoothness
claim. Immediate scrolling or slow delivery can still reach the original
on-demand loader before idle preparation finishes.

The separate desktop board-showcase frame-budget test measured approximately
33.4ms against its 20ms threshold. A disposable-browser A/B check with the new
idle preparation disabled measured 33.3ms, versus 33.4ms enabled; the story was
not prepared in either traversal. That budget remains unmet independently of
this correction. Animation quality and the assertion threshold were preserved.

### Verification

- Final source: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` passed;
  372 unit tests passed and 6 were skipped.
- Final production build: 18/18 browser tests passed for idle preparation,
  overlapping downloads, the unchanged scene timeout, readiness before entry,
  forward/reverse storytelling, demand rendering, failed downloads/context loss,
  reduced motion and theme/scroll stability across all five marketing routes.
- The broader first browser batch also checked hero autoplay, board-specific
  wiring, pointer motion across all three hero boards, exclusive Canvas ownership
  and motion target coverage. Its mobile intro timing assertion initially missed
  by 9ms and passed two isolated reruns without any animation changes. Its desktop
  board frame-budget failure remains the independently reproduced limitation
  described above; the entire broader suite is not claimed fully passing.
- Desktop/mobile story screenshots from the final build were inspected. No
  physical mobile-device, 120Hz or deployed-production claim is made. No deploy
  or commit was performed.
