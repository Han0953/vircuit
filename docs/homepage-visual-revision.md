# Homepage visual revision

11 October 2026. Extends the earlier cinematic checkpoint without changing
simulator, dashboard, authentication, content support or dependencies.

## Visual ownership

- Hero: one active SVG circuit stage, cycling Uno → Nano → ESP32. Artwork is
  server-rendered, without a WebGL slot. CSS depth and a restrained desktop
  pointer tilt provide framing. GSAP owns copy reveal, board entry/exit, pin
  highlight, wire drawing and code/info entrances. No idle floating loop.
- Learning story and board spotlight: the only two cinematic 3D locations.
  The existing coordinator permits one Canvas at a time. SVG is a fallback,
  hidden as soon as a real WebGL frame is acknowledged, never a second visual.
- Problem, workspace preview, Cirra, Challenge, projects, pricing and closing:
  2D only. Problem and closing no longer repeat a decorative board. Workspace
  keeps a single SVG Uno in its illustrated workflow.
- Copy, cards, icons, CTAs, dividers and illustrations keep purposeful motion
  ownership across all ten sections. Hero transform targets belong to its GSAP
  timeline, preventing competing copy animations. Text stays opaque for LCP.

## Board detail and movement

Uno uses a shared 648 × 504 reference for its silhouette, header pads and story
wire endpoints. USB-B opening, barrel connector, reset cap, controller leads,
surface markings, traces and status LED improve legibility. Nano gains four-sided
controller leads and a distinct Mini-B connector. ESP32 uses a metal shield,
connected antenna meander and a smaller Micro-USB connector. Shared geometry/materials and
instanced details avoid per-pin draw calls; these remain lightweight marketing
illustrations rather than manufacturing models.

Spotlight poses include lateral/vertical/depth movement, slight rotation and
camera/target shifts throughout each chapter, sampled from absolute progress.
Forward/reverse seeking is deterministic. Rendering remains on demand; idle,
offscreen and hidden views do not run a perpetual animation loop. Reduced
motion, failed chunk, unavailable WebGL and context loss retain static SVG.
Nano stays visual-only; Uno/ESP32 remain educational subsets.

## Public navigation

PublicNavbar keeps its sticky geometry, route links and CTA. Desktop navigation
uses a compact bordered rail, active state and icon-only theme control. Existing
Radix Sheet provides a full viewport mobile menu with safe-area spacing, native
scroll, 52px links, focus trap, Escape and focus restoration. Desktop-only Lenis
and Back to Top are retained.

MarketingThemeToggle is separate from the shared application theme control.
It supports fine-pointer hover, mouse click, touch and keyboard. Native View
Transition crossfades theme changes where available, with a short Web Animations
fade fallback. Reduced motion switches immediately. The update callback is
synchronous: awaiting rAF would block the capture that must release that frame.
Closing menu content unmounts immediately so its outgoing focus scope cannot
dismiss a rapidly reopened menu. Open menu and full-screen Sheet transitions
remain animated. Theme preference remains next-themes Light / Dark / System.
Clicks on the theme trigger are excluded from the content's outside-dismiss
handler; its own toggle handles them. Clicking after hover therefore keeps the
menu open without fighting Radix's pointer-down toggle.

## Validation — previous three-card checkpoint

Lint, typecheck, production build and Vitest passed (184 tests; 6 opt-in live AI
checks skipped). The full application Playwright run passed 111/111 before the
last navbar interaction/proportion refinements. After those refinements and a
fresh production build, the affected homepage suites passed 24/24, zero flaky
or unexpected results. A separate six-test interaction gate also passed. The
entire 111-test suite was not repeated after those final refinements.

Automated browser coverage includes desktop/mobile, all three themes, no-JS,
reduced motion, hover/click/keyboard, full-screen menu geometry, reverse scroll,
exclusive Canvas ownership, reload, context loss and route cleanup. Screenshots
were visually reviewed. A further Edge touch check at 360px selected Dark and
System inside the open mobile Sheet and closed the Sheet successfully.

Final local production sample: cold cache, 4x CPU, 1.6 Mbps, 40ms latency.

| Metric | Mobile viewport 390px | Desktop viewport 1440px |
| --- | --- | --- |
| LCP | 772ms | 788ms |
| CLS | 0 | 0.00492 |
| Maximum observed interaction Event Timing | 112ms | 80ms |
| Warm spotlight frame p95 | 16.7ms | 16.8ms |

