import { clearAccountDrafts } from "@/features/projects/local/drafts";
import { clearPrivateState, flushDraft } from "@/features/projects/local/controller";
import { cloudRequest } from "@/features/projects/cloud/request";
import { usePersistence } from "@/features/projects/store";
import { clearPendingAccount } from "@/features/challenges/pending";
import { clearCirraAccount } from "@/features/ai/ui/session-store";

export async function logoutAccount(owner: string) {
  const state = usePersistence.getState();
  if (state.busy) throw new Error("Tunggu penyimpanan selesai sebelum keluar.");
  if (state.userId === owner && state.ready) await flushDraft();
  await cloudRequest("/api/auth/logout", "POST", {});
  clearPrivateState(owner);
  clearCirraAccount(owner);
  try { await clearAccountDrafts(owner); await clearPendingAccount(owner); }
  finally {
    const channel = new BroadcastChannel("vircuit-auth");
    channel.postMessage("signed-out"); channel.close();
  }
}
