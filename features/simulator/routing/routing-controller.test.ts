import { expect, it } from "vitest";
import { RoutingController, type RoutingClock } from "./routing-controller";
import { fixture } from "../tests/fixtures";
import { useProject } from "../stores/project-store";

function scheduler() {
  let id = 0, time = 0;
  const callbacks = new Map<number, () => void>();
  const clock: RoutingClock = { request(callback) { callbacks.set(++id, callback); return id; }, cancel(key) { callbacks.delete(key); }, now() { return time += 0.5; } };
  return { clock, callbacks, flush() { let guard = 0; while (callbacks.size) { const [key, callback] = callbacks.entries().next().value!; callbacks.delete(key); callback(); if (++guard > 10000) throw new Error("Scheduler did not finish"); } } };
}

function setup() {
  const project = fixture({ board: "uno", r: "resistor" }, [["board.D13", "r.1"]], "");
  project.components[1].position = { x: 800, y: 40 };
  const frames = scheduler(), controller = new RoutingController(frames.clock);
  return { project, frames, controller };
}

it("keeps routing isolated from project changes, history and persistence subscriptions", () => {
  const { project, controller, frames } = setup();
  useProject.setState({ project, past: [], future: [] });
  let changes = 0;
  const unsubscribe = useProject.subscribe(() => changes++);
  const before = structuredClone(project);
  controller.update(project.components, project.wires); frames.flush();
  expect(controller.getSnapshot().pending).toBe(0);
  expect(controller.getSnapshot().routes.get("w0")?.status).not.toBe("fallback");
  expect(useProject.getState().project).toBe(project);
  expect(project).toEqual(before); expect(changes).toBe(0); expect(useProject.getState().past).toEqual([]);
  unsubscribe(); controller.dispose();
});

it("does not reroute presentation, code or runtime-independent edits", () => {
  const { project, controller, frames } = setup();
  controller.update(project.components, project.wires); frames.flush();
  const snapshot = controller.getSnapshot();
  project.components[0].label = "Title"; project.components[0].properties.value = 2;
  project.code.source = "Changed"; project.viewport.zoom = 3; project.wires[0].color = "red";
  controller.update(project.components, project.wires);
  expect(controller.getSnapshot()).toBe(snapshot); expect(frames.callbacks.size).toBe(0);
  controller.endDrag(); frames.flush(); expect(controller.stats.cacheHits).toBe(1);
});

it("uses immediate drag previews then reroutes after snap, including unrelated obstacles", () => {
  const { project, controller, frames } = setup();
  controller.update(project.components, project.wires); frames.flush();
  controller.beginDrag();
  project.components[1].position.y = 700;
  controller.update(project.components, project.wires);
  expect(frames.callbacks.size).toBe(0);
  expect(controller.getSnapshot().routes.get("w0")?.status).toBe("fallback");
  const latest = controller.getSnapshot().routes.get("w0")?.points.at(-1);
  controller.endDrag(); frames.flush();
  expect(controller.getSnapshot().routes.get("w0")?.points.at(-1)).toEqual(latest);
  const revision = controller.getSnapshot().revision;
  project.components.push({ ...project.components[1], id: "obstacle", position: { x: 750, y: 600 } });
  controller.update(project.components, project.wires); frames.flush();
  expect(controller.getSnapshot().revision).toBeGreaterThan(revision);
});

it("rejects stale frame callbacks and drops deleted wire caches across project changes", () => {
  const { project, controller, frames } = setup();
  controller.update(project.components, project.wires);
  const stale = [...frames.callbacks.values()][0];
  project.components[1].rotation = 90;
  controller.update(project.components, project.wires);
  const revision = controller.getSnapshot().revision;
  stale(); expect(controller.getSnapshot().revision).toBe(revision);
  frames.flush();
  controller.update(project.components, []); frames.flush();
  expect(controller.getSnapshot().routes.size).toBe(0);
  controller.dispose();
});

it("reinitializes safely after effect cleanup and resumes frame-limited search", () => {
  const { project, controller, frames } = setup();
  controller.update(project.components, project.wires);
  controller.dispose();
  controller.update(project.components, project.wires); frames.flush();
  expect(controller.getSnapshot().pending).toBe(0);
  expect(controller.getSnapshot().routes.size).toBe(1);
  expect(controller.stats.frames).toBeGreaterThan(0);
  expect(controller.stats.maxBatchMs).toBeLessThanOrEqual(5);
});
