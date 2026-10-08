import { expect, it } from "vitest";
import { getDefinition } from "../catalog/registry";
import { fixture } from "../tests/fixtures";
import { componentFootprint, worldPins, findBreadboardPlacement } from "./breadboard-placement";
import { buildCircuit } from "../graph/circuit";
import { serializeProject, deserializeProject } from "../schemas/project-schema";
import { rotateLayout, visualLayout } from "../ui/visuals/pin-layout";

it("footprints reuse real pins and only explicitly eligible components", () => {
  for (const type of ["led", "resistor", "button"]) expect(componentFootprint(type)?.pins.map((p) => p.pin.id)).toEqual(getDefinition(type).pins.map((p) => p.id));
  for (const type of ["uno", "nano", "esp32", "pot", "dht22"]) expect(componentFootprint(type)).toBeNull();
});

it.each([0, 90, 180, 270])("snaps an LED at %i degrees with a rotated/moved breadboard", (rotation) => {
  const project = fixture({ bread: "breadboard-half", led: "led" }, [], "");
  const [board, led] = project.components;
  board.rotation = rotation; board.position = { x: 200, y: 70 };
  led.rotation = (rotation + 90) % 360;
  const target = worldPins(board).find((p) => p.pin.id === "C4")!;
  const pin = rotateLayout(visualLayout(getDefinition("led")), led.rotation).anchors[0];
  led.position = { x: target.x - pin.x + 3, y: target.y - pin.y - 4 };
  const result = findBreadboardPlacement(led, project.components);
  expect(result?.valid).toBe(true);
  if (!result?.valid) throw Error("No placement");
  expect(result.holes.map((h) => h.holeId)).toEqual(["C4", "C5"]);
  led.position = result.position;
  expect(worldPins(led).map((p) => [p.x, p.y])).toEqual(result.holes.map((p) => [p.x, p.y]));
});

it("rejects shared strip, occupied holes, rails, edge/out-of-range and free placement", () => {
  const project = fixture({ bread: "breadboard-mini", led: "led" }, [], "");
  const [board, led] = project.components;
  const anchor = worldPins(board).find((p) => p.pin.id === "A1")!;
  led.position = { x: anchor.x - 12, y: anchor.y - 60 };
  expect(findBreadboardPlacement(led, project.components)).toMatchObject({ valid: false });
  led.rotation = 90; led.position = { x: anchor.x - 12, y: anchor.y - 12 };
  const valid = findBreadboardPlacement(led, project.components);
  expect(valid?.valid).toBe(true);
  if (!valid?.valid) throw Error("No placement");
  led.position = valid.position;
  const another = { ...led, id: "other" };
  expect(findBreadboardPlacement(another, [...project.components, another])).toMatchObject({ valid: false });
  led.position = { x: 10000, y: -10000 }; expect(findBreadboardPlacement(led, project.components)).toBeNull();
  led.position = { x: anchor.x - 12, y: anchor.y - 12 + 16 * 24 };
  expect(findBreadboardPlacement(led, project.components)).toMatchObject({ valid: false });
});

it("button abstraction crosses the central gap without inventing four electrical terminals", () => {
  const p = fixture({ b: "breadboard-half", button: "button" }, [], "");
  const target = worldPins(p.components[0]).find((h) => h.pin.id === "E4")!;
  p.components[1].position = { x: target.x - 12, y: target.y - 36 };
  expect(findBreadboardPlacement(p.components[1], p.components)).toMatchObject({ valid: true, holes: [{ pinId: "1", holeId: "E4" }, { pinId: "2", holeId: "F4" }] });
});

it("visual alignment never creates electrical connections and survives v1 serialization", () => {
  const p = fixture({ b: "breadboard-half", r: "resistor" }, [], "");
  p.components[1].rotation = 90;
  const target = worldPins(p.components[0]).find((h) => h.pin.id === "B2")!;
  p.components[1].position = { x: target.x - 24, y: target.y - 12 };
  const snap = findBreadboardPlacement(p.components[1], p.components);
  expect(snap?.valid).toBe(true); if (snap?.valid) p.components[1].position = snap.position;
  const graph = buildCircuit(p);
  expect(graph.netByPin.get("r.1")).not.toBe(graph.netByPin.get("b.B2"));
  const reload = deserializeProject(serializeProject(p));
  expect(reload).toEqual(p);
  expect(findBreadboardPlacement(reload.components[1], reload.components)?.valid).toBe(true);
  p.components = p.components.filter((c) => c.id !== "b");
  expect(buildCircuit(p).netByPin.has("b.B2")).toBe(false);
  expect(p.wires).toHaveLength(0);
});

it("rail placement is rejected and explicit wires use the same electrical groups at any rotation", () => {
  const p = fixture({ b: "breadboard-half", led: "led" }, [["b.A4", "led.A"]], "");
  const rail = worldPins(p.components[0]).find((h) => h.pin.id === "L+4")!;
  p.components[1].rotation = 90;
  p.components[1].position = { x: rail.x - 12, y: rail.y - 12 };
  expect(findBreadboardPlacement(p.components[1], p.components)).toMatchObject({ valid: false, reason: expect.stringContaining("rail") });
  for (const rotation of [0, 90, 180, 270]) {
    p.components[0].rotation = rotation;
    p.components[1].rotation = rotation;
    const graph = buildCircuit(p);
    expect(graph.netByPin.get("led.A")).toBe(graph.netByPin.get("b.E4"));
    expect(graph.netByPin.get("b.A4")).not.toBe(graph.netByPin.get("b.F4"));
    expect(graph.netByPin.get("b.L+1")).toBe(graph.netByPin.get("b.L+30"));
    expect(graph.netByPin.get("b.L+1")).not.toBe(graph.netByPin.get("b.R+1"));
  }
});
