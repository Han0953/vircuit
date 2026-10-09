# Public pages: design, motion and shared scrolling

Implementation: 10 October 2026. Routes: `/fitur`, `/belajar`, `/jelajahi`, `/harga`.
Homepage content and its existing WebGL world are preserved. Auth, simulator,
dashboard, project persistence, challenges and AI backend are outside this change.

## Route identity

- Fitur: technical assembly, six Build/Wire/Code/Simulate/Debug/Learn steps,
  reversible desktop illustration and a static example of Cirra guidance.
- Belajar: editorial hero with reversed desktop composition, connected learning
  cycle, and a selector backed by the existing seven Arduino Uno lessons.
- Jelajahi: asymmetric hero, three concept diagrams, nine distinct project
  illustrations, working level filters and accessible project detail dialogs.
- Harga: centered access diagram, ordered Free/planned Premium cards, nine
  responsive comparison rows with category emphasis, and four native disclosures.

Nano remains visual-only; Arduino-style C/C++ is a subset. Marketing diagrams
do not execute simulation. Only Traffic Light links to an available course lesson;
the other gallery entries explicitly remain concept previews. Premium is planned,
disabled and has no invented price or billing flow. The roadmap is a method
preview, not account progress. No course, runnable template or paid entitlement
was added.

## Motion ownership and coverage

Server pages retain their copy, semantics, metadata and links. `PublicMotion`
is the small client boundary for a route or footer. It lazily loads
`public-timelines.ts`; content starts readable, including H1 and primary actions.
Failed imports leave content visible. No character splitting or duplicated text.

`public-motion-config.ts` holds treatment and timing tokens.
`public-motion-manifest.ts` maps route, section, semantic group patterns,
treatment, trigger and visible reduced-motion state. Catalog groups use feature
IDs and project slugs. Actual DOM attributes and browser coverage artifacts are
checked against this manifest; the manifest alone is not proof of animation.

An IntersectionObserver batches visible targets. Card titles, descriptions,
identity and supporting rows have internal sequences; long plan feature lists
reveal as separate rows. SVG paths draw, parts assemble and outputs settle.
Each entrance completes once. Offscreen active sequences finalize, focus finishes
the relevant sequence, and newly selected preview content is observed. Removed
preview nodes release their animations. Footer copyright is intentionally static.

Default reveal is 400ms, micro feedback 150ms, state changes 200ms, disclosures
250ms, and SVG assembly 600–900ms. Text moves at most 16px desktop / 8px mobile;
H1 uses only a short 4px accent with full opacity. Card batches are bounded and
spaced; transforms are separated from inner button/illustration hover feedback.
No perpetual ornamental loops, per-word triggers or React frame updates.

Fitur's desktop signature uses one ScrollTrigger without pinning and a measured
header offset. Short-height/mobile layouts use normal flow and discrete stage
controls. Belajar's learning line is reversible with scroll. The signature owns
its own SVG properties, separately from ordinary entrance choreography.

Cleanup releases matchMedia contexts, timelines, observers, focus listeners,
queued refresh and route callbacks. ScrollTrigger refresh waits for the existing
programmatic-scroll-settled event. No global `ScrollTrigger.killAll()`.

## Shared marketing controls

The marketing layout owns one `MarketingScroll` and one floating `BackToTop`.
`HomeScroll` remains a compatibility alias. Lenis is dynamically imported only
for `/`, `/fitur`, `/belajar`, `/jelajahi`, `/harga`, on a >=1024px fine-pointer,
hover-capable desktop without coarse input, touch, reduced motion or scroll lock.
Mobile/tablet/hybrid devices keep native scrolling. Auth/application routes have
no Lenis and no floating BackToTop.

Lenis has `autoRaf: false`, uses the existing GSAP ticker and calls
`ScrollTrigger.update`. Route changes, media changes, touch and Sheet locks
destroy the owned adapter and remove its ticker. Pending imports are guarded by
a generation and disposed flag. Marketing navigation avoids prefetching all
other route animation chunks or the simulator just because links are visible.

