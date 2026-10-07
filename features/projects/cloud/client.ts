import { emptyProject, useProject } from "../../simulator/stores/project-store";
import { useCanvas } from "../../simulator/stores/canvas-store";
import { stopSimulation, resetSimulation } from "../../simulator/worker/bridge";
import { loadResultSchema, projectListSchema, saveResultSchema } from "../contracts";
import { flushDraft, patchDraft, replaceDraft } from "../local/controller";
import { newDraft, removeMigratedGuest, type Draft } from "../local/drafts";
import { usePersistence } from "../store";
import { cloudRequest } from "./request";
export { cloudRequest } from "./request";
export function acknowledge(draft: Draft, pending: NonNullable<Draft["pending"]>, result: { id: string; revision: number }): Draft {
  return { ...draft, cloud: { ...result, owner: pending.owner }, savedLocalRevision: pending.localRevision, pending: null, saveIntent: false, guestSource: null, guestSourceRevision: null };
}
let flight: Promise<void> | null = null;
export function saveToCloud(): Promise<void> {
  if (flight) return flight;
  flight = performSave().finally(() => { flight = null; usePersistence.setState({ busy: false }); });
  return flight;
}
async function performSave() {
  const state = usePersistence.getState();
  const draft = state.draft; const owner = state.userId;
  if (!owner || !draft || draft.scope !== `user:${owner}`) throw new Error("Masuk sebelum menyimpan ke akun.");
  const pending = draft.pending ?? { owner, localRevision: draft.localRevision, request: { id: draft.cloud?.id ?? null, draftId: draft.id, expectedRevision: draft.cloud?.revision ?? 0, operationId: crypto.randomUUID(), payload: draft.project } };
  if (pending.owner !== owner) throw new Error("Draft berasal dari akun lain.");
  usePersistence.setState({ busy: true, status: "saving", error: null });
  patchDraft({ pending });
  try {
    // Persist the exact request before sending: a lost response can be safely replayed.
    await flushDraft();
    const parsed = saveResultSchema.safeParse(await cloudRequest("/api/projects", "POST", pending.request));
    if (!parsed.success) throw new Error("Konfirmasi simpan tidak valid. Draft tetap tersedia untuk retry.");
    const result = parsed.data;
    const latest = usePersistence.getState();
    if (latest.userId !== owner || latest.draft?.id !== draft.id || latest.draft.scope !== draft.scope) return;
    const synced = acknowledge(latest.draft, pending, result);
    patchDraft(synced);
    await flushDraft();
    if (draft.guestSource) await removeMigratedGuest(draft.guestSource, draft.guestSourceRevision);
    usePersistence.setState({ status: synced.localRevision === pending.localRevision ? "saved" : "unsaved", error: null });
  } catch (error) {
    if (usePersistence.getState().draft?.id === draft.id) usePersistence.setState({ status: "failed", error: error instanceof Error ? error.message : "Simpan gagal. Draft lokal tetap tersedia." });
    throw error;
  }
}
export async function requestSave() {
  usePersistence.setState({ error: null });
  if (usePersistence.getState().userId) return saveToCloud();
  const draft = usePersistence.getState().draft;
  if (!draft) throw new Error("Draft belum tersedia.");
  patchDraft({ saveIntent: true }); await flushDraft();
  return `/masuk?next=${encodeURIComponent(`/simulator?save=1&draft=${draft.id}`)}`;
}
export async function listCloudProjects() {
  const parsed = projectListSchema.safeParse(await cloudRequest("/api/projects"));
  if (!parsed.success) throw new Error("Daftar proyek cloud tidak valid.");
  return parsed.data;
}
export async function openCloudProject(id: string) {
  if (usePersistence.getState().busy) throw new Error("Tunggu penyimpanan selesai.");
  const owner = usePersistence.getState().userId;
  if (!owner) throw new Error("Masuk terlebih dahulu.");
  const parsed = loadResultSchema.safeParse(await cloudRequest(`/api/projects/${id}`));
  if (!parsed.success) throw new Error("Snapshot cloud tidak valid. Proyek aktif tidak diubah.");
  const loaded = parsed.data;
  if (usePersistence.getState().userId !== owner) throw new Error("Session berubah.");
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
  await cloudRequest(`/api/projects/${id}`, "DELETE", { expectedRevision: revision });
  const draft = usePersistence.getState().draft;
  if (draft?.cloud?.id === id) {
    // Keep the current circuit locally; detach it from the deleted cloud identity.
    await replaceDraft(newDraft(draft.scope, draft.project));
  }
}
