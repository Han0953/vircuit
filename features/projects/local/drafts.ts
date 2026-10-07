import { z } from "zod";
import { projectSchema } from "../../simulator/schemas/project-schema";
import type { Project } from "../../simulator/types/project";
import { saveRequestSchema } from "../contracts";
import { learningContextSchema } from "@/features/learning/schema";

export const draftSchema = z.object({
  id: z.uuid(), scope: z.string().min(1), project: projectSchema,
  localRevision: z.number().int().nonnegative(), savedLocalRevision: z.number().int().min(-1),
  cloud: z.object({ id: z.uuid(), revision: z.number().int().positive(), owner: z.uuid() }).nullable(),
  saveIntent: z.boolean(), updatedAt: z.number(),
  guestSource: z.uuid().nullable().default(null),
  guestSourceRevision: z.number().int().nonnegative().nullable().default(null),
  learningContext: learningContextSchema.nullable().default(null),
  pending: z.object({ request: saveRequestSchema, localRevision: z.number().int().nonnegative(), owner: z.uuid() }).nullable().default(null),
});
export type Draft = z.infer<typeof draftSchema>;
export function newDraft(scope: string, project: Project): Draft {
  return { id: crypto.randomUUID(), scope, project, localRevision: 0, savedLocalRevision: -1, cloud: null, saveIntent: false, updatedAt: Date.now(), pending: null, guestSource: null, guestSourceRevision: null, learningContext: null };
}
export class DraftConflict extends Error { constructor() { super("Draft berubah di tab lain. Muat ulang sebelum melanjutkan."); } }
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("vircuit-projects", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("drafts", { keyPath: "scope" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Penyimpanan lokal tidak tersedia."));
    request.onblocked = () => reject(new Error("Tutup tab Vircuit lain untuk membuka penyimpanan."));
  });
}
export async function readDraft(scope: string): Promise<Draft | null> {
  const db = await openDatabase();
  try {
    const value = await new Promise<unknown>((resolve, reject) => {
      const request = db.transaction("drafts").objectStore("drafts").get(scope);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error("Draft tidak dapat dibaca."));
    });
    return value === undefined ? null : draftSchema.parse(value);
  } finally { db.close(); }
}
// Compare-and-swap inside one IndexedDB transaction prevents stale tabs overwriting recovery data.
export async function writeDraft(draft: Draft, expectedUpdatedAt: number | null): Promise<void> {
  draftSchema.parse(draft);
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("drafts", "readwrite");
      const store = transaction.objectStore("drafts");
      let conflict = false;
      const request = store.get(draft.scope);
      request.onsuccess = () => {
        const current = request.result as { updatedAt?: number } | undefined;
        if ((current?.updatedAt ?? null) !== expectedUpdatedAt) { conflict = true; transaction.abort(); return; }
        try { store.put(draft); } catch { transaction.abort(); }
      };
      transaction.oncomplete = () => resolve();
      transaction.onabort = transaction.onerror = () => reject(conflict ? new DraftConflict() : new Error("Draft gagal disimpan. Ekspor JSON untuk cadangan."));
    });
  } finally { db.close(); }
}

export async function adoptGuest(owner: string, draftId: string): Promise<boolean> {
  const guest = await readDraft("guest");
  if (!guest || !guest.saveIntent || guest.id !== draftId) return false;
  const scope = `user:${owner}`;
  const account = await readDraft(scope);
  if (account?.id === guest.id) return true;
  // Preserve any older account draft before explicitly adopting the guest project.
  if (account) {
    const archivedScope = `archive:${scope}:${account.id}:${account.updatedAt}`;
    if (!await readDraft(archivedScope)) await writeDraft({ ...account, scope: archivedScope }, null);
  }
  await writeDraft({ ...guest, scope, cloud: null, pending: null, guestSource: guest.id, guestSourceRevision: guest.localRevision, updatedAt: Math.max(Date.now(), (account?.updatedAt ?? 0) + 1) }, account?.updatedAt ?? null);
  return true;
}
export async function removeMigratedGuest(id: string, revision?: number | null) {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("drafts", "readwrite"); const store = tx.objectStore("drafts");
      const request = store.get("guest");
      request.onsuccess = () => { const value = request.result as Draft | undefined; if (value?.id === id && (revision === undefined || value.localRevision === revision)) store.delete("guest"); };
      tx.oncomplete = () => resolve(); tx.onabort = tx.onerror = () => reject(new Error("Draft guest belum dapat dibersihkan."));
    });
  } finally { db.close(); }
}
export async function clearAccountDrafts(owner: string) {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("drafts", "readwrite"); const store = tx.objectStore("drafts");
      const cursor = store.openCursor();
      cursor.onsuccess = () => {
        const item = cursor.result;
        if (!item) return;
        const scope = String(item.key);
        if (scope === `user:${owner}` || scope.startsWith(`archive:user:${owner}:`)) item.delete();
        item.continue();
      };
      tx.oncomplete = () => resolve(); tx.onabort = tx.onerror = () => reject(new Error("Cache akun tidak dapat dibersihkan."));
    });
  } finally { db.close(); }
}
export async function archivedDrafts(scope: string): Promise<Draft[]> {
  const db = await openDatabase();
  try {
    const values = await new Promise<unknown[]>((resolve, reject) => {
      const prefix = `archive:${scope}:`;
      const request = db.transaction("drafts").objectStore("drafts").getAll(IDBKeyRange.bound(prefix, prefix + "\uffff"));
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(new Error("Arsip draft tidak dapat dibaca."));
    });
    return values.flatMap((value) => { const parsed = draftSchema.safeParse(value); return parsed.success ? [parsed.data] : []; }).sort((a, b) => b.updatedAt - a.updatedAt);
  } finally { db.close(); }
}
export async function deleteDraft(scope: string, expectedUpdatedAt: number) {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("drafts", "readwrite"); const store = tx.objectStore("drafts");
      let conflict = false;
      const request = store.get(scope);
      request.onsuccess = () => {
        const current = request.result as { updatedAt?: number } | undefined;
        if (current?.updatedAt !== expectedUpdatedAt) { conflict = true; tx.abort(); return; }
        store.delete(scope);
      };
      tx.oncomplete = () => resolve();
      tx.onabort = tx.onerror = () => reject(conflict ? new DraftConflict() : new Error("Proyek lokal gagal dihapus."));
    });
  } finally { db.close(); }
}
