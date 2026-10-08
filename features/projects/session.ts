import { z } from "zod";
import { browserClient } from "@/lib/supabase/browser";
import { useCanvas } from "../simulator/stores/canvas-store";
import { resetSimulation } from "../simulator/worker/bridge";
import { adoptGuest } from "./local/drafts";
import { logoutAccount } from "@/features/auth/logout";
import { flushDraft, recoverDraft } from "./local/controller";
import { cloudRequest, saveToCloud } from "./cloud/client";
import { usePersistence } from "./store";
import { detachDeletedProject } from "./local/account-actions";
const sessionSchema = z.object({ user: z.object({ id: z.uuid(), email: z.string().optional() }).nullable() });
let initialization: Promise<void> | null = null;
export function initializeWorkspace() {
  if (initialization) return initialization;
  initialization = initialize().finally(() => { initialization = null; });
  return initialization;
}
async function initialize() {
  const { user } = sessionSchema.parse(await cloudRequest("/api/auth/session"));
  const previous = usePersistence.getState();
  if (previous.ready && previous.userId === (user?.id ?? null)) return;
  if (previous.ready) {
    try { await flushDraft(); } catch { /* Session changes must still clear private in-memory state. Existing disk data is not overwritten. */ }
  }
  const query = new URLSearchParams(window.location.search);
  const intendedDraft = query.get("draft");
  let migrate = false;
  if (user && query.get("save") === "1" && z.uuid().safeParse(intendedDraft).success) migrate = await adoptGuest(user.id, intendedDraft!);
  usePersistence.setState({ userId: user?.id ?? null, error: null, status: "unsaved" });
  resetSimulation(); useCanvas.getState().select([]);
  await recoverDraft(user ? `user:${user.id}` : "guest");
  if (migrate && usePersistence.getState().ready) {
    try { await saveToCloud(); window.history.replaceState(null, "", window.location.pathname); } catch { /* Retry retains the exact operation and local draft. */ }
  }
}
export function watchAuth() {
  const channel = new BroadcastChannel("vircuit-auth");
  channel.onmessage = () => { void initializeWorkspace().catch(() => {}); };
  const projects = new BroadcastChannel("vircuit-projects");
  projects.onmessage = ({ data }: MessageEvent<unknown>) => {
    const event = z.object({ type: z.literal("deleted"), owner: z.uuid(), id: z.uuid() }).safeParse(data);
    if (!event.success || event.data.owner !== usePersistence.getState().userId) return;
    usePersistence.setState({ error: "Proyek dihapus di tab lain. Draft lokal tetap tersedia." });
    void detachDeletedProject(event.data.owner, event.data.id).catch((cause: unknown) => usePersistence.setState({ error: cause instanceof Error ? cause.message : "Draft lokal belum dapat diperbarui." }));
  };
  let unsubscribe: (() => void) | undefined;
  try {
    const { data } = browserClient().auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" || event === "SIGNED_IN") setTimeout(() => { void initializeWorkspace().catch(() => {}); }, 0);
    });
    unsubscribe = () => data.subscription.unsubscribe();
  } catch { /* Missing cloud configuration must not disable guest mode. */ }
  const focus = () => { void initializeWorkspace().catch(() => {}); };
  window.addEventListener("focus", focus);
  return () => { channel.close(); projects.close(); unsubscribe?.(); window.removeEventListener("focus", focus); };
}
export async function logout() {
  const state = usePersistence.getState();
  if (!state.userId || state.busy) return;
  try {
    await logoutAccount(state.userId);
    resetSimulation(); useCanvas.getState().select([]);
    await recoverDraft("guest");
  } finally { usePersistence.setState({ busy: false }); }
}
