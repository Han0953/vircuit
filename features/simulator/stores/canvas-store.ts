import { create } from "zustand";
export const useCanvas = create<{ selection: string[]; select: (ids: string[]) => void }>((set) => ({ selection: [], select: (ids) => set((s) => {
  const selection = [...new Set(ids)];
  return selection.length === s.selection.length && selection.every((id, index) => id === s.selection[index]) ? s : { selection };
}) }));
