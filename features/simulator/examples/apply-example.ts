import { replaceDraft } from "@/features/projects/local/controller";
import { newDraft } from "@/features/projects/local/drafts";
import { usePersistence } from "@/features/projects/store";
import { useCanvas } from "../stores/canvas-store";
import { useProject } from "../stores/project-store";
import { resetSimulation } from "../worker/bridge";
import type { ExampleId } from "../runtime/templates";
import { exampleProject, fitExampleViewport } from "./projects";

export async function applyExample(id: ExampleId, esp32: boolean, includeCircuit: boolean, area?: { width: number; height: number }) {
  const state = usePersistence.getState();
  if (!state.ready || !state.draft || state.busy || state.handoffBusy) throw new Error("Tunggu pemulihan atau penyimpanan proyek selesai.");
  const project = exampleProject(id, esp32);
  if (area) project.viewport = fitExampleViewport(project, area.width, area.height);
  usePersistence.setState({ handoffBusy: true, error: null });
  try {
    if (includeCircuit) {
      await replaceDraft(newDraft(state.draft.scope, project), true);
      resetSimulation(); useCanvas.getState().select([]);
    } else useProject.getState().edit((current) => ({ ...current, code: { ...current.code, source: project.code.source } }));
  } catch (error) {
    usePersistence.setState({ error: error instanceof Error ? error.message : "Contoh gagal dibuka. Draft aktif tetap tersedia." });
    throw error;
  } finally { usePersistence.setState({ handoffBusy: false }); }
}