Initial motion chunks total 69,482 gzip bytes, below the existing 100KiB budget.
The Nano sample uses 15 draw calls / 1,644 triangles. Motion coverage contains
145 semantic targets across ten sections with zero uncovered groups. These are
synthetic lab measurements, not field INP or a physical-phone GPU benchmark.
Ignored JSON evidence: `playwright-report/homepage-revision-final.json` (111)
and `playwright-report/homepage-revision-focused.json` (24). Live provider
access, physical-phone / Safari behavior and deployment remain unverified.

## Main sources

- `components/marketing/hero-circuit.tsx`, `homepage.module.css`,
  `scenes/scene-timelines.ts`, `scenes/homepage-motion-manifest.ts`.
- `problem-section.tsx`, `virtual-lab-section.tsx`, `final-cta-section.tsx`.
- `scenes/homepage-cinematic-config.ts`, `scenes/three/board-models.tsx`,
  `scenes/three/hardware-models.tsx`.
- `public-navbar.tsx`, `marketing-theme-toggle.tsx`, `home-controls.module.css`.
- `tests/e2e/homepage-revision.spec.ts`, updated homepage / cinematic /
  performance suites, `tests/unit/homepage-cinematic.test.ts`.

No new task IDs, commit or deployment. Broader application hardening remains
outside this homepage revision.

## Final hero showcase refinement

The stage contains one visible board and its own output-to-ground path. Pin
anchors come from the existing visual layout: Uno D3, Nano D3 (visual only),
ESP32 GPIO23, and each board's GND. Each uses a series 220 Ω resistor and LED.
The lens response is an illustration, never live simulator execution; Nano's
lens stays off and its in-stage label says Visual saja.

The latest hero-only revision removes the lower identity/description/code cards,
board selectors, support paragraph and disclosure. A small in-stage label,
three decorative dots and a 44px Pause/Play button accompany the circuit.
One playback controller owns entry (1.75s), hold (2.75s), and exit (0.5s): each
activation is five seconds apart while visible and playing. Hover only adjusts
parallax; hidden/offscreen states pause the active transition. Remaining hold
time is retained, and stale callbacks are discarded. Reduced motion settles one
board with complete wiring and no autoplay, float, pulse or pointer movement.
An accessible caption explains the illustration and board support without a
visible lower content section. React receives phase/control changes, not frames.

Hero SVGs remain server slots; catalog/runtime code is not added to the client
animation controller. Static perspective, CSS floating, pointer tilt and SVG
entry each own separate transforms. Layered shadows affect only the board,
while the board/wires/output share the same plane. Output pulse is limited to
the hold and disabled for Nano. Disposal kills active animations, timers and
observers. Wire opacity is restored on every activation, including wraparound.

Story assembly, button/analog/diagnostic beats and SVG fallback keep their
existing progress channel. Refined camera paths and board poses are sampled
from absolute scroll progress, including entry, feature focus and exit. SVG
and WebGL replace each other atomically; late readiness cannot reactivate an
inactive slot. Header logo sizing is adjusted only on the homepage at ≤430px
to keep the existing CTA and menu within 360px.

### Earlier checkpoint validation (before the clean hero revision)

Final source passes `pnpm lint`, `pnpm typecheck`, `pnpm test` (210 passed,
6 opt-in live AI tests skipped) and `pnpm build`. The seven affected Playwright
suites pass 51/51 using `pnpm test:e2e`; the full application E2E suite was not
rerun. Earlier sandbox runs completed assertions but hung during Windows
web-server teardown. The final run with process permissions completed normally.
Evidence: ignored `playwright-report/hero-polish-final.json`.

Coverage includes all three boards, complete autoplay wraparound, rapid manual
selection, resize during transition, offscreen pause, keyboard controls, no-JS,
runtime reduced motion, six hero viewports (360/390/430/768/1280/1440px), theme
switching, exclusive Canvas ownership, reverse scroll, context loss, failed
WebGL/chunk, route cleanup, native touch, menu and Back to Top. Exit, partially
drawn wiring and held scenes were captured and visually reviewed. Model
close-ups and story frames were also reviewed; Chrome desktop/360px manual
checks covered selectors and Light/Dark/System controls.

Local production measurements (cold cache, 4× CPU, 1.6 Mbps, 40ms latency):

| Metric | 390px | 1440px |
| --- | --- | --- |
| LCP | 936ms | 952ms |
| CLS | 0 | 0.01801 |
| Maximum observed Event Timing | 112ms | 96ms |
| Warm story scroll rAF p95 | 17ms | 17ms |
| Warm spotlight scroll rAF p95 | 17.1ms | 17ms |

