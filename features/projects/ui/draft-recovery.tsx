"use client";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { usePersistence } from "../store";
import { flushDraft, recoverDraft } from "../local/controller";
import { initializeWorkspace, watchAuth } from "../session";
import { WorkspaceProjectHandoff } from "./workspace-project-handoff";
import { PracticeHandoff } from "@/features/learning/ui/practice-handoff";

export function DraftRecovery({ children }: { children: ReactNode }) {
  const ready = usePersistence((s) => s.ready);
  const error = usePersistence((s) => s.localError);
  const [sessionError, setSessionError] = useState(false);
  const [verified, setVerified] = useState(false);
  const start = () => { setSessionError(false); void initializeWorkspace().then(() => setVerified(true)).catch(() => setSessionError(true)); };
  useEffect(() => {
    void initializeWorkspace().then(() => setVerified(true)).catch(() => setSessionError(true));
    const stopAuth = watchAuth();
    const flush = () => { void flushDraft().catch(() => {}); };
    const visibility = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("pagehide", flush); document.addEventListener("visibilitychange", visibility);
    return () => { stopAuth(); flush(); window.removeEventListener("pagehide", flush); document.removeEventListener("visibilitychange", visibility); };
  }, []);
  return <>
    <Suspense><WorkspaceProjectHandoff verified={verified} /></Suspense>
    <Suspense><PracticeHandoff verified={verified} /></Suspense>
    {!ready ? <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p role={error || sessionError ? "alert" : "status"}>{error ?? (sessionError ? "Session belum dapat diverifikasi. Draft tidak diubah." : "Memulihkan draft lokal…")}</p>
      {(error || sessionError) && <Button onClick={start}>Coba lagi</Button>}
      {sessionError && <Button variant="outline" onClick={() => { usePersistence.setState({ userId: null }); void recoverDraft("guest"); }}>Lanjutkan sebagai tamu</Button>}
    </main> : <div className="flex h-dvh min-h-0 flex-col">
      {error && <div role="alert" className="shrink-0 border-b bg-surface p-3 text-sm">{error} <Button variant="outline" onClick={() => void flushDraft().catch(() => {})}>Coba simpan lokal lagi</Button></div>}
      <div className="min-h-0 flex-1">{children}</div>
    </div>}
  </>;
}
