import { expect, it } from "vitest";
import { intersects } from "./route-geometry";
import { routeWire, routeWireSteps } from "./orthogonal-router";
import { buildRoutingScene, geometrySignature, wireInput } from "./routing-scene";
import { directions, type RoutingInput } from "./types";
import { fixture } from "../tests/fixtures";
import { serializeProject, deserializeProject } from "../schemas/project-schema";
import { buildCircuit } from "../graph/circuit";
import { runtimeProjectChanged } from "../runtime/project-changes";

function verify(input: RoutingInput) {
  const before = structuredClone(input), route = routeWire(input);
  expect(input).toEqual(before);
  expect(route.points[0]).toEqual({ x: input.source.x, y: input.source.y });
  expect(route.points.at(-1)).toEqual({ x: input.target.x, y: input.target.y });
  for (let i = 1; i < route.points.length; i++) {
    const a = route.points[i - 1], b = route.points[i];
    expect([a.x, a.y, b.x, b.y].every(Number.isFinite)).toBe(true);
    expect(a.x === b.x || a.y === b.y).toBe(true);
    if (route.status !== "fallback") for (const obstacle of input.obstacles) {
      if (i === 1 && obstacle.id === input.source.owner || i === route.points.length - 1 && obstacle.id === input.target.owner) continue;
      expect(intersects(a, b, obstacle)).toBe(false);
    }
  }
  expect(routeWire(input)).toEqual(route);
  return route;
}

it("routes all directions and negative/large coordinates through valid escapes", () => {
  for (const side of directions) for (const targetSide of directions) {
    expect(verify({ source: { x: -99000, y: 50, side }, target: { x: 200, y: -100, side: targetSide }, obstacles: [] }).status).not.toBe("fallback");
  }
});

it("avoids obstacles including a maze that needs compressed-graph A*", () => {
  const base: RoutingInput = { source: { x: 0, y: 0, side: "right" }, target: { x: 300, y: 0, side: "left" }, obstacles: [{ id: "middle", x: 90, y: -40, width: 100, height: 80 }] };
  expect(verify(base).status).toBe("astar");
  expect(verify({ ...base, obstacles: [...base.obstacles, { id: "upper", x: 200, y: -80, width: 30, height: 90 }] }).status).not.toBe("fallback");
});

it("honors own-body corridors but falls back safely for overlapping blocked ports and exhausted budgets", () => {
  const input: RoutingInput = { source: { x: 12, y: 24, side: "left", owner: "r", bounds: { x: 0, y: 0, width: 120, height: 48 } }, target: { x: -200, y: 24, side: "right" }, obstacles: [{ id: "r", x: -8, y: -8, width: 136, height: 64 }] };
  expect(verify(input).status).toBe("simple");
  expect(verify({ ...input, obstacles: [...input.obstacles, { id: "blocked", x: 0, y: 0, width: 20, height: 48 }] }).status).toBe("fallback");
  const blocked: RoutingInput = { source: { x: 0, y: 0, side: "right" }, target: { x: 300, y: 0, side: "left" }, obstacles: [{ id: "o", x: 90, y: -40, width: 100, height: 80 }] };
  expect(routeWire(blocked, 0).status).toBe("fallback");
  expect(routeWire(blocked, 2).explored).toBeLessThanOrEqual(2);
});

it("handles narrow corridors and coincident endpoints", () => {
  verify({ source: { x: 0, y: 0, side: "right" }, target: { x: 300, y: 0, side: "left" }, obstacles: [{ id: "top", x: 20, y: -20, width: 250, height: 19 }, { id: "bottom", x: 20, y: 1, width: 250, height: 20 }] });
  expect(verify({ source: { x: 5, y: 5, side: "left" }, target: { x: 5, y: 5, side: "right" }, obstacles: [] }).status).toBe("coincident");
});

it("keeps breadboard surfaces routable, rotation-aware, and snapshot v1 electrically unchanged", () => {
  const project = fixture({ b: "breadboard-mini", r: "resistor" }, [["b.A2", "r.1"]], "");
  project.components[1].position = { x: 500, y: 90 };
  for (const rotation of [0, 90, 180, 270]) {
    project.components[0].rotation = rotation;
    const before = serializeProject(project), graph = buildCircuit(project);
    const scene = buildRoutingScene(project.components, project.wires);
    expect(scene.obstacles.some((o) => o.id === "b")).toBe(false);
    expect(verify(wireInput(scene, project.wires[0])!).status).not.toBe("fallback");
    expect(serializeProject(project)).toBe(before);
    expect(deserializeProject(before).wires).toEqual(project.wires);
    expect(buildCircuit(project)).toEqual(graph);
    expect(runtimeProjectChanged(project, deserializeProject(before))).toBe(false);
  }
});

it("excludes code, color, labels, properties and viewport from routing identity", () => {
  const project = fixture({ board: "uno", led: "led" }, [["board.D13", "led.A"]], "");
  const signature = geometrySignature(project.components, project.wires);
  project.code.source = "new code"; project.viewport.zoom = 2; project.wires[0].color = "red";
  project.components[0].label = "renamed"; project.components[1].properties.value = 1;
  expect(geometrySignature(project.components, project.wires)).toBe(signature);
  project.components[1].rotation = 90;
  expect(geometrySignature(project.components, project.wires)).not.toBe(signature);
});

it("allows obstacle search to yield cooperatively instead of blocking for the entire search", () => {
  const input: RoutingInput = { source: { x: 0, y: 0, side: "right" }, target: { x: 300, y: 0, side: "left" }, obstacles: [{ id: "o", x: 90, y: -40, width: 100, height: 80 }] };
  const task = routeWireSteps(input);
  let ticks = 0, step = task.next();
  while (!step.done) { ticks++; step = task.next(); }
  expect(ticks).toBeGreaterThan(1); expect(step.value.status).toBe("astar");
});

it("does not merge nets when two real pin-to-pin routes cross", () => {
  const project = fixture({ a: "resistor", b: "resistor", c: "led", d: "led" }, [["a.2", "b.1"], ["c.A", "d.A"]], "");
  project.components[0].position = { x: 0, y: 0 }; project.components[1].position = { x: 400, y: 0 };
  project.components[2].position = { x: 240, y: -140 }; project.components[3].position = { x: 216, y: 148 };
  project.components[3].rotation = 180;
  const scene = buildRoutingScene(project.components, project.wires);
  const horizontal = verify(wireInput(scene, project.wires[0])!), vertical = verify(wireInput(scene, project.wires[1])!);
  expect(horizontal.points).toEqual([{ x: 108, y: 24 }, { x: 412, y: 24 }]);
  expect(vertical.points).toEqual([{ x: 252, y: -80 }, { x: 252, y: 160 }]);
  const graph = buildCircuit(project);
  expect(graph.netByPin.get("a.2")).not.toBe(graph.netByPin.get("c.A"));
  expect(project.wires).toHaveLength(2);
});
