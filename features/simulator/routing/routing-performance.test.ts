import { expect, it } from "vitest";
import { fixture } from "../tests/fixtures";
import { RoutingController, type RoutingClock } from "./routing-controller";

for (const [label, componentCount, wireCount] of [["small", 8, 10], ["medium", 40, 200], ["stress", 100, 500]] as const) {
  it(`profiles ${label}: ${componentCount} components / ${wireCount} distinct wires`, () => {
    const project = fixture(Object.fromEntries(Array.from({ length: componentCount }, (_, i) => [`c${i}`, i === 0 ? "breadboard-full" : "resistor"])), [], "");
    project.components.forEach((c, i) => { c.position = { x: (i % 10) * 220, y: Math.floor(i / 10) * 180 }; });
    project.components[0].position = { x: -600, y: -100 };
    for (let i = 0; i < wireCount; i++) {
      const a = 1 + i % (componentCount - 1), b = 1 + (a + Math.floor(i / (componentCount - 1))) % (componentCount - 1);
      project.wires.push({ id: `wire${i}`, from: { componentId: `c${a}`, pinId: "2" }, to: { componentId: `c${b}`, pinId: "1" }, color: "blue" });
    }
    let id = 0;
    const frames = new Map<number, () => void>();
    const clock: RoutingClock = { request(callback) { frames.set(++id, callback); return id; }, cancel(key) { frames.delete(key); }, now: () => performance.now() };
    const controller = new RoutingController(clock);
    const start = performance.now();
    controller.update(project.components, project.wires);
    let count = 0;
    while (frames.size) {
      const [key, callback] = frames.entries().next().value!; frames.delete(key); callback();
      if (++count > 30000) throw new Error("Routing did not finish");
    }
    const elapsed = performance.now() - start;
    console.info(JSON.stringify({ label, elapsedMs: Math.round(elapsed * 10) / 10, ...controller.stats }));
    expect(controller.getSnapshot().routes.size).toBe(wireCount);
    expect(controller.getSnapshot().pending).toBe(0);
    controller.endDrag();
    expect(controller.stats.cacheHits).toBe(wireCount);
    controller.dispose();
  }, 30000);
}
