"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePersistence } from "../store";
import { requestSave, saveToCloud } from "../cloud/client";
import { canAutosave } from "../cloud/autosave";
export function Autosave() {
  const router = useRouter();
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = (state: ReturnType<typeof usePersistence.getState>, previous?: ReturnType<typeof usePersistence.getState>) => {
      if (previous && state.draft === previous.draft && state.userId === previous.userId && state.busy === previous.busy && state.handoffBusy === previous.handoffBusy && state.error === previous.error && state.ready === previous.ready) return;
      clearTimeout(timer);
      if (canAutosave(state)) timer = setTimeout(() => { void saveToCloud().catch(() => {}); }, 1800);
    };
    schedule(usePersistence.getState());
    const unsubscribe = usePersistence.subscribe(schedule);
    return () => { unsubscribe(); clearTimeout(timer); };
  }, []);
  useEffect(() => {
    const reconnect = () => {
      const state = usePersistence.getState();
      if (!state.ready || !state.userId || !state.draft?.pending || state.busy || state.handoffBusy || state.failure !== "network") return;
      void saveToCloud().catch(() => {});
    };
    window.addEventListener("online", reconnect);
    return () => window.removeEventListener("online", reconnect);
  }, []);
  useEffect(() => {
    const save = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (usePersistence.getState().handoffBusy) return;
        void requestSave().then((next) => { if (next) router.push(next); }).catch((error: unknown) => usePersistence.setState({ error: error instanceof Error ? error.message : "Simpan gagal." }));
      }
    };
    window.addEventListener("keydown", save); return () => window.removeEventListener("keydown", save);
  }, [router]);
  return null;
}
