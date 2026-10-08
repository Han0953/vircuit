"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePersistence } from "../store";
import { applyProjectCommand, parseProjectCommand } from "../handoff";

export function WorkspaceProjectHandoff({ verified }: { verified: boolean }) {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const router = useRouter();
  const ready = usePersistence((s) => s.ready);
  const userId = usePersistence((s) => s.userId);
  const [state, setState] = useState<"idle" | "loading" | "conflict" | "error">("idle");
  const [error, setError] = useState("");
  const attempted = useRef("");
  const running = useRef(false);
  function finish() {
    setState("idle"); usePersistence.setState({ handoffBusy: false });
    router.replace(pathname, { scroll: false });
  }
  async function run(choice?: "local" | "cloud") {
    if (running.current) return;
    running.current = true;
    usePersistence.setState({ handoffBusy: true }); setState("loading");
    try {
      const command = parseProjectCommand(query);
      if (!command) { finish(); return; }
      if (!userId) {
        router.replace(`/masuk?next=${encodeURIComponent(`${pathname}?${query}`)}`);
        return;
      }
      const result = await applyProjectCommand(command, choice);
      if (result === "conflict") setState("conflict"); else finish();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Proyek belum dapat dibuka."); setState("error");
    } finally { running.current = false; }
  }
  useEffect(() => {
    if (!query) { attempted.current = ""; return; }
    if (!verified || !ready || attempted.current === query || running.current) return;
    if (new URLSearchParams(query).has("lesson") || new URLSearchParams(query).has("practice")) return;
    if (!new URLSearchParams(query).has("project") && !new URLSearchParams(query).has("new")) return;
    const timer = setTimeout(() => { attempted.current = query; void run(); }, 0);
    return () => clearTimeout(timer);
    // Commands follow URL identity, not rerenders caused by draft hydration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, ready, verified, userId]);
  useEffect(() => () => { usePersistence.setState({ handoffBusy: false }); }, []);
  return <Dialog open={state !== "idle"} onOpenChange={(open) => { if (!open && state !== "loading") finish(); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto" onEscapeKeyDown={(event) => { if (state === "loading") event.preventDefault(); }} onPointerDownOutside={(event) => event.preventDefault()}>
      <DialogHeader><DialogTitle>{state === "conflict" ? "Perubahan lokal belum tersimpan" : state === "error" ? "Proyek belum dibuka" : "Menyiapkan proyek"}</DialogTitle>
        <DialogDescription>{state === "conflict" ? "Proyek ini memiliki draft lokal. Pilih versi yang ingin dilanjutkan. Draft lama diarsipkan jika membuka versi cloud." : state === "error" ? "Rangkaian lokal tetap tersedia." : "Memulihkan draft dan memeriksa proyek…"}</DialogDescription></DialogHeader>
      {state === "loading" && <p role="status" className="text-sm">Memuat proyek…</p>}
      {state === "error" && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {state === "conflict" && <><Button onClick={finish}>Lanjutkan draft lokal</Button><Button variant="outline" onClick={() => void run("cloud")}>Buka versi cloud</Button></>}
        {state === "error" && <><Button onClick={() => void run()}>Coba lagi</Button><Button variant="outline" onClick={finish}>Kembali ke draft lokal</Button></>}
      </div>
    </DialogContent>
  </Dialog>;
}
