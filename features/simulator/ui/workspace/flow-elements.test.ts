import { expect, it } from "vitest";
import { FlowElements } from "./flow-elements";
import { fixture } from "../../tests/fixtures";
import { previewRoute } from "../../routing/route-geometry";

it("retains unaffected node/edge objects while updating move, selection, color and route changes", () => {
  const project = fixture({ a: "resistor", b: "resistor", c: "led" }, [["a.2", "b.1"]], "");
  const elements = new FlowElements();
  const nodes = elements.componentNodes(project.components, []), edges = elements.wireEdges(project.wires, [], new Map());
  const changed = project.components.map((c) => c.id === "a" ? { ...c, position: { x: 80, y: 20 } } : c);
  const next = elements.componentNodes(changed, []);
  expect(next[0]).not.toBe(nodes[0]); expect(next[1]).toBe(nodes[1]); expect(next[2]).toBe(nodes[2]);
  expect(elements.wireEdges(project.wires, [], new Map())[0]).toBe(edges[0]);
  const route = previewRoute({ x: 0, y: 0, side: "right" }, { x: 200, y: 200, side: "left" });
  const routed = elements.wireEdges(project.wires, [], new Map([["w0", route]]));
  expect(routed[0]).not.toBe(edges[0]);
  expect(elements.wireEdges(project.wires, [], new Map([["w0", route]]))[0]).toBe(routed[0]);
  const selected = elements.wireEdges(project.wires, ["w0"], new Map([["w0", route]]));
  expect(selected[0].selected).toBe(true);
  const red = elements.wireEdges(project.wires.map((w) => ({ ...w, color: "red" })), [], new Map([["w0", route]]));
  expect(red[0].style?.stroke).toBe("var(--destructive)");
  expect(elements.componentNodes([], [])).toEqual([]); expect(elements.wireEdges([], [], new Map())).toEqual([]);
});
