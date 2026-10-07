import "fake-indexeddb/auto";
import { describe, expect, it, vi } from "vitest";
import { logoutAccount } from "./logout";
import { newDraft, readDraft, writeDraft } from "@/features/projects/local/drafts";
import { emptyProject } from "@/features/simulator/stores/project-store";
import { usePersistence } from "@/features/projects/store";

describe("dashboard logout without workspace initialization", () => {
  it("logs out and clears only the current account, keeping guest and unrelated drafts", async () => {
    const owner = crypto.randomUUID(); const other = crypto.randomUUID();
    const account = newDraft(`user:${owner}`, emptyProject());
    await writeDraft(account, null);
    await writeDraft(newDraft(`user:${other}`, emptyProject()), null);
    await writeDraft(newDraft("guest", emptyProject()), null);
    usePersistence.setState({ ready: false, draft: null, userId: null, busy: false });
    const fetcher = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ ok: true }));
    await logoutAccount(owner);
    expect(fetcher).toHaveBeenCalledWith("/api/auth/logout", expect.objectContaining({ method: "POST" }));
    expect(await readDraft(account.scope)).toBeNull();
    expect(await readDraft("guest")).not.toBeNull();
    expect(await readDraft(`user:${other}`)).not.toBeNull();
    fetcher.mockRestore();
  });
});
