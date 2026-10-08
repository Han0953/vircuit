# Smart wire routing

Routing is presentation-only. Project snapshot v1 still stores wire IDs, logical
endpoints and colors. Paths never enter IndexedDB, cloud snapshots, circuit nets,
challenge submissions or Cirra context.

## Geometry and obstacles

`geometry/component-geometry.ts` shares rotated world pin centers and node bounds
with breadboard placement. Canvas grid spacing does not quantize endpoints.
Ordinary node bounds are inflated by 8 flow units. Straight endpoint escape stubs
may cross their own component bounds; the rest of the path must avoid them.
Breadboards are routable surfaces, not solid obstacles or per-hole obstacle grids.
Their ports try four 12-unit escapes, preferring the rotated pin side.
Aligned components remain independent obstacles. Alignment creates no electrical
mount, synthetic wire or parent relationship.

## Router

The pure router tries direct, L, Z and U candidates, then bounded A* on compressed
coordinates from ports, obstacle faces and outer corridors. Arrival direction is
part of search state; cost includes Manhattan length and a 24-unit bend penalty.
Search shares an 8192-state cap across port variants. Segments are orthogonal with
sharp corners. Duplicate and redundant collinear points are removed.

Search yields cooperatively. The canvas controller targets 4 ms per animation-frame
batch; an individual cooperative step and browser scheduling can exceed the target.
Stats and routing status are available as test attributes, not electrical Problems.
No routing work is delegated to the simulation worker.

## Interaction and invalidation

Pointer connection/reconnect uses a cheap orthogonal preview. Click/keyboard/touch
connection uses XYFlow's existing click-start state, with an escape-stub indicator
until the second pin is chosen. No separate connection state machine is introduced.

During node drag, incident wires follow current anchors using cheap previews;
unrelated wires keep their previous path. Final routing starts after drag/snap.
Obstacle movement, rotation, structural edits, endpoint changes and recovery/load
invalidate routes. Selection, colors, labels, properties, code, runtime output,
pan/zoom and workspace panel resizing do not invalidate geometry.
Geometry and route caches are local to the mounted canvas. Generation checks reject
stale jobs. Effect cleanup cancels jobs and permits safe reinitialization.

Selected/focused edges use an explicit token-based highlight while keeping their
wire color. Hit paths follow final geometry, targeting 24 CSS pixels with a 32-flow-unit
cap so wide invisible hit areas do not cover adjacent components at low zoom.
Coincident endpoints get a small selectable indicator. Crossings never create a
junction; parallel wires may share a corridor in P0.

## Limits and verification

If ports are blocked, nodes overlap, or the search cap is exhausted, a finite
orthogonal fallback retains both endpoints. Its status is `fallback`, and it may
cross a body. P0 uses conservative node AABBs, not detailed physical silhouettes.
Rounded corners, separated lanes, crossing bridges and manual waypoints are deferred.

Vitest covers geometry, routing, controller cancellation, serialization, graph,
worker-change predicates, challenge fingerprints and Cirra context. Playwright
covers route geometry, pin alignment, drag/rotation, breadboard recovery, touch,
themes and workspace regression using local service fixtures. Performance fixtures
exercise small, 40/200 and 100/500 scenes. They are measurements of those fixtures,
not a guarantee for every imported circuit or real mobile device.

## Local measurements — 2026-10-08

Node fixture pass: small 8/10 about 20.5 ms total, medium 40/200 about 32.8 ms,
stress 100/500 about 95.5 ms; maximum scheduler batches about 2.8/4.0/4.1 ms.
This synchronous test driver drains queued callbacks without real animation-frame waits.

An isolated Edge browser pass recorded cumulative controller compute time 2.1/21.4/67.0 ms,
maximum batches 2.1/4.0/9.7 ms, and worst observed drag frame intervals 33.4/50.0/83.3 ms
for the small/medium/stress scenes. All three completed with zero fallbacks and cache
reuse. Browser controller counters can include recovery before fixture import;
these are workload observations, not isolated per-route benchmarks. Navigation/import
wall time is excluded from the compute figures. Stress dragging still drops frames;
the 4 ms target is a cooperative soft budget, not a hard real-time guarantee.

Validation: lint, typecheck, Vitest and production build executed successfully.
Twenty affected browser tests passed, followed by a six-test routing QA rerun.
Desktop, touch emulation (360/390/430 px), Light/Dark/System, rotation/reconnect/delete,
worker Run/Stop, recovery, resizing, Focus Mode and Circuit/Code navigation were checked.
Desktop and mobile screenshots were inspected. Service regressions use local fixtures;
remote Supabase RLS and live Gemini were not verified by this work.
