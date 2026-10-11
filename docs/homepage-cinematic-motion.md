# Homepage cinematic 3D and full motion

This is the earlier 11 October checkpoint. The subsequent
[homepage visual revision](homepage-visual-revision.md) supersedes its five-slot
architecture and validation numbers: hero is now three-board SVG only, and
WebGL is restricted to the story and board spotlight.

Implementation checkpoint: 11 October 2026. Scope: `/` only. This extends the
[3D story checkpoint](homepage-3d-motion.md) and preserves the
[shared marketing controls](public-pages-motion.md). No dependency, simulator,
authentication, persistence, challenge evaluator or AI backend changes.

## Ownership and rendering

`HomepageExperience` wraps server-rendered page content. It coordinates five
secondary artwork slots (hero, problem, boards, workspace, closing) with the
existing story stage. A visible story takes priority. Ownership transitions
between story and secondary artwork commit a blank state before mounting the
next Canvas; steady state has at most one Canvas. Between secondary zones, the
same portal host/renderer moves to the new slot. Its absolute positioning and
`pointer-events: none` keep links and copy interactive.

The original story progress channel, six low-poly component models, four
narrative beats and six visual subscenes remain intact. Story rendering is
permitted only while its stage owns the viewport. The secondary channel samples
absolute poses with `sampleCinematic()`; it does not accumulate transforms or
write React state on every scroll frame. Uno appears outside the board spotlight.
The three spotlight chapters select Uno, Nano and ESP32, with lateral, vertical,
depth, rotation and camera changes, and brief fades at chapter boundaries.

Shared low-poly resources and instanced pin details are reused. Nano has a narrow
PCB, two pin rows, USB port and controller; ESP32 has a shield, antenna area, USB
port and two pin rows. These are marketing illustrations, not manufacturing
models or new simulator components. Copy states Uno/ESP32 educational subset,
Nano visual-only and no hardware Wi-Fi/Bluetooth simulation.

Secondary WebGL is imported after scroll engagement, a 500ms delay and idle
scheduling. SSR SVG stays visible until a real WebGL frame is ready. The Canvas
uses demand rendering, DPR 1, no shadows/postprocessing/physics. Sustained
requested-frame latency above 40ms lowers DPR to .75, then falls back to SVG if
latency persists. This is a responsiveness guard, not a GPU timing benchmark.
Offscreen/hidden ownership suspends the world. Observers, subscriptions, RAFs,
timers, GSAP scopes and resources are cleaned up on route/preference changes.
Queued callbacks also check their disposed scope before scheduling work or
changing ownership, preventing stale observers from resetting a resumed route.

## Choreography and responsive layout

Existing shared desktop Lenis remains the sole scroll controller. The homepage
coordinator listens to native scroll events and batches geometry reads in one
scheduled RAF; it neither runs a continuous ticker nor intercepts scrolling.
Ten lightweight ScrollTriggers scrub opacity on dedicated token-colored
background spans, avoiding inherited CSS-variable updates on section trees.

One IntersectionObserver starts copy entrances near the viewport. A registry
assigns semantic content groups to entrances, internal sequences, interactions,
existing scene timelines or native FAQ disclosure. Skipped sections stay readable
during fast jumps. Motion uses 400ms entrances, 16px/8px desktop/mobile travel,
80ms/50ms stagger. CSS keyframes release their presentation after playback, without
per-target GSAP style reads during a fast scroll. Icons and
leaf text inside sequence groups receive internal choreography. Existing preview
artwork timelines retain ownership of their own transforms.

| Zone / source component | Copy treatment | Artwork / scrolling |
| --- | --- | --- |
| Hero / `landing-hero`, `hero-circuit` | Headline, supporting copy, CTAs | Existing assembly + spatial Uno slot |
| Problem / `problem-section` | Heading, four icon/text sequences | Uno focus/depth transition |
| Story / `learning-journey-section` | Heading, four beats, phases, captions | Existing reversible story, desktop pin / compact sticky |
| Boards / `scenes/board-showcase` | Three chapters, support labels, features, CTA | Uno → Nano → ESP32 sticky spotlight |
| Workspace / `virtual-lab-section` | Preview labels, explanation, CTA | Existing Code/Serial illustration + Uno slot |
| Cirra / `ai-learning-section` | Explanation, mode sequence, context | Existing conversation choreography |
| Challenge / `challenge-section` | Objectives, requirements, retry/result | Existing diagnostic/correction sequence |
| Projects / `project-showcase-section` | Project title/description/icon sequences | Save guidance, real navigation |
| Access / `pricing-section` | Access comparison, CTA, FAQ | Native disclosure + answer entrance |
| Closing / `final-cta-section` | Heading, copy, actions | Uno depth/rotation + existing SVG trace |

Desktop board stage is sticky at viewport height minus header/spacing; chapters
are approximately one viewport each. On compact screens the stage uses 38svh
and chapters 62svh, with half lateral travel and adjusted camera framing. Below
700px viewport height or under reduced motion, it returns to normal flow with
all three SVG boards visible. No desktop pin trap is introduced on touch.

All headlines, captions, board claims, navigation and FAQ are server-rendered.
No-JS, missing WebGL, failed chunk/context creation and context loss retain SVG.
Reduced motion removes Canvas, scrub/pin and interaction transforms. Static
artwork remains understandable; essential copy never exists only inside Canvas.
Header, footer, theme menu, Back to Top and secondary marketing routes keep their
existing shared behavior.

