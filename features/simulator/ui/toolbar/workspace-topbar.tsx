"use client";
import { useSimulation } from "../../stores/simulation-store";
import { runSimulation, stopSimulation, resetSimulation } from "../../worker/bridge";
import { useRouter } from "next/navigation";
import { flushDraft } from "@/features/projects/local/controller";
import { ArrowLeft, Play, Sparkles, Square, RotateCcw, UserRound } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { ProjectControls } from "@/features/projects/ui/project-controls";
import { usePersistence } from "@/features/projects/store";
import { useProject } from "../../stores/project-store";

export function WorkspaceTopbar({ onOpenAI }: { onOpenAI: (trigger: HTMLButtonElement) => void }) {
  const router = useRouter();
  const status = useSimulation((s) => s.status);
  const name = useProject((s) => s.project.metadata.name);
  const userId = usePersistence((s) => s.userId);
  return (
    <header className="shrink-0 border-b bg-surface">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 lg:flex-nowrap lg:px-4">
        <Button variant="ghost" size="icon" aria-label={userId ? "Kembali ke dashboard" : "Kembali ke beranda"} onClick={() => {
          void flushDraft().then(() => router.push(userId ? "/dashboard" : "/")).catch((cause: unknown) => usePersistence.setState({ error: cause instanceof Error ? cause.message : "Draft belum tersimpan." }));
        }}><ArrowLeft aria-hidden="true" /></Button>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-text-secondary">Virtual Lab</p>
          <h1 className="truncate text-sm font-semibold">{name}</h1>
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
        <div className="flex w-full flex-wrap items-center gap-2 border-t pt-1 lg:w-auto lg:border-0 lg:pt-0">
          <span className="mr-auto inline-flex items-center gap-2 text-xs text-text-secondary lg:mr-2">
            <UserRound aria-hidden="true" className="size-4" />{userId ? "Akun" : "Tamu"}
          </span>
          <ProjectControls key={userId ?? "guest"} />
          <Button variant="ghost" onClick={(event) => onOpenAI(event.currentTarget)} aria-label="Buka panel Cirra" className="px-3">
            <Sparkles aria-hidden="true" />Cirra
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