Initial motion chunks: 66,258 gzip bytes (100KiB limit). Deferred world chunks:
247,978 gzip bytes (250KiB limit). Story: 43 draw calls / 3,800 triangles, below
the unchanged mobile cap of 45 calls. Sampled Nano spotlight: 17 calls / 1,860
triangles. All ten sections have declared motion ownership with no uncovered
groups. These are synthetic Windows lab samples, not field INP or phone GPU
measurements. Physical-device/Safari QA and deployment remain unverified.

### Clean hero validation — 2026-10-12

The final hero-only source passes `pnpm lint`, `pnpm typecheck`, `pnpm test`
(210 passed, 6 opt-in live AI checks skipped) and `pnpm build`. Five affected
homepage Playwright suites pass 41/41 after the final reduced-motion fix and
rebuild. Evidence: ignored `playwright-report/hero-clean-final.json`.

Coverage includes the five-second Uno → Nano → ESP32 loop, board-specific
wiring and lens state, keyboard/touch pause, offscreen pause, reduced motion
both on entry and during pointer parallax, resize during entrance, compact
stage geometry, no lower selectors/content, and no horizontal page overflow.
Hero checks cover 360/390/430/768/1280/1440px; homepage regression also checks
1920px. Touch emulation cycles all three boards at 390px. Light/Dark/System,
no-JS, native mobile scroll, desktop Lenis, sticky navigation, Back to Top and
route cleanup pass. Desktop/mobile compositions and all three board captures
were visually inspected. No full application E2E rerun or physical-device/Safari
QA was performed. No dependency, other section, application backend, commit or
deployment changes are included in this revision.

Synthetic loading budgets also pass (4× CPU, 1.6 Mbps, 40ms latency): LCP
964/1036ms at 390/1440px, CLS 0, maximum observed Event Timing 80/144ms,
66,043 gzip bytes for the initial motion chunks. These are local lab samples,
not field INP or physical phone GPU measurements.

### Pointer hover refinement — 2026-10-12

All three hero boards now share a pointer pose: bounded X/Y tilt, slight Z
rotation, 10px lift, 1.015 scale and a deeper layered shadow. Perspective is
preserved through the separate float and pointer wrappers, keeping the entire
board/wires/output plane together. Entry/exit animation still owns the SVG group.
The last pointer position is reapplied on board activation, so Nano and ESP32
respond even when the pointer has not left or moved. Leaving returns to neutral
over 0.55s. Scroll invalidates cached bounds; resize, offscreen, hidden and pointer
mode changes reset the hover state. Touch does not activate hover, and reduced
motion clears it immediately.

Validation: `pnpm lint`, `pnpm typecheck`, `pnpm test` (210 passed, 6 opt-in live AI checks
skipped) and `pnpm build` pass. The three browser suites initially produced
29/30 passes: a touch assertion expected the CSS literal `none` while the
neutral transform was an identity matrix. After checking actual matrix identity,
the complete hero suite passes 11/11; the other 19 homepage/theme/performance
regression checks passed on the same production build. Evidence: ignored
`playwright-report/hero-hover-final.json` and `hero-hover-recheck.json`.
All three hover captures were visually reviewed. Physical-device/Safari QA
and the full application E2E suite were not run for this change.

### WebGL hardware polish — 2026-10-12

Only learning story and board spotlight hardware are refined. The SVG hero,
its existing pointer depth and all application domains retain their behavior.

- Uno: stepped PCB outline with actual mounting cutouts, a laminate edge,
  open USB shell/tongue/contacts, barrel-jack mouth and center contact, open
  header rims at the canonical story anchors, socketed DIP package and two
  lead rows, USB controller, capacitors, crystal, regulator and small SMD parts.
- Nano: 45:18 board proportions, evenly spaced solder pads and through pins,
  under-board spacers, four-sided QFP leads, Mini-B shell and contacts,
  crystal, reset switch, auxiliary IC and proportional passives.
- ESP32: dark DevKit PCB, layered RF daughterboard/shield with lid seam,
  exposed connected antenna meander, castellated module pads, header rows,
  Micro-USB shell, two buttons, USB controller and small passives.

Static primitives are baked into one geometry per finish, instead of drawing
every small lead separately. Geometry and matte materials are shared within
each world and explicitly disposed on teardown. Existing physical color tokens
also supply laminate and silkscreen finishes. A softer hemisphere plus key/fill
directional lights reveal side faces; dark component bases and laminate layers
give contact depth without shadow maps, postprocessing or external textures.

