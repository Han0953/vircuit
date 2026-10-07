import { usePersistence } from "@/features/projects/store";
import { cloudRequest } from "@/features/projects/cloud/request";
import { newDraft } from "@/features/projects/local/drafts";
import { replaceDraft } from "@/features/projects/local/controller";
import { resetSimulation } from "@/features/simulator/worker/bridge";
import { useCanvas } from "@/features/simulator/stores/canvas-store";
import { practiceResultSchema, type PracticeCommand } from "./practice-contract";

let flight: Promise<"confirm" | "done"> | null = null;
export function applyPractice(command: PracticeCommand, confirmed = false) {
  if (flight) return flight;
  flight = perform(command, confirmed).finally(() => { flight = null; });
  return flight;
}
async function perform(command: PracticeCommand, confirmed: boolean): Promise<"confirm" | "done"> {
  const state = usePersistence.getState();
  if (!state.ready || !state.draft || !state.userId || state.busy) throw new Error("Tunggu session dan draft siap sebelum membuka praktik.");
  const result = practiceResultSchema.parse(await cloudRequest(`/api/learning/practice?${new URLSearchParams({ lesson: command.lessonId, practice: command.intent })}`));
  const latest = usePersistence.getState();
  if (latest.userId !== state.userId || latest.draft?.id !== state.draft.id || result.owner !== state.userId) throw new Error("Session atau project aktif berubah. Coba lagi.");
  if (result.context.intent !== command.intent || result.context.lessonId !== command.lessonId) throw new Error("Konfirmasi praktik tidak sesuai.");
  const key = `vircuit-practice:${state.userId}:${command.intent}`;
  let acknowledged = false;
  try { acknowledged = sessionStorage.getItem(key) === "done"; } catch { acknowledged = false; }
  if (latest.draft.learningContext?.intent === command.intent || acknowledged) return "done";
  if (!confirmed) return "confirm";
  const draft = { ...newDraft(latest.draft.scope, result.project), id: command.intent, learningContext: result.context };
  await replaceDraft(draft, true);
  const installed = usePersistence.getState().draft;
  if (!usePersistence.getState().ready || installed?.id !== command.intent) throw new Error("Praktik belum dipulihkan. Draft tersimpan tetap tersedia.");
  try { sessionStorage.setItem(key, "done"); } catch {
    // IndexedDB draft identity still prevents replay when sessionStorage is unavailable.
  }
  resetSimulation(); useCanvas.getState().select([]);
  return "done";
}
