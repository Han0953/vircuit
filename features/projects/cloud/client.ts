import { emptyProject, useProject } from "../../simulator/stores/project-store";
import { useCanvas } from "../../simulator/stores/canvas-store";
import { stopSimulation, resetSimulation } from "../../simulator/worker/bridge";
import { loadResultSchema, projectListSchema, saveResultSchema } from "../contracts";
import { flushDraft, patchDraft, replaceDraft } from "../local/controller";
import { newDraft, removeMigratedGuest, type Draft } from "../local/drafts";
import { usePersistence } from "../store";
import { cloudRequest } from "./request";
import { CloudError } from "./request";
import { detachDeletedProject } from "../local/account-actions";
export { cloudRequest } from "./request";
export function acknowledge(draft: Draft, pending: NonNullable<Draft["pending"]>, result: { id: string; revision: number }): Draft {
  return { ...draft, cloud: { ...result, owner: pending.owner }, savedLocalRevision: pending.localRevision, pending: null, saveIntent: false, guestSource: null, guestSourceRevision: null };
}
let flight: Promise<void> | null = null;
export function saveToCloud(): Promise<void> {
  if (flight) return flight;
  if (usePersistence.getState().busy) return Promise.reject(new Error("Tunggu operasi proyek selesai."));
  flight = performSave().finally(() => { flight = null; usePersistence.setState({ busy: false }); });
  return flight;
}
async function performSave() {
  const state = usePersistence.getState();
  const draft = state.draft; const owner = state.userId;
  if (!state.ready || !owner || !draft || draft.scope !== `user:${owner}`) throw new Error("Masuk dan tunggu draft siap sebelum menyimpan ke akun.");
  if (draft.cloud && !draft.pending && draft.localRevision === draft.savedLocalRevision) {
    usePersistence.setState({ status: "saved", error: null, failure: null }); return;
  }
  const pending = draft.pending ?? { owner, localRevision: draft.localRevision, request: { id: draft.cloud?.id ?? null, draftId: draft.id, expectedRevision: draft.cloud?.revision ?? 0, operationId: crypto.randomUUID(), payload: draft.project } };
  if (pending.owner !== owner) throw new Error("Draft berasal dari akun lain.");
  usePersistence.setState({ busy: true, status: "saving", error: null, failure: null });
  patchDraft({ pending });
  try {
    // Persist the exact request before sending: a lost response can be safely replayed.
    await flushDraft();
    const parsed = saveResultSchema.safeParse(await cloudRequest("/api/projects", "POST", pending.request, { "X-Vircuit-Account": owner }));
    if (!parsed.success) throw new Error("Konfirmasi simpan tidak valid. Draft tetap tersedia untuk retry.");
    const result = parsed.data;
    const latest = usePersistence.getState();
    if (latest.userId !== owner || latest.draft?.id !== draft.id || latest.draft.scope !== draft.scope) return;
    const synced = acknowledge(latest.draft, pending, result);
    patchDraft(synced);
    await flushDraft();
    if (draft.guestSource) await removeMigratedGuest(draft.guestSource, draft.guestSourceRevision);
    const current = usePersistence.getState();
    if (current.userId === owner && current.draft?.id === draft.id) usePersistence.setState({ status: current.draft.localRevision === pending.localRevision ? "saved" : "unsaved", error: null });
  } catch (error) {
    if (usePersistence.getState().draft?.id === draft.id) usePersistence.setState({ status: "failed", failure: error instanceof CloudError && error.status === 409 ? "conflict" : error instanceof CloudError && (error.status === 0 || error.status === 503) ? "network" : "other", error: error instanceof Error ? error.message : "Simpan gagal. Draft lokal tetap tersedia." });
    throw error;
  }
}
export async function requestSave() {
  usePersistence.setState({ error: null });
  if (usePersistence.getState().userId) { patchDraft({ cloudPaused: false }); return saveToCloud(); }
  const draft = usePersistence.getState().draft;
  if (!draft) throw new Error("Draft belum tersedia.");
  patchDraft({ saveIntent: true }); await flushDraft();
  const path = typeof window !== "undefined" && window.location.pathname === "/simulator/code" ? "/simulator/code" : "/simulator";
  return `/masuk?next=${encodeURIComponent(`${path}?save=1&draft=${draft.id}`)}`;
}
export async function listCloudProjects() {
  const parsed = projectListSchema.safeParse(await cloudRequest("/api/projects"));
  if (!parsed.success) throw new Error("Daftar proyek cloud tidak valid.");
  return parsed.data;
}
export async function openCloudProject(id: string, discardLocal = false) {
  if (usePersistence.getState().busy) throw new Error("Tunggu penyimpanan selesai.");
  const owner = usePersistence.getState().userId;
  if (!owner) throw new Error("Masuk terlebih dahulu.");
  const active = usePersistence.getState().draft;
  if (!discardLocal && active?.cloud?.id === id && active.localRevision !== active.savedLocalRevision) throw new CloudError("Perubahan lokal belum tersimpan. Pilih versi cloud secara eksplisit atau simpan sebagai proyek baru.", 409);
  const parsed = loadResultSchema.safeParse(await cloudRequest(`/api/projects/${id}`));
  if (!parsed.success) throw new Error("Snapshot cloud tidak valid. Proyek aktif tidak diubah.");
  const loaded = parsed.data;
  if (usePersistence.getState().userId !== owner) throw new Error("Sesi berubah.");
  const latest = usePersistence.getState().draft;
  if (latest?.id !== active?.id || (!discardLocal && latest?.cloud?.id === id && latest.localRevision !== latest.savedLocalRevision)) throw new CloudError("Draft berubah selama memuat. Proyek aktif tidak diubah; coba buka kembali.", 409);
  const draft = { ...newDraft(`user:${owner}`, loaded.payload), cloud: { id, revision: loaded.revision, owner }, savedLocalRevision: 0 };
  // Validation and local backup complete before replacing the live simulator.
  await replaceDraft(draft);
  stopSimulation(); resetSimulation(); useCanvas.getState().select([]);
}
export async function newProject() {
  const state = usePersistence.getState(); if (!state.draft || state.busy) return;
  await replaceDraft(newDraft(state.draft.scope, emptyProject()));
  stopSimulation(); resetSimulation(); useCanvas.getState().select([]);
}
export async function saveAsNew() {
  const state = usePersistence.getState(); if (!state.draft || !state.userId || state.busy) return;
  await replaceDraft(newDraft(state.draft.scope, useProject.getState().project));
  await saveToCloud();
}
export async function deleteCloudProject(id: string, revision: number) {
  if (usePersistence.getState().busy) throw new Error("Tunggu penyimpanan selesai.");
  const owner = usePersistence.getState().userId;
  if (!owner) throw new Error("Masuk terlebih dahulu.");
  usePersistence.setState({ busy: true });
  try {
    await cloudRequest(`/api/projects/${id}`, "DELETE", { expectedRevision: revision });
    await detachDeletedProject(owner, id);
    const channel = new BroadcastChannel("vircuit-projects");
    channel.postMessage({ type: "deleted", owner, id }); channel.close();
  } finally { usePersistence.setState({ busy: false }); }
}