Spotlight scroll poses now add horizontal drift to vertical/depth travel. A
lower three-quarter camera and an Uno-specific left view expose the connector
openings. Desktop story FOV is widened from 35 to 38 degrees to keep its jack
inside the visual. Mobile story framing stays at 31 degrees. All movement is
sampled from absolute scroll progress, remains reversible, and requests frames
only when needed. Exclusive Canvas ownership and atomic SVG fallback stay intact.

Pure tests cover finite bounded geometry, finish batching, through-board
mounting holes, open canonical sockets and projection of actual connector/pin
vertices into desktop/mobile spotlight frames. Browser tests check per-board
budgets, three themes, renderer exclusivity and capture hardware close-ups.
Draw-call/triangle telemetry is read after the completed render, including the
first frame of an idle demand-rendered world. Its pending callback is canceled
and reset when viewport effects or world ownership are cleaned up.

Validation: lint, typecheck, production build and the full Vitest suite pass
(216 tests, 6 opt-in live AI checks skipped). The first homepage checkpoint
passed 33/33 browser checks, including hero and loading/theme regressions.
The stronger first-frame counter assertion then exposed stale pre-render stats
(12/14 passed); after fixing telemetry, the final production build passes 14/14
3D/cinematic checks. Ignored evidence: `playwright-report/hardware-polish.json`,
`hardware-polish-final.json` and `hardware-polish-verified.json`.

Final local Edge samples at 390/1440px: story 32 draw calls / 7,360 triangles;
Nano spotlight 6 calls / 3,012 triangles; warm scroll rAF p95 16.8ms (spotlight
16.7/16.8ms); deferred world 250,808 gzip bytes, below the unchanged 256,000-byte
limit. Every board uses at most six draw calls and fewer than 6,000 triangles.
Earlier loading samples on this revision: LCP 984/964ms, CLS 0, Event Timing
maxima 144/160ms, initial motion 66,074 gzip bytes. These are synthetic lab
samples, not field INP or physical-phone GPU timing. Desktop/mobile hardware
close-ups, story framing and dark theme renders were visually reviewed.

No dependency, simulator/dashboard/auth, commit or deployment changes.
Models remain lightweight marketing approximations, not CAD/manufacturing
assets. Physical-device/Safari QA and full application E2E were not run.

## Homepage composition and renderer entry — 12 October 2026

The learning story warms its renderer module within 600px of the viewport;
the board spotlight warms on scroll approach. The spotlight no longer waits
500ms and then an unbounded idle callback. Module preparation does not mount
another Canvas: the existing exclusive owner still controls actual rendering.
WebGL-capable, motion-enabled visitors see a neutral pending label rather than
a temporary SVG board before the first completed 3D frame. SSR/no-JS, reduced
motion, unavailable WebGL, failed imports (including a 15s timeout), context
creation failure and context loss retain the meaningful SVG fallback.

Uno, Nano and ESP32 now carry authored PCB/package markings using one generated
1024px texture atlas and one additional mesh per board. Markings include board
names, ATmega package text, Uno's canonical story pin labels, ESP32 RF module
text and reset/USB labels. Previous placeholder strokes on chips/shields are
removed so they cannot cross the new lettering. Atlas planes share one draw
call and their geometry, material and texture are disposed with the world.
The six physical finish batches remain unchanged; the visible board budget is
now seven calls, still below the overall mobile scene budget. No external
textures, fonts, dependencies or lighting loops are added.

Virtual Lab uses the existing Uno, push-button and LED SVG artwork in a weighted
layout. Board geometry keeps its aspect ratio and gets more space than the
input/output parts. The former generic icon sizing rule no longer shrinks the
board to 24px. This remains a labeled illustration, not an active simulator.

The hero uses the measured sticky-header height to size its available viewport,
smaller vertical spacing/headline bounds and adjacent touch-friendly CTAs.
The SVG showcase is capped at 36rem, and content can naturally grow on unusually
short viewports or with enlarged text. There is no fixed clipping height.
Hero autoplay, pointer depth and reduced-motion behavior remain intact.

