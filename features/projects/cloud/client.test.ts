import { beforeEach, describe, expect, it, vi } from "vitest";
import { emptyProject, useProject } from "../../simulator/stores/project-store";
import { newDraft } from "../local/drafts";
import { usePersistence } from "../store";
vi.mock("../local/controller", () => ({ flushDraft: vi.fn(async () => {}), patchDraft: (patch: object) => usePersistence.setState((s) => ({ draft: s.draft ? { ...s.draft, ...patch } : null })), replaceDraft: vi.fn() }));
import { acknowledge, openCloudProject, saveToCloud } from "./client";
import { canAutosave } from "./autosave";
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
  it("autosaves a new account project only after an edit, never blank, guest or deleted drafts", () => {
    const state = usePersistence.getState();
    expect(canAutosave(state)).toBe(false);
    const draft = { ...state.draft!, localRevision: 1 };
    expect(canAutosave({ ...state, draft })).toBe(true);
    expect(canAutosave({ ...state, draft, userId: null })).toBe(false);
    expect(canAutosave({ ...state, draft: { ...draft, scope: "guest" } })).toBe(false);
    expect(canAutosave({ ...state, draft: { ...draft, cloudPaused: true } })).toBe(false);
    expect(canAutosave({ ...state, draft, ready: false })).toBe(false);
    expect(canAutosave({ ...state, draft, handoffBusy: true })).toBe(false);
    expect(canAutosave({ ...state, draft, error: "conflict" })).toBe(false);
  });
  it("does not create snapshots for repeated saves of a clean project", async () => {
    usePersistence.setState((s) => ({ draft: { ...s.draft!, cloud: { id, owner, revision: 1 }, savedLocalRevision: 0 } }));
    const fetcher = vi.spyOn(globalThis, "fetch");
    await saveToCloud(); await saveToCloud();
    expect(fetcher).not.toHaveBeenCalled(); expect(usePersistence.getState().status).toBe("saved");
  });
  it("keeps newer edits dirty when an older in-flight save succeeds", async () => {
    let respond!: (response: Response) => void;
    vi.spyOn(globalThis, "fetch").mockImplementation(() => new Promise((resolve) => { respond = resolve; }));
    const saving = saveToCloud();
    await vi.waitFor(() => expect(respond).toBeTypeOf("function"));
    usePersistence.setState((s) => ({ draft: { ...s.draft!, localRevision: 1, project: { ...s.draft!.project, metadata: { name: "Newer edit" } } } }));
    respond(Response.json({ id, revision: 1 })); await saving;
    expect(usePersistence.getState().status).toBe("unsaved");
    expect(canAutosave(usePersistence.getState())).toBe(true);
    expect(usePersistence.getState().draft?.project.metadata.name).toBe("Newer edit");
  });
  it("keeps pending payload and local changes on revision conflict", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ error: "Revision berbeda" }, { status: 409 }));
    await expect(saveToCloud()).rejects.toMatchObject({ status: 409 });
    expect(usePersistence.getState().failure).toBe("conflict");
    expect(usePersistence.getState().draft?.pending).not.toBeNull();
    expect(canAutosave(usePersistence.getState())).toBe(false);
  });
  it("refuses to replace same-project unsaved edits through the menu load path", async () => {
    usePersistence.setState((s) => ({ draft: { ...s.draft!, cloud: { id, owner, revision: 1 }, localRevision: 2, savedLocalRevision: 1 } }));
    const fetcher = vi.spyOn(globalThis, "fetch");
    await expect(openCloudProject(id)).rejects.toMatchObject({ status: 409 });
    expect(fetcher).not.toHaveBeenCalled();
  });
});
