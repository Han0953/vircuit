import { create } from "zustand";
import type { Problem } from "../types/project";
export const useSimulation = create<{ status: "idle" | "running" | "stopped" | "error"; outputs: Record<string, number>; serial: string; time: number; problems: Problem[] }>(() => ({ status: "idle", outputs: {}, serial: "", time: 0, problems: [] }));
