import { beforeEach, describe, expect, it, vi } from "vitest";
import { emptyProject, useProject } from "../../simulator/stores/project-store";
import { newDraft } from "../local/drafts";
import { usePersistence } from "../store";
vi.mock("../local/controller", () => ({ flushDraft: vi.fn(async () => {}), patchDraft: (patch: object) => usePersistence.setState((s) => ({ draft: s.draft ? { ...s.draft, ...patch } : null })), replaceDraft: vi.fn() }));
import { acknowledge, openCloudProject, saveToCloud } from "./client";
const owner = "11111111-1111-4111-8111-111111111111";
const id = "22222222-2222-4222-8222-222222222222";
describe("save coordinator", () => {
  beforeEach(() => { vi.restoreAllMocks(); usePersistence.setState({ ready: true, draft: newDraft(`user:${owner}`, emptyProject()), userId: owner, busy: false, error: null }); });
  it("older acknowledgements do not mark newer edits clean", () => {
    const draft = { ...newDraft(`user:${owner}`, emptyProject()), localRevision: 2 };
    const pending = { owner, localRevision: 1, request: { id: null, draftId: draft.id, operationId: crypto.randomUUID(), expectedRevision: 0, payload: draft.project } };
    const next = acknowledge(draft, pending, { id, revision: 1 });
    expect(next.localRevision).toBe(2); expect(next.savedLocalRevision).toBe(1);
  });
  it("preserves exact request on failure and replays it on retry", async () => {
    const fetcher = vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(Response.json({ id, revision: 1 }));
    await expect(saveToCloud()).rejects.toThrow("Koneksi cloud gagal");
    const pending = usePersistence.getState().draft!.pending;
    expect(pending).not.toBeNull(); expect(usePersistence.getState().status).toBe("failed");
    await saveToCloud();
    expect(JSON.parse(fetcher.mock.calls[0][1]!.body as string)).toEqual(JSON.parse(fetcher.mock.calls[1][1]!.body as string));
    expect(usePersistence.getState().draft!.pending).toBeNull(); expect(usePersistence.getState().status).toBe("saved");
  });
  it("failed load never replaces current circuit", async () => {
    const active = useProject.getState().project;
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ error: "foreign" }, { status: 404 }));
    await expect(openCloudProject(id)).rejects.toThrow(); expect(useProject.getState().project).toBe(active);
  });
});
