import { expect, it } from "vitest";
import { buildCircuit, validateCircuit } from "../graph/circuit";
import { serializeProject, deserializeProject } from "../schemas/project-schema";
import { emptyProject, useProject } from "../stores/project-store";
it("breadboard groups connect rows but preserve trench and separate resistor terminals", () => {
  useProject.setState({ project: emptyProject() }); const s = useProject.getState();
  s.add("breadboard-mini", { x: 0, y: 0 }); s.add("resistor", { x: 1, y: 1 });
  const p = useProject.getState().project; const [b, r] = p.components; const g = buildCircuit(p);
  expect(g.netByPin.get(`${b.id}.A1`)).toBe(g.netByPin.get(`${b.id}.E1`));
  expect(g.netByPin.get(`${b.id}.A1`)).not.toBe(g.netByPin.get(`${b.id}.F1`));
  expect(g.netByPin.get(`${r.id}.1`)).not.toBe(g.netByPin.get(`${r.id}.2`));
  expect(deserializeProject(serializeProject(p))).toEqual(p);
  expect(() => deserializeProject('{"schemaVersion":2}')).toThrow();
});
it("blocks a supply short", () => {
  useProject.setState({ project: emptyProject() }); useProject.getState().add("uno", { x: 0, y: 0 });
  const p = useProject.getState().project; const id = p.components[0].id;
  p.wires = [{ id: "short", from: { componentId: id, pinId: "5V" }, to: { componentId: id, pinId: "GND" }, color: "red" }];
  expect(validateCircuit(p).some((p) => p.id.startsWith("short-") && p.severity === "error")).toBe(true);
});
