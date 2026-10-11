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
