"use client";
import { useSimulation } from "../../stores/simulation-store";
import { runSimulation, stopSimulation, resetSimulation } from "../../worker/bridge";
import Link from "next/link";
import { ArrowLeft, Play, Save, Sparkles, Square, RotateCcw, UserRound } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";

export function WorkspaceTopbar({ onOpenAI }: { onOpenAI: (trigger: HTMLButtonElement) => void }) {
  const status = useSimulation((s) => s.status);
  return (
    <header className="shrink-0 border-b bg-surface">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 lg:flex-nowrap lg:px-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/" aria-label="Kembali ke beranda"><ArrowLeft aria-hidden="true" /></Link>
        </Button>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-text-secondary">Virtual Lab</p>
          <h1 className="truncate text-sm font-semibold">Proyek tanpa judul</h1>
        </div>
        <div className="flex items-center gap-1 lg:order-last">
          <Button disabled={status === "running"} onClick={runSimulation} aria-label="Run" className="px-3">
            <Play aria-hidden="true" />Run
          </Button>
          <Button disabled={status !== "running"} onClick={stopSimulation} variant="outline" size="icon" aria-label="Stop">
            <Square aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Reset simulasi" onClick={resetSimulation}><RotateCcw /></Button>
        </div>
        <div className="flex w-full items-center gap-2 border-t pt-1 lg:w-auto lg:border-0 lg:pt-0">
          <span className="mr-auto inline-flex items-center gap-2 text-xs text-text-secondary lg:mr-2">
            <UserRound aria-hidden="true" className="size-4" />Tamu
          </span>
          <Button disabled variant="ghost" aria-label="Simpan — belum tersedia" aria-describedby="workspace-unavailable" className="px-3">
            <Save aria-hidden="true" /><span className="hidden sm:inline">Simpan</span>
          </Button>
          <Button variant="ghost" onClick={(event) => onOpenAI(event.currentTarget)} aria-label="Buka panel AI" className="px-3">
            <Sparkles aria-hidden="true" />AI
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