Validation: lint, typecheck, production build and 219 unit tests pass (6 opt-in
live AI checks skipped). The initial five-suite checkpoint passed 42/42 browser
checks. After visual review removed the old package strokes, the final build
passed 24/24 3D/cinematic/composition checks, including delayed delivery for
both WebGL sections. Hero bounds fit without scrolling at 360x800, 390x844,
430x844, 768x1024, 1280x720 and 1440x900. Desktop/mobile screenshots and
Light/Dark/System renders were reviewed. Local Edge warm story samples are
33 calls / 7,304 triangles, scroll rAF p95 16.8ms, with 251,649 gzip bytes of
deferred world code. Budgets remain 256,000 bytes and 45 mobile story calls.
Reports: ignored `playwright-report/homepage-refinement.json` and
`homepage-refinement-final.json`. No simulator/dashboard/auth or dependency
changes. Physical-device/Safari QA and full application E2E were not run.

## Mobile learning and board stages — 2026-10-16

The audit found two separate mobile content planes: a sticky visual followed by an external learning rail/board chapter list, plus duplicate in-stage captions. Both sections now put their existing, single-copy content inside a shared figure. Section headings and introductions stay outside. On mobile/tablet up to 1023px with sufficient height, each figure fills the available viewport below the header (16px clearance above/below), stays sticky and displays one explanation at a time. Four learning steps and three board chapters track the existing scroll progress in both directions; a short opacity/position entrance accompanies a change. Model viewports reserve space for the longest explanation, and the learning disclaimer remains visible above the stage surface. Redundant mobile frame/caption text is hidden.

There are no extra React scroll renders, animation controllers, content copies, canvases, assets or dependencies. The existing StoryChannel, board sequencing, demand rendering and renderer ownership remain. The board stage now supports portrait heights from 620px, matching the learning stage; short landscape, reduced motion, no-JS and failed motion initialization keep all explanations in a readable static figure. Desktop keeps the two-column stage/rail arrangement via display: contents. The hero, other sections, simulator, Dashboard, Auth and backend are unchanged.

LOCAL validation: lint, typecheck and production build PASS; **25 related unit tests PASS**. Final affected browser cases verified through batch/rerun: **18 unique scenarios**, including mobile 360x640/360x844/390x844/430x844, tablet 768px, desktop 1280/1440px, short landscape, Light/Dark, native touch scroll, reverse scroll, exclusive canvas ownership, no-JS/reduced motion, context loss and route cleanup. The final batch had 17 PASS and one desktop download-baseline failure; the corrected performance rerun passed 2/2. That test previously counted auto-prefetched Fitur/Belajar/Jelajahi/Harga chunks as scene downloads. Its baseline now waits for initial navigation traffic to settle; the 256,000-byte budget and no-initial-WebGL assertion are unchanged.

Final local warm-scene samples at 390/1440px: **252,162 gzip bytes deferred**, **33 draw calls / 6,880 triangles**, and **16.8ms rAF p95**. Board spotlight samples remained seven calls. These are Windows headless Edge measurements, not physical-device GPU/FPS claims. Screenshots were inspected for compact mobile learning, Light/Dark board overlays and desktop learning. Final screenshots: test-results/mobile-3d-stage-final/; performance attachments: test-results/mobile-3d-stage-budget-verified/. Physical Android/iOS/Safari remain unverified. No commit or deploy.

## Marketing FAQ open/close motion — 2026-10-16

The public-route audit found native FAQ disclosures on Home and Harga; Fitur, Belajar and Jelajahi have no equivalent accordion controls. Both FAQ groups now reuse AnimatedDisclosure while retaining native details/summary semantics, original questions, content, Plus/Chevron icons and styling. On interaction, Web Animations expands the measured panel height over 360ms and collapses it over 280ms, with a matching answer fade/4px translation and 320ms icon rotation. Rapid toggles reverse from the visible height/opacity instead of snapping; height returns to auto after completion. No maximum-height guess, new dependency, global scroll controller or permanent animation loop was added.

Reduced motion and browsers without element.animate use the native immediate toggle. Without JavaScript the original summary controls still open/close normally. Resize and reduced-motion changes settle the animation, and effect cleanup clears animations, inline height and overflow when navigating away. The Harga grid aligns cards at the top so one expanded answer does not stretch its closed neighbor; FAQ cards no longer shift position on hover. Previous paragraph-only entrance animations were removed to prevent double effects. Gallery's separate answer keyframe and existing marketing motion remain.

Main sources: components/marketing/animated-disclosure.tsx and its CSS module, pricing-section.tsx, app/(marketing)/harga/page.tsx, homepage.module.css and public-pages.module.css. Browser coverage is in tests/e2e/marketing-disclosure.spec.ts, with existing public/no-JS FAQ regressions retained. No simulator, Dashboard, Auth, backend, content, commit or deployment changes.

