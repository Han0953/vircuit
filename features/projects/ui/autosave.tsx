"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePersistence } from "../store";
import { requestSave, saveToCloud } from "../cloud/client";
import { isLocalDemo } from "@/features/auth/demo";
export function Autosave() {
  const router = useRouter();
  const draft = usePersistence((s) => s.draft);
  const userId = usePersistence((s) => s.userId);
  const busy = usePersistence((s) => s.busy);
  const handoffBusy = usePersistence((s) => s.handoffBusy);
  const error = usePersistence((s) => s.error);
  useEffect(() => {
    if (!draft || (!draft.cloud && !isLocalDemo()) || !userId || busy || handoffBusy || error || draft.savedLocalRevision === draft.localRevision) return;
    const timer = setTimeout(() => { void saveToCloud().catch(() => {}); }, 1800);
    return () => clearTimeout(timer);
  }, [draft, userId, busy, handoffBusy, error]);
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
