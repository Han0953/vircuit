# Homepage visual revision

11 October 2026. Extends the earlier cinematic checkpoint without changing
simulator, dashboard, authentication, content support or dependencies.

## Visual ownership

- Hero: three original SVG board designs, Uno / Nano / ESP32. Server-rendered,
  no WebGL slot, perspective scene or 3D model. GSAP provides copy position
  reveal, staggered card reveal, code/output tag entrances, small reversible
  parallax and desktop pointer translation. No continuous floating loop.
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

Uno proportions now follow its wider PCB silhouette. USB opening, reset cap,
controller leads, surface markings, traces and status LED improve legibility.
Nano gains controller leads, traces and reset detail. ESP32 gains shield detail,
module contacts, traces and tactile button caps. Shared geometry/materials and
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

## Validation

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
