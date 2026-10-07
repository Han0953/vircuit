import { create } from "zustand";
export const useCanvas = create<{ selection: string[]; select: (ids: string[]) => void }>((set) => ({ selection: [], select: (selection) => set({ selection }) }));
