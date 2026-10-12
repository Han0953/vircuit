import type { Project, Problem } from "../types/project";
import type { DisplayState } from "../runtime/displays";
export type WorkerRequest = { type: "CLEAR_SERIAL" } | { type: "RUN"; project: Project } | { type: "INPUT"; id: string; property: string; value: number };
export type WorkerResponse = { type: "STATE"; outputs: Record<string, number>; displays: Record<string, DisplayState>; serial: string; time: number } | { type: "ERROR"; problem: Problem };
