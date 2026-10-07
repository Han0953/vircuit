import { beforeEach, expect, it } from "vitest";
import { useProject, emptyProject } from "../stores/project-store";
beforeEach(() => useProject.setState({ project: emptyProject(), past: [], future: [] }));
it("places unique instances, edits, duplicates, and undoes deletion", () => {
  const s = useProject.getState(); s.add("led", { x: 10, y: 20 });
  const first = useProject.getState().project.components[0];
  s.duplicate([first.id]);
  expect(useProject.getState().project.components[1].id).not.toBe(first.id);
  s.updateComponent(first.id, { rotation: 90 });
  s.remove([first.id]); s.undo();
  expect(useProject.getState().project.components[0].rotation).toBe(90);
  s.redo(); expect(useProject.getState().project.components).toHaveLength(1);
});