PublicNavbar stays sticky at a stable measured height. Scrolled surface uses
96px/48px hysteresis. The header variable supplies native anchor and story
offsets. Active routes, skip link, themes and accessible mobile Sheet remain.
BackToTop uses a 44px target, one-viewport visibility threshold, native/Lenis
scroll coordination and main-content focus at the actual destination. It is
hidden during the navigation Sheet. The old footer back-to-top link and the
homepage's duplicate mounts were removed.

## Accessibility and responsive behavior

360/390/430px phones, 768px tablet and 1280/1440px desktop are covered by browser
tests. Touch filters, lesson selectors and details do not depend on hover.
Reduced motion restores readable assembled illustrations and instant transitions;
ordinary mobile keeps short entrances and SVG assembly. Light/dark/system use
the real existing theme selector. Native FAQ and all main content work without
JavaScript. Decorative SVGs have captions and `aria-hidden`; headings, lists,
links, disclosures, focus restoration and button states retain semantics.

## Validation

Rendered coverage, after scrolling each page, interacting with the gallery and
opening the mobile Sheet:

| Scope | Original | Added | Individual | Internal sequence | Static | Uncovered |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Fitur | 58 | 36 | 27 | 67 | 0 | 0 |
| Belajar | 76 | 11 | 23 | 64 | 0 | 0 |
| Jelajahi | 68 | 24 | 24 | 68 | 0 | 0 |
| Harga | 58 | 3 | 52 | 9 | 0 | 0 |
| Shared controls/footer | 21 | 2 | 20 | 2 | 1 | 0 |
| Conditional project detail | 0 | 6 | 5 | 1 | 0 | 0 |
| Total | 281 | 82 | 151 | 211 | 1 | 0 |

This counts semantic groups, not words, DOM nodes or tween calls. Responsive
variants with the same identity count once. Individual means one group owns its
entrance/control treatment; sequence means card-internal, list/SVG assembly or
the mobile Sheet group. All 23 original sections remain, with three new sections.
The maximum catalog has 363 groups; 357 exist before opening a detail dialog.
Browser tests compare actual IDs/treatments with the manifest, detect ungrouped
meaningful content, scroll below the fold, check completed animation state and
sample intermediate SVG drawing. Static copyright remains the sole exception.

Production build, lint and typecheck passed. Vitest: 179 PASS / 6 SKIP; the focused
manifest suite has 5 tests. The full browser regression executed 101 scenarios:
100 PASS and one native mobile BackToTop landing one pixel short. After the
exact-destination fix, the affected marketing/homepage suites passed 37/37.
After the final batching/metadata refinements and rebuild, 15/15 focused browser
checks passed: content/manifest coverage, SVG assembly, card choreography,
failed-timeline fallback and eight production performance samples. Provider tests
use fixtures, not proof of live cloud configuration. The full 101-test suite was
not rerun after the fix; the 37-test rerun includes the previously failing case.

Generated screenshots, JSON test results, coverage inventories, timed SVG samples
and performance reports live under ignored `test-results/`. The 37-test results
and coverage/performance extraction are `public-pages-results.json`,
`public-pages-coverage.json` and `public-pages-performance.json`. The final batch
check uses its own output subdirectory to preserve earlier screenshots.

Baseline before shared-control changes: Vitest 174 PASS / 6 SKIP; focused existing
homepage browser suites 14 PASS. Local browser provider tests use fixtures, not
live Supabase or Gemini. Physical iOS/Android behavior, field INP and production
measurements remain outside these local checks. No dependency, commit or deploy.

Homepage regression retained one demand-rendered world, SVG fallback and reversible
poses. Both 390px and 1440px samples report 244,794 deferred gzip bytes, 35 draw
calls and 16.8ms warm-world rAF p95. The prior homepage-only baseline run had 14
passing browser tests before changes. Secondary routes fetch no WebGL, simulator,
Monaco or Gemini implementation chunks. Disabling marketing link prefetch removed
unnecessary secondary-route motion loading from the homepage world measurement.

