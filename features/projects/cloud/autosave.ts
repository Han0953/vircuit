import type { usePersistence } from "../store";

export function canAutosave(state: ReturnType<typeof usePersistence.getState>) {
  const { ready, draft, userId, busy, handoffBusy, error } = state;
  if (!ready || !draft || !userId || draft.scope !== `user:${userId}` || busy || handoffBusy || error || draft.cloudPaused) return false;
  if (draft.localRevision === draft.savedLocalRevision && !draft.pending) return false;
  return !!draft.cloud || !!draft.pending || draft.localRevision > 0 || draft.saveIntent;
}
