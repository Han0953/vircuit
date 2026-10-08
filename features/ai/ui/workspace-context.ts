import { usePersistence } from "@/features/projects/store";
import { useProject } from "@/features/simulator/stores/project-store";
import { useSimulation } from "@/features/simulator/stores/simulation-store";
import { useCirraSession } from "./session-store";
import type { CirraRequest } from "../contracts";
export function workspaceContext(): Partial<CirraRequest> {
  const draft = usePersistence.getState().draft;
  const simulation = useSimulation.getState();
  const launch = useCirraSession.getState().launch;
  return {
    project: structuredClone(useProject.getState().project), ...(draft?.cloud ? { projectId: draft.cloud.id } : {}),
    ...(draft?.learningContext ? { lessonId: draft.learningContext.lessonId, ...(draft.learningContext.challengeId ? { challengeId: draft.learningContext.challengeId } : {}) } : {}),
    runtime: { status: simulation.status, time: simulation.time, outputs: { ...simulation.outputs }, serial: simulation.serial.slice(-10000), problems: simulation.problems.slice(0, 40).map((p) => ({ ...p, message: p.message.slice(0, 1000) })) },
    bindings: launch?.bindings ?? {}, ...(launch?.problemId ? { selectedProblemId: launch.problemId } : {}),
  };
}