Physical-device/Safari tests, field INP, live provider integration and production
profiling remain unverified. Initial loading still includes framework/GSAP long
tasks under the 4x CPU lab profile; a good LCP sample does not mean every device
will have zero jank. Wider application accessibility/mobile-performance backlog
items remain open. Marketing P0 introduces no arbitrary VIR task IDs.

## Final production-build lab samples

Profile: local production Edge, cold cache, 4x CPU while loading, 1.6 Mbps network
and 40ms latency. Scroll rAF sampling uses 1x CPU. These are synthetic samples,
not field INP, physical-device results or a deployed production benchmark.

| Route | LCP 390px | LCP 1440px | CLS | Maximum Event Timing 390/1440px | Initial + motion gzip 390/1440px |
| --- | ---: | ---: | ---: | ---: | ---: |
| Fitur | 952ms | 896ms | 0 | 40/32ms | 250,356/255,809 bytes |
| Belajar | 940ms | 936ms | 0 | 48/32ms | 244,048/249,501 bytes |
| Jelajahi | 992ms | 964ms | 0 | 48/24ms | 252,418/257,871 bytes |
| Harga | 836ms | 880ms | 0 | 16/24ms | 241,432/246,885 bytes |

Scroll frame p95: 16.7–16.8ms. Loading has 4–6 long tasks per sample, with maximum
duration 191–242ms under 4x CPU. Gzip totals include Next/framework/shared scripts;
they are not an isolated GSAP payload measurement. Exact current samples are in
`test-results/final-public-pages-performance.json`; the 15-test result is
`test-results/final-batching-results.json`.

Final signature-scene QA covered all four routes at 390px and 1440px: no horizontal
overflow and no page errors; Lenis on eligible desktop, native scrolling on mobile.
The short 1440x500 Fitur scene uses normal flow. Screenshots were visually inspected,
including the project detail dialog and mobile comparison/learning cycle.

A warm SPA-cycle sample with forced GC measured heap usage 7,500,868 → 7,919,548
bytes, with DOM nodes 999 → 999 and documents 1 → 1. This is not a heap leak proof.
Listener/ticker growth was not numerically instrumented; cleanup is covered by
source ownership and repeated-navigation interaction tests. QA evidence is in
`test-results/public-pages-browser-qa.json` and `qa-public-*-signature.png`.

## Changed file inventory

- Routes/layout: `app/(marketing)/fitur/page.tsx`, `app/(marketing)/belajar/page.tsx`,
  `app/(marketing)/jelajahi/page.tsx`, `app/(marketing)/harga/page.tsx`,
  `app/(marketing)/layout.tsx`, `app/(marketing)/page.tsx`.
- Shared UI/styles: `components/marketing/public-navbar.tsx`,
  `components/marketing/public-footer.tsx`, `components/marketing/page-hero.tsx`,
  `components/marketing/final-cta-section.tsx`,
  `components/marketing/home-controls.module.css`,
  `components/marketing/public-pages.module.css`.
- Motion/control layer: `components/marketing/scenes/home-scroll.tsx`,
  `components/marketing/scenes/back-to-top.tsx`,
  `components/marketing/scenes/public-motion-config.ts`,
  `components/marketing/scenes/public-motion-manifest.ts`,
  `components/marketing/scenes/public-motion-page.tsx`,
  `components/marketing/scenes/public-timelines.ts`.
- Route-specific scenes: `components/marketing/scenes/features-showcase.tsx`,
  `components/marketing/scenes/learning-roadmap.tsx`,
  `components/marketing/scenes/project-gallery.tsx`,
  `components/marketing/scenes/access-comparison.tsx`,
  `components/marketing/scenes/public-artwork.tsx`.
- Tests: `tests/unit/public-motion.test.ts`, `tests/e2e/public-pages.spec.ts`,
  `tests/e2e/public-pages-performance.spec.ts`, `tests/e2e/homepage-controls.spec.ts`,
  `tests/e2e/homepage-3d.spec.ts`.
- Documentation: `docs/public-pages-motion.md`, `docs/homepage-3d-motion.md`,
  `agent/docs/DESIGN.md`, `agent/docs/TECH_STACK.md`, `agent/docs/TODO.md`.
  The existing Git ignore policy keeps `agent/` local; it was not changed.
