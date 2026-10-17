import { afterEach, expect, it } from "vitest";
import { useProject, emptyProject } from "./project-store";
import { fixture } from "../tests/fixtures";

afterEach(() => useProject.setState({ project: emptyProject(), past: [], future: [] }));

it("moves a group in one notification and restores the whole gesture with Undo/Redo", () => {
  const project = fixture(Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`c${i}`, "resistor"])), [["c0.1", "c1.2"]], "keep code");
  useProject.setState({ project, past: [], future: [] });
  useProject.getState().checkpoint();
  let updates = 0;
  const unsubscribe = useProject.subscribe(() => updates++);
  const positions = new Map(project.components.map(c => [c.id, { x: c.position.x + 50, y: c.position.y + 30 }]));
  useProject.getState().move(positions);
  expect(updates).toBe(1);
  const moved = useProject.getState().project;
  expect(moved.wires).toBe(project.wires);
  expect(moved.code).toBe(project.code);
  expect(useProject.getState().past).toEqual([project]);
  useProject.getState().move(positions);
  expect(updates).toBe(1);
  useProject.getState().undo();
  expect(useProject.getState().project).toBe(project);
  useProject.getState().redo();
  expect(useProject.getState().project).toBe(moved);
  unsubscribe();
});

it("preserves unmoved component references and ignores stale node IDs", () => {
  const project = fixture({ a: "led", b: "resistor" }, [], "");
  useProject.setState({ project });
  useProject.getState().move(new Map([["a", { x: 10, y: 20 }], ["deleted", { x: 1, y: 2 }]]));
  expect(useProject.getState().project.components[1]).toBe(project.components[1]);
  expect(useProject.getState().project.components).toHaveLength(2);
});
