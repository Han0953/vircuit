import { beforeEach, expect, it } from "vitest";
import { useCanvas } from "../stores/canvas-store";
import { emptyProject, useProject } from "../stores/project-store";
import { circuitIds, updateSelection, validSelection } from "../stores/selection";
import { fixture } from "./fixtures";

beforeEach(() => { useProject.setState({ project: emptyProject(), past: [], future: [] }); useCanvas.getState().select([]); });
const circuit = () => fixture({ board: "uno", led: "led", r: "resistor" }, [["board.D3", "r.1"], ["r.2", "led.A"], ["led.K", "board.GND"]], 'void setup(){pinMode(3,OUTPUT);}void loop(){digitalWrite(3,HIGH);delay(10);}');

it("mixed node and wire selection merges, deduplicates and prunes obsolete identities", () => {
  const p = circuit();
  expect(circuitIds(p)).toHaveLength(6);
  expect(updateSelection(["led", "w0"], [{ id: "board", selected: true }, { id: "w0", selected: false }])).toEqual(["led", "board"]);
  expect(validSelection(p, ["led", "w0", "missing", "led"])).toEqual(["led", "w0"]);
  useCanvas.getState().select(["led", "led", "w0"]);
  expect(useCanvas.getState().selection).toEqual(["led", "w0"]);
});

it("mixed deletion removes incident wires atomically and one Undo restores the exact circuit", () => {
  const p = circuit(); useProject.setState({ project: p });
  useProject.getState().remove(["r", "w2"]);
  const state = useProject.getState();
  expect(state.project.components.map((c) => c.id)).toEqual(["board", "led"]);
  expect(state.project.wires).toEqual([]);
  expect(state.past).toHaveLength(1);
  state.undo(); expect(useProject.getState().project).toEqual(p);
  state.redo(); expect(useProject.getState().project.wires).toEqual([]);
});

it("clear circuit preserves code, metadata and viewport, resets board and supports Undo/Redo", () => {
  const p = circuit(); p.metadata.name = "Proyek tersimpan"; p.viewport = { x: 40, y: 50, zoom: 2 };
  useProject.setState({ project: p }); useProject.getState().clearCircuit();
  const cleared = useProject.getState().project;
  expect(cleared).toMatchObject({ components: [], wires: [], code: p.code, metadata: p.metadata, viewport: p.viewport, settings: { boardId: null } });
  useProject.getState().undo(); expect(useProject.getState().project).toEqual(p);
  useProject.getState().redo(); expect(useProject.getState().project).toEqual(cleared);
});

it("empty deletes and wire-only duplicate do not dirty the project or consume history", () => {
  const p = circuit(); useProject.setState({ project: p });
  useProject.getState().remove([]); useProject.getState().remove(["missing"]); useProject.getState().duplicate(["w0"]);
  expect(useProject.getState().project).toBe(p); expect(useProject.getState().past).toEqual([]);
  useProject.setState({ project: emptyProject() }); useProject.getState().clearCircuit();
  expect(useProject.getState().past).toEqual([]);
});
