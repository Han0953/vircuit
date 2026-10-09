# Homepage 3D and motion

Implementation: 10 October 2026. This extends the [immersive homepage foundation](immersive-homepage.md). Scope is `/`; simulator, auth, persistence, challenges and Cirra backend are reused without changes.

## Ownership and rendering

The page remains a Server Component. Its copy, links, four narrative beats, component captions and FAQ remain available without JavaScript. The hero retains SVG/CSS perspective for initial paint.

`StoryExperience` owns a local progress channel. One ScrollTrigger timeline publishes normalized progress; `sampleStory()` derives reversible poses without React state updates per frame. The SVG fallback and WebGL renderer consume the same channel. The four narrative beats contain six visual subscenes: Discover (0–.15), Explore (.15–.30), Build (.30–.50), Code/Run (.50–.70), Debug/Evaluate (.70–.90), Resolve (.90–1). Components settle by .45 before eight wires reveal through .50. Input press, knob rotation, LED output, code examples and diagnostic/correction are illustrative, not live simulation results.

`StoryVisual` imports the world near its viewport through IntersectionObserver. One R3F Canvas uses demand rendering, DPR 1, instanced pin/hole detail, shared low-poly geometry/materials, no shadows, postprocessing, particles or physics. Procedural meshes cover Uno, mini breadboard, LED, resistor, push button and potentiometer. Camera framing differs on compact screens. Material colors resolve existing `.component-art` tokens; wire/diagnostic colors follow the application theme.

The seven other catalog types use existing pure SVG renderers and scoped GSAP timelines: Nano pin reveal (visual-only), ESP32 module tilt, half/full breadboard strip emphasis, DHT22 signal, relay contact, fan rotation. Fan rotation preserves blade spacing. No simulator engine, worker, store, React Flow or Monaco is imported for marketing illustrations.

## Fallback and cleanup

Missing WebGL, failed import/context creation, context loss and reduced motion retain the SVG illustration. Persistent requested-frame latency above 40ms lowers DPR to .75 after 24 adverse samples; sustained latency at low quality falls back to animated SVG. This is a response-latency safeguard, not a GPU benchmark. Idle/offscreen intervals are excluded, and stationary worlds request no continuous frames.

Owned subscriptions, observers, DOM listeners, timelines and resources are released on unmount. Geometry/material disposal belongs to the world; automatic duplicate disposal is disabled on shared meshes. R3F owns renderer teardown. Reduced-motion changes remove the Canvas and restore assembled SVG; normal motion can re-enable the world.

## Scrolling and controls

`HomeScroll` owns one lazily imported Lenis instance only on desktop >=1024px with fine hover, no coarse input, no touch interaction and no reduced motion. Mobile/hybrid devices use native scroll. Lenis RAF uses the existing GSAP ticker (seconds to milliseconds), with ScrollTrigger update notifications; no second animation loop or custom scroll container is added. The adapter is destroyed on route change, loss of eligibility or Sheet scroll lock. GSAP lag smoothing is restored to the installed default on teardown.

The homepage-only sticky navbar keeps its height and all navigation/theme/CTA controls. Surface/shadow state uses 96px/48px hysteresis. Header measurement provides the story/anchor offset; other marketing routes retain normal-flow headers. Short viewports avoid pinning.

Floating Back to Top appears after one viewport with an 80px hysteresis band, uses the same desktop adapter or native smooth scroll, and is instant under reduced motion. It preserves focus until the main content receives focus at the destination. Footer/skip anchors remain real links, including without JavaScript. Lazy scene refreshes wait for programmatic scrolling to settle so they do not repeatedly interrupt native scrolling. Bounded recovery handles interruption; new wheel/touch/keyboard input cancels it.

## Validation and limits

`tests/unit/homepage-motion.test.ts` checks actual 13-type coverage, deterministic/reversible poses and renderer channel ownership. `homepage-scroll.test.ts` checks eligibility and control hysteresis. Browser suites cover reverse scroll, mid-story reload, context loss, unavailable WebGL, failed chunks, reduced-motion changes, all viewport ranges, catalog token inheritance, navigation cleanup, hybrid/native policy, header offsets, Sheet focus, repeated Back to Top and footer anchors.

`homepage-performance.spec.ts` measures cold-cache LCP/CLS/Event Timing under 4x CPU, 1.6Mbps and 40ms latency. `homepage-3d.spec.ts` measures deferred gzip bytes, draw calls, triangles and warm-world scripted forward/reverse rAF intervals in local production Edge. These are lab measurements, not field INP or physical mobile GPU/Safari verification. Provider regression tests use local fixtures, not remote Supabase/Gemini proof.

Final local samples:

Browser: Edge headless 154.0.4258.62 on Windows, ANGLE / AMD Radeon / Direct3D11. Mobile widths are emulated on this desktop GPU.

| Width | LCP (4x CPU / cold network) | CLS | Warm scroll rAF p95 | Deferred gzip | Draw calls | Full visible triangles |
| --- | --- | --- | --- | --- | --- | --- |
| 390 | 924ms | 0 | 16.8ms | 244,794 bytes | 35 | 5,368 |
| 1440 | 1028ms | 0 | 16.8ms | 246,222 bytes | 35 | 5,368 |

Matched initial motion chunks: 53,899 bytes gzip. Maximum observed Event Timing: 72ms/120ms (3 entries each); this is not field INP. Frames are unthrottled rAF intervals during scripted native forward/reverse scroll, not GPU timings or physical phone measurements. Deferred byte measurement includes all newly fetched chunks near the story, including a small timeline chunk on desktop. All defined local budgets passed; this does not guarantee zero lag on every device.

Lint, typecheck and production build passed. Vitest: 174 passed, 6 skipped. Full application Playwright regression: 78/78 passed before the final mobile camera framing adjustment. The affected homepage suites were then rerun: 27/27 passed, including a new context-creation failure case and offscreen idle assertions. Browser QA covers 360/390/430/1280/1440 in light/dark/system. Screenshots were inspected, and the mobile camera target adjusted to keep hardware above the code overlay.

Artifacts are generated under ignored `test-results/`: `3d-focused-results.json`, `3d-browser-qa.json`, `world-*.png`, `qa-world-*.png`, and existing homepage scene screenshots. On Windows, only test-owned fixture/Next processes were stopped after workers finished to release stalled Playwright teardown. No user services were stopped.

VIR-033, VIR-034 and VIR-441 are DONE. VIR-445 remains TODO: it covers wider mobile application profiling. Physical iOS/Android browser chrome, sustained weak-device behavior, field metrics and live provider services are unverified. Remaining visual polish, extra WebGL catalog meshes and production profiling belong to later work. Deployment and FESTRA preparation are separate work.