## Measured coverage

DOM audit at 390px and 1440px: **142 semantic ownership targets**, not a count of
every individual DOM descendant. Internal sequences own nested text/icons.

| Zone | Entrance | Sequence | Interaction | Existing scene | Disclosure | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Hero | 6 | 0 | 2 | 0 | 0 | 8 |
| Problem | 4 | 4 | 0 | 0 | 0 | 8 |
| Story | 4 | 5 | 0 | 6 | 0 | 15 |
| Boards | 14 | 9 | 1 | 0 | 0 | 24 |
| Workspace | 18 | 0 | 1 | 0 | 0 | 19 |
| Cirra | 6 | 4 | 0 | 3 | 0 | 13 |
| Challenge | 7 | 4 | 1 | 7 | 0 | 19 |
| Projects | 9 | 5 | 1 | 0 | 0 | 15 |
| Access | 4 | 0 | 6 | 0 | 5 | 15 |
| Closing | 4 | 0 | 2 | 0 | 0 | 6 |
| Total | 76 | 31 | 14 | 16 | 5 | 142 |

Zero uncovered groups under the manifest's semantic selector. SVG labels and
decorative Canvas content are excluded because their parent artwork owns motion.
Shared header/footer are outside this homepage registry and retain the public
motion system; footer copyright remains its documented static exception.

## Validation

Final application Playwright regression: **106/106 passed**, zero skipped,
flaky or unexpected results, on the final production build. This includes
simulator worker/Run/Stop, SVG/pin/wiring/rotation, resizable/collapsible panels,
Focus Mode, IndexedDB recovery, guest migration, auth/dashboard/learning,
challenge/progress, Cirra and secondary marketing pages using local fixtures.

Repeated lifecycle checks: 6/6 passed across three runs, each including three
story navigation cycles plus context-loss/preference recovery. Vitest: 183 passed,
6 skipped. Lint, typecheck and production build passed. The new tests exercise
chapter boundaries/reverse seeking, renderer handoff, idle frames, reload,
context loss, runtime motion preference, cleanup and actual DOM coverage.

| Width | LCP | CLS | Max observed Event Timing | Warm spotlight rAF p95 | Nano draw calls / triangles |
| --- | ---: | ---: | ---: | ---: | ---: |
| 390 | 868ms | 0 | 112ms | 17.0ms | 11 / 1,236 |
| 1440 | 1,044ms | 0 | 112ms | 17.0ms | 11 / 1,236 |

LCP/Event Timing use cold cache, 4x CPU, 1.6Mbps and 40ms latency. Matched initial
motion chunks: 68,903 bytes gzip. Warm rAF uses unthrottled scripted forward/reverse
scroll on a desktop GPU with emulated viewport sizes. These are lab samples, not
field INP, GPU frame timings or physical-phone/Safari verification. Earlier slow
samples exceeded the 200ms interaction budget; observer batching, dedicated tone
layers, CSS copy entrances and avoiding identical text writes addressed the
measured bottlenecks. Original story samples: 17.0ms p95, 35 draw calls, 3,320
visible triangles, 247,503 bytes deferred gzip at both widths.

JSON evidence is retained in ignored `playwright-report/`:
`cinematic-lifecycle-results.json` and `cinematic-final-results.json`. Screenshots
are generated in ignored `test-results/`: `cinematic-*.png`, `home-*-*.png`, and
existing story/marketing/application artifacts. Provider regression uses local
fixtures, not live Supabase/Gemini verification. No deployment was performed.

Additional browser geometry QA on Edge 155.0.4283.45 sampled Nano at progress
.37/.50/.64 on 390px dark/touch and 1440px light. Camera coordinates changed at
all three samples, Canvas count stayed one and neither viewport overflowed.
Screenshots were inspected, including hero, boards and final CTA. Light/dark/
system, no-JS, reduced motion, landscape and 360–1920px framing are covered by
the browser suites. Physical iOS/Android, Safari and field performance remain
unverified. Geometry evidence: `test-results/qa-cinematic-geometry.json` and
`qa-cinematic-*.png`.

## Source inventory and boundaries

- Root: `app/(marketing)/page.tsx`, existing homepage section components and
  `components/marketing/homepage.module.css`.
- Coordination: `scenes/homepage-experience.tsx`, `homepage-cinematic-config.ts`,
  `homepage-motion-manifest.ts`, `cinematic-slot.tsx`, `board-showcase.tsx`.
- 3D: `scenes/three/cinematic-world.tsx`, `board-models.tsx`; existing
  `hardware-models.tsx` only exports its shared mesh helpers.
- Story: `scenes/story-visual.tsx` adds renderer permission;
  `three/learning-world.tsx` re-announces a real frame after cached route resume
  and cancels its pending acknowledgement on cleanup. Story sampler, timelines,
  meshes and simulation/application modules remain unchanged.
- Tests: `tests/unit/homepage-cinematic.test.ts`,
  `tests/e2e/homepage-cinematic.spec.ts`, scoped existing homepage 3D/performance
  suites. No framework replacement or budget relaxation.

The old seven-type marketing gallery is no longer rendered by `/`. Its source
module is retained; simulator catalog and secondary pages are not removed.
VIR-031–034, VIR-440 and VIR-441 remain DONE. There is no new task ID for this
extension. VIR-420–424 and VIR-445 remain wider application work. P1 lighting/
camera richness and P2 shaders/particles/physics/high-poly pipelines are deferred.
