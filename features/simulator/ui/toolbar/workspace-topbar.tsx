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
import { ExampleLibrary } from "../components/example-library";

export function WorkspaceTopbar({ desktop, onOpenAI }: { desktop: boolean; onOpenAI: (trigger: HTMLButtonElement) => void }) {
  const router = useRouter();
  const status = useSimulation((s) => s.status);
  const name = useProject((s) => s.project.metadata.name);
  const userId = usePersistence((s) => s.userId);
  return (
    <header className="relative shrink-0 border-b bg-surface">
      <div className="flex min-w-0 items-center gap-1 px-2 py-2 lg:gap-3 lg:px-4">
        <Button
          variant="ghost"
          size="icon"
          aria-label={userId ? "Kembali ke dashboard" : "Kembali ke beranda"}
          title="Kembali"
          onClick={() => {
            void flushDraft()
              .then(() => {
                router.push(usePersistence.getState().userId ? "/dashboard" : "/");
              })
              .catch((cause: unknown) =>
                usePersistence.setState({
                  error:
                    cause instanceof Error ? cause.message : "Draft belum tersimpan.",
                })
              );
          }}
        >
          <ArrowLeft aria-hidden="true" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-text-secondary">Virtual Lab</p>
          <h1 className="truncate text-sm font-semibold">{name}</h1>
        </div>
        <div className="flex items-center gap-1 order-last">
          {!desktop && status === "running" ? <Button size="icon" onClick={stopSimulation} aria-label="Stop"><Square aria-hidden /></Button> : <>
          <Button disabled={status === "running"} onClick={runSimulation} aria-label="Run" className="px-3">
            <Play aria-hidden="true" /><span className="hidden lg:inline">Run</span>
          </Button>
          {desktop && <Button disabled={status !== "running"} onClick={stopSimulation} variant="outline" size="icon" aria-label="Stop">
            <Square aria-hidden="true" />
          </Button>}</>}
          {desktop && <Button variant="ghost" size="icon" aria-label="Reset simulasi" onClick={resetSimulation}><RotateCcw /></Button>}
        </div>
        <div className="flex shrink-0 items-center gap-1 lg:gap-2">
          <span className="hidden lg:inline-flex items-center gap-2 text-xs text-text-secondary lg:mr-2">
            <UserRound aria-hidden="true" className="size-4" />{userId ? "Akun" : "Tamu"}
          </span>
          <ProjectControls key={userId ?? "guest"} compact={!desktop} secondary={<><ExampleLibrary compact /><ThemeToggle />{!desktop && <Button variant="ghost" onClick={resetSimulation}><RotateCcw aria-hidden />Reset simulasi</Button>}</>} />
          {desktop && <Button variant="ghost" onClick={(event) => onOpenAI(event.currentTarget)} aria-label="Buka panel Cirra" className="px-3">
            <Sparkles aria-hidden="true" />Cirra
          </Button>}
        </div>
      </div>
    </header>
  );
}
