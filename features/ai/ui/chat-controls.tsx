"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { RadioGroup, Slider } from "radix-ui";
import { ArrowLeft, BookOpen, Bug, Check, ChevronDown, ChevronRight, Lightbulb, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { CirraMode } from "../contracts";
import { cn } from "@/lib/utils";

const modes = [
  { value: "tutor", label: "Tutor", description: "Pahami konsep dan materi.", icon: BookOpen },
  { value: "debugger", label: "Debugger", description: "Periksa kode dan rangkaian.", icon: Bug },
  { value: "project-assistant", label: "Project Assistant", description: "Susun ide dan rencana proyek.", icon: Lightbulb },
] as const;
const efforts = [
  { label: "Ringan", description: "Jawaban singkat dan petunjuk awal." },
  { label: "Sedang", description: "Penjelasan dengan contoh singkat." },
  { label: "Tinggi", description: "Panduan langkah demi langkah." },
] as const;

export function ChatControls({ mode, effort, disabled, onModeChange, onEffortChange, onClear }: {
  mode: CirraMode; effort: number; disabled: boolean;
  onModeChange: (mode: CirraMode) => void; onEffortChange: (level: number) => void; onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"effort" | "modes">("effort");
  const panel = useRef<HTMLDivElement>(null);
  const selected = modes.find((item) => item.value === mode) ?? modes[0];
  const detail = efforts[effort - 1] ?? efforts[0];
  const Icon = selected.icon;
  useLayoutEffect(() => {
    if (!open) return;
    const target = view === "modes" ? '[role="radio"][data-state="checked"]' : "[data-cirra-mode]";
    panel.current?.querySelector<HTMLElement>(target)?.focus({ preventScroll: true });
  }, [view, open]);
  function selectMode(value: string) {
    const next = modes.find((item) => item.value === value);
    if (next && !disabled) onModeChange(next.value);
  }
  return <Popover open={open && !disabled} onOpenChange={(next) => { setOpen(next); if (next) setView("effort"); }}>
    <PopoverTrigger asChild><Button type="button" variant="ghost" data-cirra-controls data-value={mode} data-effort={effort} disabled={disabled} aria-label="Pengaturan Cirra" className="group min-h-11 min-w-0 max-w-full gap-1.5 rounded-full border border-transparent bg-surface-muted px-3 text-xs font-medium text-text-secondary shadow-none hover:border-border hover:text-foreground">
      <Icon aria-hidden className="size-3.5" /><span key={`${mode}:${effort}`} data-cirra-selection className="cirra-selection-fade truncate">{selected.label} <span className="text-text-tertiary">· {detail.label}</span></span><ChevronDown aria-hidden className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none" />
    </Button></PopoverTrigger>
    <PopoverContent ref={panel} data-cirra-options data-cirra-controls-panel side="top" align="end" sideOffset={10} collisionPadding={12} aria-label="Pengaturan Cirra" className="w-72 max-w-[calc(100vw-32px)] max-h-[var(--radix-popover-content-available-height)] overflow-y-auto rounded-2xl border bg-surface p-3 text-foreground duration-200 motion-reduce:animate-none" onKeyDown={(event) => event.stopPropagation()} onEscapeKeyDown={(event) => {
      event.stopPropagation();
      if (view === "modes") { event.preventDefault(); setView("effort"); }
    }}>
      <div key={view} data-cirra-control-view={view} className="cirra-control-pane">
        {view === "effort" ? <>
          <div className="flex items-center gap-1">
            <Button data-cirra-mode type="button" variant="ghost" disabled={disabled} onClick={() => setView("modes")} aria-label={`Ganti mode: ${selected.label}`} className="min-h-11 min-w-0 flex-1 justify-start gap-2 rounded-xl px-2"><Icon aria-hidden className="size-4 text-ai" /><span key={mode} className="cirra-selection-fade truncate text-sm">{selected.label}</span><ChevronRight aria-hidden className="ml-auto size-4 text-text-tertiary" /></Button>
            <Button type="button" variant="ghost" size="icon" className="size-11 rounded-xl text-text-secondary hover:text-destructive" aria-label="Hapus percakapan" title="Hapus percakapan" disabled={disabled} onClick={() => { onClear(); setOpen(false); }}><Trash2 aria-hidden className="size-4" /></Button>
          </div>
          <div className="mt-3 flex items-center justify-between px-1 text-xs"><span className="flex items-center gap-1.5 text-text-secondary"><Zap aria-hidden className="size-3.5" />Effort bantuan</span><span key={effort} aria-live="polite" className="cirra-selection-fade font-semibold text-primary">{detail.label}</span></div>
          <Slider.Root data-cirra-effort-slider min={1} max={3} step={1} value={[effort]} disabled={disabled} onValueChange={([level]) => { if (!disabled && [1, 2, 3].includes(level)) onEffortChange(level); }} className="relative mt-1 flex h-11 w-full touch-none items-center px-1 select-none">
            <Slider.Track className="relative h-3 grow overflow-hidden rounded-full bg-surface-muted"><Slider.Range data-cirra-effort-range className="absolute h-full rounded-full bg-primary" /><span aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-between px-1.5">{efforts.map(({ label }) => <span key={label} className="size-1 rounded-full bg-foreground/30" />)}</span></Slider.Track>
            <Slider.Thumb aria-label="Effort bantuan" aria-valuetext={detail.label} className="block size-6 rounded-full border border-border-strong bg-surface shadow-sm transition-[box-shadow,scale] duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground/50 active:scale-110 motion-reduce:transition-none" />
          </Slider.Root>
          <div aria-hidden className="grid grid-cols-3 px-1 text-[11px]">{efforts.map(({ label }, index) => <span key={label} className={cn("transition-colors duration-150", index === effort - 1 ? "font-medium text-primary" : "text-text-tertiary", index === 1 && "text-center", index === 2 && "text-right")}>{label}</span>)}</div>
          <p key={effort} className="cirra-selection-fade mt-3 min-h-8 px-1 text-xs leading-relaxed text-text-secondary">{detail.description}</p>
        </> : <>
          <Button type="button" variant="ghost" className="mb-1 min-h-11 justify-start gap-2 px-2 text-xs text-text-secondary" onClick={() => setView("effort")}><ArrowLeft aria-hidden className="size-4" />Kembali ke effort</Button>
          <RadioGroup.Root aria-label="Mode Cirra" value={mode} onValueChange={selectMode} className="space-y-1">{modes.map(({ value, label, description, icon: ModeIcon }) => <RadioGroup.Item key={value} value={value} aria-label={label} disabled={disabled} onClick={() => setView("effort")} className="flex min-h-14 w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors duration-150 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-foreground/50 data-[state=checked]:bg-primary-soft data-[state=checked]:text-primary">
            <ModeIcon aria-hidden className="size-4 shrink-0" /><span className="min-w-0 flex-1"><span className="block text-sm font-medium">{label}</span><span className="mt-0.5 block text-xs text-text-secondary">{description}</span></span><RadioGroup.Indicator><Check aria-hidden className="size-4" /></RadioGroup.Indicator>
          </RadioGroup.Item>)}</RadioGroup.Root>
        </>}
      </div>
    </PopoverContent>
  </Popover>;
}
