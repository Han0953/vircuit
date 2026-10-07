import { expect, it } from "vitest";
import { useProject, emptyProject } from "../stores/project-store";
import { validConnection } from "../validation/wires";
it("validates logical endpoints and deletes incident wires", () => {
  useProject.setState({ project: emptyProject() });
  const s = useProject.getState(); s.add("led", { x: 0, y: 0 }); s.add("resistor", { x: 200, y: 0 });
  const [a, b] = useProject.getState().project.components;
  const from = { componentId: a.id, pinId: "A" }; const to = { componentId: b.id, pinId: "1" };
  expect(validConnection(useProject.getState().project, from, to)).toBe(true);
  expect(validConnection(useProject.getState().project, from, from)).toBe(false);
  s.edit((p) => ({ ...p, wires: [{ id: "w", from, to, color: "blue" }] }));
  s.updateComponent(a.id, { position: { x: 55, y: 99 } });
  expect(useProject.getState().project.wires[0].from).toEqual(from);
  expect(validConnection(useProject.getState().project, to, from)).toBe(false);
  s.remove([a.id]); expect(useProject.getState().project.wires).toHaveLength(0);
});