Final LOCAL validation: lint, typecheck and production build PASS; Vitest **363 PASS / 6 live-provider checks SKIPPED**; final affected Playwright batch **10/10 PASS**. Browser tests verify intermediate panel heights during both expansion and collapse, independent neighbor height, rapid reversal, Enter/Space/focus, Light/Dark at 390/1440px, reduced motion, no-JS, interrupted navigation and existing public FAQ fallback. Initial new-test failures were corrected by scoping the Harga readiness selector and starting animation sampling at the actual click event, preserving all height assertions. Screenshots under test-results/marketing-disclosure-complete/; mobile Home and desktop Harga open states were visually inspected. Physical-device/Safari behavior remains unverified.

### Fixed FAQ expansion anchor — 2026-10-16

Home's access section previously inherited center alignment from the shared split layout, allowing the shorter FAQ column to move upward as it grew. Only this section now aligns its columns at the top. AnimatedDisclosure excludes its subtree from browser scroll anchoring, retaining the user's viewport while answers expand downward. Existing height/fade/icon motion is unchanged, and other split sections keep their existing alignment.

LOCAL validation: lint, typecheck and production build PASS; final targeted Playwright **6/6 PASS** at 390/1440px on Home/Harga, plus 360px no-JS and interrupted navigation. Tests sample every animation frame and verify both the panel's top coordinate and scrollY remain within 1 CSS pixel of the actual click, during opening and closing, while intermediate heights still animate. Keyboard, rapid reversal, reduced motion and native no-JS toggles also pass. Screenshots: test-results/faq-fixed-anchor/. The full unit suite was not rerun for this two-rule CSS correction; its previous run remains documented above. No deploy.

### One active FAQ per group — 2026-10-16

Home and Harga now use separate disclosure names. Opening a question activates the existing close path on any expanded peer in the same parent/group, preserving the closing height/fade/icon animation and handling rapid A/B/A switches without a second state store. Enhanced activation removes the native name attribute before changing open state so the browser does not snap an animating peer closed. Server-rendered names provide native exclusive grouping without JavaScript. Reduced-motion activation still closes peers immediately. Existing top alignment and scroll anchoring exclusions remain.

LOCAL validation: lint, typecheck and production build PASS; unit suite **363 PASS / 6 SKIPPED**; final targeted browser suite **6/6 PASS**. Home/Harga at 390/1440px verify peer closure, only one open item after transitions, rapid switching, keyboard, reduced motion, position/scroll stability and interrupted navigation. Native exclusive grouping also passed without JavaScript at 360px. Screenshots: test-results/faq-exclusive-groups/. No new dependencies, listeners, backend changes, commit or deploy.

### Prepare 3D before section entry — 2026-10-16

Removed the "Menyiapkan visual 3D" labels. The first scroll now starts both renderer module imports; the nearest stage is allowed to initialize up to 0.75 viewport ahead, before it becomes visible. A visible stage retains priority, with the more visible stage selected during transitions. Exclusive ownership and the existing disposal gate retain one Canvas; the hero remains SVG-only. Demand rendering, reduced-motion/no-WebGL SVG fallback, import timeout and context-loss recovery remain. This reduces the normal first-entry wait; very slow downloads, direct jumps and device GPU initialization can still take time.

LOCAL validation: lint, typecheck and production build PASS; **363 unit tests PASS / 6 SKIPPED**. All **33 affected browser scenarios** passed across the main batch and focused reruns. The main batch had one desktop performance sample at 33.2ms p95 (isolated rerun: 16.8ms) and six stale hero-position assertions from before the transparent-header change. Those assertions now check visible content/CTA clearance and viewport fit, passing at 360/390/430/768/1280/1440px. New tests at 390/1440px prove WebGL is ready while the stage remains below the viewport and reuse the same Canvas on entry. Delayed 3D delivery, single Canvas, scroll reversal, reduced motion, context loss, dark/System themes, no-JS and mobile stages also passed. Story local rAF p95: 16.8ms, 33 draw calls / 6880 triangles; board rerun p95: 16.8ms, 7 calls / 2688 triangles. Deferred modules: 254512 gzip bytes, within the existing 256000 budget. These are local Edge measurements, not field device guarantees. Screenshots: test-results/early-3d/ and test-results/early-3d-hero-final/. No deploy.
