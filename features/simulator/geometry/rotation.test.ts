import { expect, it } from "vitest";
import { normalizeRotation, rotatePoint } from "./rotation";
import { getDefinition } from "../catalog/registry";
import { rotateLayout, visualLayout, visualPitch } from "../ui/visuals/pin-layout";
import { fixture } from "../tests/fixtures";
import { deserializeProject, serializeProject } from "../schemas/project-schema";
import { useProject } from "../stores/project-store";

it("normalizes old angles, including missing rotation, without changing wire IDs or positions", () => {
  const p = fixture({ board: "uno", led: "led" }, [["board.D13", "led.A"]], "");
  p.components[0].rotation = 359;
  p.components[1].rotation = 45;
  const loaded = deserializeProject(serializeProject(p));
  expect(loaded.components.map((c) => c.rotation)).toEqual([0, 90]);
  expect(loaded.components.map((c) => c.position)).toEqual(p.components.map((c) => c.position));
  expect(loaded.wires).toEqual(p.wires);
  const raw = JSON.parse(JSON.stringify(p)); delete raw.components[0].rotation;
  expect(deserializeProject(JSON.stringify(raw)).components[0].rotation).toBe(0);
  expect(normalizeRotation(-90)).toBe(270);
});

it("swaps exact bounds and cycles all four orientations without coordinate drift", () => {
  const base = visualLayout(getDefinition("uno"));
  const pin = base.anchors[0];
  const ninety = rotateLayout(base, 90);
  expect(ninety.width).toBe(base.height); expect(ninety.height).toBe(base.width);
  expect(ninety.anchors[0]).toMatchObject({ x: base.height - pin.y, y: pin.x, side: "right" });
  let point = { x: pin.x, y: pin.y }, width = base.width, height = base.height;
  for (let i = 0; i < 4; i++) { point = rotatePoint(point, width, height, 90); [width, height] = [height, width]; }
  expect(point).toEqual({ x: pin.x, y: pin.y });
});

it("rotation commands are undoable and never rewrite wire endpoints", () => {
  const p = fixture({ board: "uno", led: "led" }, [["board.D13", "led.A"]], "");
  useProject.setState({ project: p, past: [], future: [] });
  const store = useProject.getState();
  for (const rotation of [90, 180, 270, 360]) store.updateComponent("led", { rotation });
  expect(useProject.getState().project.components[1].rotation).toBe(0);
  store.undo(); expect(useProject.getState().project.components[1].rotation).toBe(270);
  store.redo(); expect(useProject.getState().project.components[1].rotation).toBe(0);
  expect(useProject.getState().project.wires).toEqual(p.wires);
});

it("small component lead spacing uses the shared breadboard pitch", () => {
  for (const [type, multiples] of [["led", 1], ["resistor", 4], ["button", 3]] as const) {
    const layout = visualLayout(getDefinition(type));
    expect(layout.anchors[1].x - layout.anchors[0].x).toBe(visualPitch * multiples);
  }
});
