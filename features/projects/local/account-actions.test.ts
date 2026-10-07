import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { newDraft, readDraft, writeDraft } from "./drafts";
import { detachDeletedProject } from "./account-actions";
import { emptyProject } from "../../simulator/stores/project-store";
import { useProject } from "../../simulator/stores/project-store";
import { recoverDraft } from "./controller";
import { usePersistence } from "../store";

describe("delete keeps a detached local draft", () => {
  it("preserves code and components while removing deleted cloud identity", async () => {
    const owner = crypto.randomUUID(); const id = crypto.randomUUID();
    const draft = { ...newDraft(`user:${owner}`, emptyProject()), cloud: { id, revision: 3, owner } };
    await writeDraft(draft, null);
    await detachDeletedProject(owner, crypto.randomUUID());
    expect((await readDraft(draft.scope))?.cloud?.id).toBe(id);
    await detachDeletedProject(owner, id);
    const saved = await readDraft(draft.scope);
    expect(saved?.cloud).toBeNull(); expect(saved?.pending).toBeNull();
    expect(saved?.project).toEqual(draft.project); expect(saved?.id).not.toBe(draft.id);
  });
  it("detaches an active dirty project without losing edits or allowing cloud autosave", async () => {
    const owner = crypto.randomUUID(); const id = crypto.randomUUID();
    const draft = { ...newDraft(`user:${owner}`, emptyProject()), cloud: { id, revision: 2, owner }, savedLocalRevision: 0 };
    await writeDraft(draft, null);
    usePersistence.setState({ userId: owner }); await recoverDraft(draft.scope);
    useProject.getState().edit((project) => ({ ...project, code: { ...project.code, source: "unsaved active code" } }));
    await detachDeletedProject(owner, id);
    expect(useProject.getState().project.code.source).toBe("unsaved active code");
    expect(usePersistence.getState().draft?.cloud).toBeNull();
    expect(usePersistence.getState().draft?.pending).toBeNull();
    expect((await readDraft(draft.scope))?.project.code.source).toBe("unsaved active code");
  });
});
