import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { emptyProject, useProject } from "../simulator/stores/project-store";
import { usePersistence } from "./store";
import { archivedDrafts, readDraft, writeDraft } from "./local/drafts";
import { flushDraft, recoverDraft } from "./local/controller";
import { applyProjectCommand, parseProjectCommand } from "./handoff";
vi.mock("../simulator/worker/bridge", () => ({ resetSimulation: vi.fn(), stopSimulation: vi.fn() }));

describe("dashboard workspace handoff", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    const memory = new Map<string, string>();
    vi.stubGlobal("sessionStorage", { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value), removeItem: (key: string) => memory.delete(key) });
    const owner = crypto.randomUUID();
    usePersistence.setState({ userId: owner, busy: false, handoffBusy: false });
    await recoverDraft(`user:${owner}`);
  });
  it("validates commands and refuses ambiguous or invalid IDs", () => {
    expect(parseProjectCommand("save=1")).toBeNull();
    expect(() => parseProjectCommand("project=bad")).toThrow();
    expect(() => parseProjectCommand(`project=${crypto.randomUUID()}&new=${crypto.randomUUID()}`)).toThrow();
  });
  it("creates locally once and archives unsaved code; repeat after another draft does not recreate", async () => {
    useProject.getState().edit((p) => ({ ...p, code: { ...p.code, source: "unsaved code" } }));
    const command = { kind: "new" as const, id: crypto.randomUUID() };
    const fetcher = vi.spyOn(globalThis, "fetch");
    await applyProjectCommand(command);
    const draft = usePersistence.getState().draft!;
    expect(draft.id).toBe(command.id); expect(draft.cloud).toBeNull();
    expect((await archivedDrafts(draft.scope))[0].project.code.source).toBe("unsaved code");
    await applyProjectCommand(command);
    expect(usePersistence.getState().draft?.id).toBe(draft.id);
    await applyProjectCommand({ kind: "new", id: crypto.randomUUID() });
    const second = usePersistence.getState().draft!.id;
    await applyProjectCommand(command);
    expect(usePersistence.getState().draft?.id).toBe(second);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("does not replace dirty same-project drafts until cloud is explicitly chosen", async () => {
    const state = usePersistence.getState(); const id = crypto.randomUUID();
    const current = (await readDraft(state.draft!.scope))!;
    await writeDraft({ ...current, cloud: { id, revision: 1, owner: state.userId! } }, current.updatedAt);
    await recoverDraft(current.scope);
    const before = useProject.getState().project;
    const fetcher = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ id, revision: 2, payload: { ...emptyProject(), metadata: { name: "Cloud" } } }));
    expect(await applyProjectCommand({ kind: "open", id })).toBe("conflict");
    expect(await applyProjectCommand({ kind: "open", id }, "local")).toBe("done");
    expect(fetcher).not.toHaveBeenCalled(); expect(useProject.getState().project).toBe(before);
    await applyProjectCommand({ kind: "open", id }, "cloud");
    expect(useProject.getState().project.metadata.name).toBe("Cloud");
    expect((await archivedDrafts(current.scope)).length).toBeGreaterThan(0);
  });
  it("failed load keeps the current project and local backup intact", async () => {
    const before = useProject.getState().project;
    await flushDraft();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ error: "Snapshot tidak didukung" }, { status: 422 }));
    await expect(applyProjectCommand({ kind: "open", id: crypto.randomUUID() })).rejects.toThrow("Snapshot");
    expect(useProject.getState().project).toBe(before);
    expect((await readDraft(usePersistence.getState().draft!.scope))?.project).toEqual(before);
  });
});
