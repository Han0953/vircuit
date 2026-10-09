# Immersive homepage

Implementation: 9 October 2026. Scope is the public `/` homepage; product engines, account flows and other marketing pages keep their existing behavior.

## Composition

The Precision Learning Lab direction uses the existing light/dark tokens, restrained PCB grids, original SVG electronics and CSS perspective. Hero layers separate the circuit, code and output. On mobile the introduction uses a smaller transform amplitude; pointer tilt is enabled only for fine pointers.

The server-rendered narrative is hero → practical learning problem → four-beat learning story → simulator preview → Cirra → challenges/progress → projects/save → free access/FAQ → final CTA. Main content, headings, links, ordered steps and native FAQ details remain usable without JavaScript.

`app/icon.svg` reuses the existing Lucide CircuitBoard navbar mark and matching brand palette. Next's metadata file convention supplies the icon link, eliminating the missing-favicon 404 on a fresh browser load. Its embedded license is retained.

## Motion boundary

- `MotionScene` is the small client island. It registers GSAP/ScrollTrigger in `useGSAP`, scopes selectors to its root and owns `gsap.matchMedia` cleanup.
- Each scene has an independent timeline. The timeline module is dynamically imported. Below-fold previews initialize through IntersectionObserver with a 400px margin.
- The story scrubs through Learn, Build/Wire, Code/Simulate and Debug/Challenge/Evaluate. Desktop pins one visual; mobile uses CSS sticky. Screens shorter than 620px stay in normal flow. Native scrolling is preserved.
- Reduced motion skips GSAP enhancement and restores the readable static composition. Unmount/breakpoint changes revert transforms, pin wrappers, listeners and story labels. Font readiness requests a single deferred refresh per initialized scene.
- No animation updates React state every frame. SVG dimensions and scene aspect ratios reserve space before hydration.

At this foundation checkpoint there was no WebGL, Three.js, R3F, Motion or smooth-scroll library. This is superseded by the [10 October 3D + motion extension](homepage-3d-motion.md), which adds one deferred world and desktop-only Lenis while retaining this foundation. CSS depth by itself does not fulfill the low-poly 3D requirement.

## Product truth

The hero/story and previews are labeled illustrations, not active simulation, AI responses or account progress. The simulator preview demonstrates D2 INPUT_PULLUP → program → D3 LED, using the supported educational Arduino-style subset. It does not mount React Flow, Monaco, a simulation worker or Gemini.

Learning links reference existing Arduino Uno lessons. Challenge feedback represents deterministic rules; account completion requires server confirmation. Cirra remains advisory and login/usage-limited. Local drafts are browser-local; JSON export is a backup, and account save must be confirmed. Premium is explicitly planned, without invented price or quota.

## Verification

`tests/e2e/homepage.spec.ts` covers server content without JS, copy/CTA destinations, FAQ, widths 360/390/430/768/1280/1440/1920, forward/reverse story scroll, refresh mid-story, theme controls, reduced motion, emulated touch swipes in both directions, orientation/height changes and route cleanup. Touch swipes dispatch CDP touch events; the higher-level synthetic gesture did not move the page on the Windows test browser.

`tests/e2e/homepage-performance.spec.ts` captures major scenes at 390/1440 in light/dark/system and measures local production loading with cold cache, 4x CPU slowdown, 1.6 Mbps throughput and 40ms latency. It checks CLS and the gzip size of motion chunks, and rejects simulator/editor/AI runtime signatures in initial page scripts.

Results and JSON measurements are generated under ignored `test-results/`. Event Timing samples are interaction latency observations, **not field INP**. Browser mobile emulation does not verify physical iOS Safari/Android address-bar behavior. Provider-backed regression tests use the existing local test fixtures; they do not prove remote Supabase RLS or Gemini availability.

Latest measured samples (9 October 2026):

| Width | LCP | CLS | Maximum observed interaction | Additional motion JS gzip |
| --- | --- | --- | --- | --- |
| 390px | 1172ms | 0 | 104ms (3 Event Timing entries) | 47,480 bytes |
| 1440px | 1056ms | 0 | 120ms (3 Event Timing entries) | 47,480 bytes |

These are synthetic local measurements with the profile above, not production/field Core Web Vitals. Initial scripts contained none of the simulator/editor/AI runtime signatures checked by the test.

Validation on 9 October 2026: lint, typecheck and production build passed. Vitest passed 169 tests with 6 skipped. The complete existing Playwright suite passed 65/65; after final visual/favicon refinements the focused homepage suite passed 19/19, including a fresh-browser resource check, static icon response, touch swipes and all viewport/theme cases. The final report is `test-results/final-results.json`; major scene screenshots are `test-results/home-*.png`.

Commands: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm exec playwright test`. For focused homepage QA after a production build: `pnpm exec playwright test tests/e2e/homepage.spec.ts tests/e2e/homepage-performance.spec.ts`.

On this Windows environment Playwright's server teardown stalled after workers had exited. Only the fixture/Next processes launched by that run were stopped to release the completed report; existing user processes were preserved.

Production audit/deployment/demo preparation remains a separate milestone.
