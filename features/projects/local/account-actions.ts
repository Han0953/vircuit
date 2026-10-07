import { newDraft, readDraft, writeDraft } from "./drafts";
import { replaceDraft } from "./controller";
import { usePersistence } from "../store";

export async function detachDeletedProject(owner: string, projectId: string) {
  const scope = `user:${owner}`;
  const active = usePersistence.getState();
  if (active.userId === owner && active.ready && active.draft?.cloud?.id === projectId) {
    await replaceDraft(newDraft(scope, active.draft.project));
  } else {
    const draft = await readDraft(scope);
    if (draft?.cloud?.id === projectId) await writeDraft({ ...newDraft(scope, draft.project), updatedAt: Math.max(Date.now(), draft.updatedAt + 1) }, draft.updatedAt);
  }
}
