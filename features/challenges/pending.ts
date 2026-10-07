import { z } from "zod";
import { evaluationSchema, submissionSchema, type Submission, type Evaluation } from "./contracts";
export const pendingSchema = z.object({ key: z.string(), owner: z.uuid(), createdAt: z.number(), submission: submissionSchema, preview: evaluationSchema });
export type PendingSubmission = z.infer<typeof pendingSchema>;
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("vircuit-learning", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("submissions", { keyPath: "key" }).createIndex("owner", "owner");
    request.onsuccess = () => resolve(request.result);
    request.onerror = request.onblocked = () => reject(new Error("Antrean hasil lokal belum dapat diakses."));
  });
}
export async function pendingSubmissions(owner: string): Promise<PendingSubmission[]> {
  z.uuid().parse(owner);
  const db = await open();
  try {
    const raw = await new Promise<unknown[]>((resolve, reject) => {
      const request = db.transaction("submissions").objectStore("submissions").index("owner").getAll(owner);
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(new Error("Antrean hasil belum dapat dibaca."));
    });
    const valid = raw.map((item) => pendingSchema.parse(item));
    return valid.filter((item) => item.owner === owner && item.key === `${owner}:${item.submission.operationId}`).sort((a, b) => a.createdAt - b.createdAt);
  } finally { db.close(); }
}
export async function queueSubmission(owner: string, submission: Submission, preview: Evaluation) {
  const item = pendingSchema.parse({ key: `${owner}:${submission.operationId}`, owner, submission, preview, createdAt: Date.now() });
  if (submission.operationId !== preview.submissionId || submission.challengeId !== preview.challengeId || submission.version !== preview.version) throw new Error("Preview tidak sesuai submission.");
  const db = await open();
  try {
    return await new Promise<PendingSubmission>((resolve, reject) => {
      const tx = db.transaction("submissions", "readwrite"); const store = tx.objectStore("submissions");
      let result = item; let message = "Hasil belum tersimpan lokal. Coba lagi sebelum mengirim.";
      const read = store.index("owner").getAll(owner);
      read.onsuccess = () => {
        try {
          const entries = pendingSchema.array().parse(read.result);
          const sameOperation = entries.find((old) => old.submission.operationId === submission.operationId);
          if (sameOperation && sameOperation.preview.fingerprint !== preview.fingerprint) throw new Error("Submission ID sudah dipakai untuk snapshot lain.");
          const previous = entries.find((old) => old.preview.fingerprint === preview.fingerprint);
          if (previous) { result = previous; return; }
          if (entries.length >= 10) throw new Error("Antrean berisi 10 hasil. Sinkronkan hasil yang tertunda sebelum membuat submission baru.");
          store.put(item);
        } catch (cause) { message = cause instanceof Error ? cause.message : message; tx.abort(); }
      };
      tx.oncomplete = () => resolve(result);
      tx.onabort = tx.onerror = () => reject(new Error(message));
    });
  } finally { db.close(); }
}
export async function acknowledgeSubmission(item: PendingSubmission) {
  const db = await open();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("submissions", "readwrite"); const store = tx.objectStore("submissions");
      const read = store.get(item.key);
      read.onsuccess = () => {
        const parsed = pendingSchema.safeParse(read.result);
        if (parsed.success && parsed.data.owner === item.owner && parsed.data.preview.fingerprint === item.preview.fingerprint) store.delete(item.key);
      };
      tx.oncomplete = () => resolve(); tx.onabort = tx.onerror = () => reject(new Error("Konfirmasi lokal belum tersimpan. Retry aman dengan submission yang sama."));
    });
  } finally { db.close(); }
}
export async function clearPendingAccount(owner: string) {
  z.uuid().parse(owner);
  const db = await open();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("submissions", "readwrite"); const store = tx.objectStore("submissions"); const request = store.index("owner").openCursor(owner);
      request.onsuccess = () => { const cursor = request.result; if (cursor) { cursor.delete(); cursor.continue(); } };
      tx.oncomplete = () => resolve(); tx.onabort = tx.onerror = () => reject(new Error("Cache submission akun belum dapat dibersihkan."));
    });
  } finally { db.close(); }
}
