import { z } from "zod";
import { isLocalDemo } from "@/features/auth/demo";
import { emptyProject } from "../simulator/stores/project-store";
import { resetSimulation } from "../simulator/worker/bridge";
import { useCanvas } from "../simulator/stores/canvas-store";
import { usePersistence } from "./store";
import { newDraft } from "./local/drafts";
import { replaceDraft } from "./local/controller";
import { openCloudProject } from "./cloud/client";

export type ProjectCommand = { kind: "new" | "open"; id: string };
export function parseProjectCommand(query: string): ProjectCommand | null {
  const params = new URLSearchParams(query);
  const kind = params.has("project") ? "open" : params.has("new") ? "new" : null;
  if (!kind) return null;
  const id = params.get(kind === "open" ? "project" : "new");
  if (!z.uuid().safeParse(id).success || (params.has("project") && params.has("new"))) throw new Error("Tautan proyek tidak valid.");
  return { kind, id: id! };
}
export async function applyProjectCommand(command: ProjectCommand, choice?: "local" | "cloud") {
  const state = usePersistence.getState();
  if (!state.ready || !state.draft || !state.userId) throw new Error("Session dan draft harus siap sebelum membuka proyek.");
  if (state.busy) throw new Error("Tunggu penyimpanan selesai, lalu coba lagi.");
  if (command.kind === "open") {
    if ((state.draft.cloud?.id === command.id || (isLocalDemo() && state.draft.id === command.id)) && state.draft.localRevision !== state.draft.savedLocalRevision) {
      if (!choice) return "conflict";
      if (choice === "local") return "done";
    }
    await openCloudProject(command.id);
    return "done";
  }
  const key = `vircuit-new:${state.userId}:${command.id}`;
  if (state.draft.id === command.id) { sessionStorage.setItem(key, "done"); return "done"; }
  if (sessionStorage.getItem(key) === "done") return "done";
  sessionStorage.setItem(key, "pending");
  try {
    // Persist the intent as draft ID to cover a reload between write and acknowledgement.
    await replaceDraft({ ...newDraft(state.draft.scope, emptyProject()), id: command.id });
    sessionStorage.setItem(key, "done");
    resetSimulation(); useCanvas.getState().select([]);
  } catch (error) { sessionStorage.removeItem(key); throw error; }
  return "done";
}
