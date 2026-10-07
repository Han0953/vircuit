import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { emptyProject, useProject } from "../../simulator/stores/project-store";
import { useSimulation } from "../../simulator/stores/simulation-store";
import { usePersistence } from "../store";
import { archivedDrafts, newDraft, readDraft, writeDraft } from "./drafts";
import { flushDraft, recoverDraft, replaceDraft } from "./controller";
describe("recovery coordination", () => {
  it("recovers before blank state can write and keeps runtime out of snapshots", async () => {
    const scope = crypto.randomUUID();
    const saved = newDraft(scope, { ...emptyProject(), metadata: { name: "Recovered project" }, viewport: { x: 11, y: 22, zoom: 2 }, code: { language: "arduino-cpp-subset", source: "void setup(){}void loop(){}" } });
    await writeDraft(saved, null);
    useProject.setState({ project: emptyProject() });
    await recoverDraft(scope);
    expect(useProject.getState().project).toEqual(saved.project);
    const before = await readDraft(scope);
    useSimulation.setState({ time: 1000, serial: "tick", outputs: {} });
    expect(await readDraft(scope)).toEqual(before);
    useProject.getState().edit((p) => ({ ...p, code: { ...p.code, source: "updated" } }), false);
    await flushDraft();
    expect((await readDraft(scope))?.project.code.source).toBe("updated");
    expect((await readDraft(scope))?.localRevision).toBe(saved.localRevision + 1);
  });
  it("backs up unsaved changes before switching and resets undo history", async () => {
    const scope = usePersistence.getState().draft!.scope;
    await replaceDraft(newDraft(scope, { ...emptyProject(), metadata: { name: "Another" } }));
    expect(useProject.getState().project.metadata.name).toBe("Another");
    expect(useProject.getState().past).toEqual([]);
    expect((await readDraft(scope))?.project.metadata.name).toBe("Another");
    const archived = await archivedDrafts(scope);
    expect(archived[0].project.code.source).toBe("updated");
    await replaceDraft({ ...archived[0], scope });
    expect(useProject.getState().project.code.source).toBe("updated");
  });
});
