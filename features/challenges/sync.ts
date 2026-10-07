import { cloudRequest } from "@/features/projects/cloud/request";
import { verifiedResultSchema } from "./contracts";
import { acknowledgeSubmission, type PendingSubmission } from "./pending";
const flights = new Map<string, Promise<ReturnType<typeof verifiedResultSchema.parse>>>();
export function syncSubmission(item: PendingSubmission) {
  const existing = flights.get(item.key);
  if (existing) return existing;
  const task = perform(item).finally(() => flights.delete(item.key));
  flights.set(item.key, task); return task;
}
async function perform(item: PendingSubmission) {
  const response = verifiedResultSchema.parse(await cloudRequest("/api/challenges/submit", "POST", item.submission, { "X-Vircuit-Account": item.owner }));
  if (response.owner !== item.owner || response.operationId !== item.submission.operationId || response.result.submissionId !== item.submission.operationId || response.result.fingerprint !== item.preview.fingerprint)
    throw new Error("Konfirmasi server tidak sesuai. Submission lokal tetap tersedia.");
  await acknowledgeSubmission(item);
  return response;
}
