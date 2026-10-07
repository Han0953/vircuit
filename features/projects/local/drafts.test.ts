import "fake-indexeddb/auto";
import { describe, expect, it, vi } from "vitest";
import { emptyProject } from "../../simulator/stores/project-store";
import { adoptGuest, clearAccountDrafts, DraftConflict, newDraft, readDraft, removeMigratedGuest, writeDraft } from "./drafts";

describe("IndexedDB draft safety", () => {
  it("recovers a compatible snapshot with stable identity and code", async () => {
    const scope = crypto.randomUUID();
    expect(await readDraft(scope)).toBeNull();
    const draft = newDraft(scope, { ...emptyProject(), code: { language: "arduino-cpp-subset", source: "void setup() {}" } });
    await writeDraft(draft, null);
    expect(await readDraft(scope)).toEqual(draft);
    const edited = { ...draft, updatedAt: draft.updatedAt + 1, localRevision: 1 };
    await writeDraft(edited, draft.updatedAt);
    await expect(writeDraft(draft, draft.updatedAt)).rejects.toBeInstanceOf(DraftConflict);
    expect((await readDraft(scope))?.localRevision).toBe(1);
  });
  it("rejects invalid snapshots before writing", async () => {
    const draft = newDraft(crypto.randomUUID(), emptyProject());
    await expect(writeDraft({ ...draft, project: { ...draft.project, schemaVersion: 2 } } as unknown as typeof draft, null)).rejects.toThrow();
    expect(await readDraft(draft.scope)).toBeNull();
  });
  it("handles storage failure without replacing the previous draft", async () => {
    const draft = newDraft(crypto.randomUUID(), emptyProject());
    await writeDraft(draft, null);
    const put = vi.spyOn(IDBObjectStore.prototype, "put").mockImplementationOnce(() => { throw new DOMException("quota", "QuotaExceededError"); });
    await expect(writeDraft({ ...draft, localRevision: 1 }, draft.updatedAt)).rejects.toThrow("Draft gagal disimpan");
    put.mockRestore();
    expect((await readDraft(draft.scope))?.localRevision).toBe(0);
  });
  it("migrates only explicit intent, keeps guest until ack, and scopes account cache", async () => {
    const owner = crypto.randomUUID();
    const guest = newDraft("guest", emptyProject());
    await writeDraft(guest, null);
    expect(await adoptGuest(owner, guest.id)).toBe(false);
    await writeDraft({ ...guest, saveIntent: true, updatedAt: guest.updatedAt + 1 }, guest.updatedAt);
    expect(await adoptGuest(owner, crypto.randomUUID())).toBe(false);
    expect(await adoptGuest(owner, guest.id)).toBe(true);
    expect((await readDraft("guest"))?.id).toBe(guest.id);
    expect((await readDraft(`user:${owner}`))?.guestSource).toBe(guest.id);
    // Repeated callback reuses the adopted identity.
    expect(await adoptGuest(owner, guest.id)).toBe(true);
    await clearAccountDrafts(owner);
    expect(await readDraft(`user:${owner}`)).toBeNull();
    expect((await readDraft("guest"))?.id).toBe(guest.id);
    await removeMigratedGuest("wrong-id");
    expect(await readDraft("guest")).not.toBeNull();
    await removeMigratedGuest(guest.id);
    expect(await readDraft("guest")).toBeNull();
  });
});
