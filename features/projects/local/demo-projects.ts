import { isLocalDemo } from "@/features/auth/demo";
import { archivedDrafts, newDraft, readDraft, writeDraft, deleteDraft } from "./drafts";
import { titleSchema } from "../contracts";
import type { Project } from "@/features/simulator/types/project";

function requireDemo() { if (!isLocalDemo()) throw new Error("Mode demo lokal belum aktif."); }
const scope = (id: string) => `archive:demo:${id}`;
export async function listDemoProjects() {
  requireDemo();
  return archivedDrafts("demo");
}
export async function saveDemoProject(id: string, project: Project) {
  requireDemo();
  const previous = await readDraft(scope(id));
  const updatedAt = Math.max(Date.now(), (previous?.updatedAt ?? 0) + 1);
  await writeDraft({ ...newDraft(scope(id), project), id, updatedAt }, previous?.updatedAt ?? null);
}
export async function loadDemoProject(id: string) {
  requireDemo();
  const draft = await readDraft(scope(id));
  if (!draft) throw new Error("Proyek lokal tidak ditemukan.");
  return draft;
}
export async function renameDemoProject(id: string, name: string) {
  const draft = await loadDemoProject(id);
  await writeDraft({ ...draft, project: { ...draft.project, metadata: { name: titleSchema.parse(name) } }, updatedAt: Math.max(Date.now(), draft.updatedAt + 1) }, draft.updatedAt);
}
export async function deleteDemoProject(id: string) {
  const draft = await loadDemoProject(id);
  await deleteDraft(draft.scope, draft.updatedAt);
}
