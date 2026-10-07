"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePersistence } from "@/features/projects/store";
import { CloudError } from "@/features/projects/cloud/request";
import { safeDestination } from "@/features/auth/redirect";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { parsePracticeCommand } from "../practice-contract";
import { applyPractice } from "../practice-handoff";

export function PracticeHandoff({ verified }: { verified: boolean }) {
  const query = useSearchParams().toString();
  const ready = usePersistence((s) => s.ready);
  const userId = usePersistence((s) => s.userId);
  const router = useRouter();
  const attempted = useRef(""); const running = useRef(false);
  const [state, setState] = useState<"idle" | "loading" | "confirm" | "error">("idle");
  const [error, setError] = useState("");
  function finish() {
    setState("idle"); usePersistence.setState({ handoffBusy: false });
    router.replace("/simulator", { scroll: false });
  }
  async function run(confirmed = false) {
    if (running.current) return;
    running.current = true; usePersistence.setState({ handoffBusy: true }); setState("loading");
    try {
      const command = parsePracticeCommand(query);
      if (!command) { finish(); return; }
      const result = await applyPractice(command, confirmed);
      if (result === "confirm") setState("confirm"); else finish();
    } catch (cause) {
      if (cause instanceof CloudError && cause.status === 401) {
        router.replace(`/masuk?next=${encodeURIComponent(safeDestination(`/simulator?${query}`))}`); return;
      }
      setError(cause instanceof Error ? cause.message : "Praktik belum dapat dibuka."); setState("error");
    } finally { running.current = false; }
  }
  useEffect(() => {
    if (!query) { attempted.current = ""; return; }
    if (!verified || !ready || attempted.current === query || running.current) return;
    const params = new URLSearchParams(query);
    if (!params.has("lesson") && !params.has("practice")) return;
    const timer = setTimeout(() => { attempted.current = query; void run(); }, 0);
    return () => clearTimeout(timer);
    // Practice intents follow URL identity, independently of session recovery.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, ready, userId, verified]);
  useEffect(() => () => { usePersistence.setState({ handoffBusy: false }); }, []);
  return <Dialog open={state !== "idle"} onOpenChange={(open) => { if (!open && state !== "loading") finish(); }}><DialogContent className="max-h-[90dvh] overflow-y-auto" onEscapeKeyDown={(event) => { if (state === "loading") event.preventDefault(); }} onPointerDownOutside={(event) => event.preventDefault()}><DialogHeader><DialogTitle>{state === "confirm" ? "Buka praktik baru?" : state === "error" ? "Praktik belum dibuka" : "Menyiapkan praktik"}</DialogTitle><DialogDescription>{state === "confirm" ? "Project aktif akan dibackup ke arsip draft lokal sebelum template dibuka. Identitas cloud project lama tetap berada di backup." : "Jika terjadi kegagalan, project tersimpan tetap tersedia."}</DialogDescription></DialogHeader>
    {state === "loading" && <p role="status">Memeriksa session dan memulihkan draft…</p>}
    {state === "error" && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap gap-2">{state === "confirm" && <Button onClick={() => void run(true)}>Buka praktik baru</Button>}{state === "error" && <Button onClick={() => void run()}>Coba lagi</Button>}{state !== "loading" && <Button variant="outline" onClick={finish}>Tetap di proyek saat ini</Button>}</div>
  </DialogContent></Dialog>;
}
