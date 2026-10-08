import { expect, it } from "vitest";
import { fixture } from "../tests/fixtures";
import { componentGeometry, worldPins } from "./component-geometry";
import { rotateLayout, visualLayout } from "../ui/visuals/pin-layout";
import { getDefinition } from "../catalog/registry";

it("shares exact rotated world anchors and bounds without changing the component", () => {
  const component = fixture({ r: "resistor" }, [], "").components[0];
  component.position = { x: -133.25, y: 500 };
  for (const rotation of [0, 90, 180, 270]) {
    component.rotation = rotation;
    const before = structuredClone(component);
    const layout = rotateLayout(visualLayout(getDefinition(component.type)), rotation);
    const geometry = componentGeometry(component);
    expect(geometry.bounds).toEqual({ ...component.position, width: layout.width, height: layout.height });
    expect(worldPins(component)).toEqual(layout.anchors.map((a) => ({ ...a, x: a.x + component.position.x, y: a.y + component.position.y })));
    expect(component).toEqual(before);
  }
});

it("identifies breadboard surfaces while retaining real hole IDs", () => {
  const breadboard = fixture({ b: "breadboard-mini" }, [], "").components[0];
  const geometry = componentGeometry(breadboard);
  expect(geometry.surface).toBe(true);
  expect(geometry.anchors.find((a) => a.pin.id === "A1")).toBeDefined();
});
