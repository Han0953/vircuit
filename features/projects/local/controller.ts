import { emptyProject, useProject } from "../../simulator/stores/project-store";
import { usePersistence } from "../store";
import { newDraft, readDraft, writeDraft, type Draft } from "./drafts";

let timer: ReturnType<typeof setTimeout> | undefined;
let unsubscribe: (() => void) | undefined;
let storedAt: number | null = null;
let writes: Promise<void> = Promise.resolve();
let generation = 0;
function suspend() { unsubscribe?.(); unsubscribe = undefined; clearTimeout(timer); }
function observeProject() {
  unsubscribe = useProject.subscribe((state, previous) => {
    if (state.project === previous.project) return;
    const current = usePersistence.getState().draft;
    if (!current) return;
    usePersistence.setState({ draft: { ...current, project: state.project, localRevision: current.localRevision + 1 }, status: "unsaved" });
    clearTimeout(timer);
    timer = setTimeout(() => { void flushDraft().catch(() => {}); }, 600);
  });
}
export async function recoverDraft(scope: string) {
  const run = ++generation;
  suspend();
  usePersistence.setState({ ready: false, draft: null, localError: null });
  try {
    await writes.catch(() => {});
    const recovered = await readDraft(scope);
    if (run !== generation) return;
    storedAt = recovered?.updatedAt ?? null;
    const draft = recovered ?? newDraft(scope, emptyProject());
    useProject.setState({ project: draft.project, past: [], future: [] });
    usePersistence.setState({ ready: true, draft, status: draft.cloud && draft.savedLocalRevision === draft.localRevision ? "saved" : "unsaved" });
    observeProject();
    await flushDraft();
  } catch {
    if (run === generation) usePersistence.setState({ localError: "Draft tidak dapat dipulihkan. Data tersimpan tidak ditimpa. Coba lagi atau gunakan browser dengan IndexedDB aktif." });
  }
}
export function patchDraft(patch: Partial<Draft>) {
  const current = usePersistence.getState().draft;
  if (current) usePersistence.setState({ draft: { ...current, ...patch } });
}
function enqueueDraft(snapshot: Draft): Promise<void> {
  writes = writes.catch(() => {}).then(async () => {
    const draft = { ...snapshot, updatedAt: Math.max(Date.now(), (storedAt ?? 0) + 1) };
    try {
      await writeDraft(draft, storedAt);
      storedAt = draft.updatedAt;
      usePersistence.setState({ localError: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Penyimpanan lokal gagal.";
      usePersistence.setState({ localError: message }); throw new Error(message);
    }
  });
  return writes;
}
export function flushDraft(): Promise<void> {
  clearTimeout(timer);
  const state = usePersistence.getState();
  if (!state.ready || !state.draft) return Promise.reject(new Error("Pemulihan draft belum selesai."));
  return enqueueDraft(state.draft);
}
export async function replaceDraft(draft: Draft, backup = false) {
  const current = usePersistence.getState().draft;
  if (!current || !usePersistence.getState().ready) throw new Error("Draft belum siap.");
  // Freeze the editor before capturing the final backup; edits during a network
  // load remain included, while no edits can race the local replacement.
  suspend(); usePersistence.setState({ ready: false });
  try {
    await enqueueDraft(current);
    const previous = await readDraft(draft.scope);
    if (previous && (backup || previous.savedLocalRevision !== previous.localRevision)) {
      const archive = { ...previous, scope: `archive:${previous.scope}:${previous.id}:${previous.updatedAt}` };
      if (!await readDraft(archive.scope)) await writeDraft(archive, null);
    }
    await writeDraft({ ...draft, updatedAt: Math.max(Date.now(), (previous?.updatedAt ?? 0) + 1) }, previous?.updatedAt ?? null);
    await recoverDraft(draft.scope);
  } catch (error) {
    // Re-open the last safely stored active draft, never an empty replacement.
    await recoverDraft(current.scope);
    throw error;
  }
}
export function clearPrivateState(owner: string) {
  if (usePersistence.getState().userId !== owner) return;
  suspend(); generation++;
  usePersistence.setState({ ready: false, draft: null, userId: null, error: null, localError: null, status: "unsaved" });
  useProject.setState({ project: emptyProject(), past: [], future: [] });
}
