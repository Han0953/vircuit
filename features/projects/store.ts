import { create } from "zustand";
import type { Draft } from "./local/drafts";

interface PersistenceState {
  ready: boolean; draft: Draft | null; localError: string | null;
  status: "unsaved" | "saving" | "saved" | "failed"; error: string | null;
  userId: string | null; busy: boolean;
  handoffBusy: boolean;
}
export const usePersistence = create<PersistenceState>(() => ({ ready: false, draft: null, localError: null, status: "unsaved", error: null, userId: null, busy: false, handoffBusy: false }));
