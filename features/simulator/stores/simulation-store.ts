import { create } from "zustand";
import type { Problem } from "../types/project";
import type { DisplayState } from "../runtime/displays";
export const useSimulation = create<{ status: "idle" | "running" | "stopped" | "error"; outputs: Record<string, number>; displays: Record<string, DisplayState>; inputs: Record<string, Record<string, number>>; serial: string; time: number; problems: Problem[] }>(() => ({ status: "idle", outputs: {}, displays: {}, inputs: {}, serial: "", time: 0, problems: [] }));
