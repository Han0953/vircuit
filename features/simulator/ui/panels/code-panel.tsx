"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { starterCode } from "../../runtime/templates";
import dynamic from "next/dynamic";
import { useProject } from "../../stores/project-store";
const CodeEditor = dynamic(() => import("./code-editor"), { ssr: false, loading: () => <p className="p-4 text-sm">Memuat editor…</p> });
export function CodePanel() {
  const [template, setTemplate] = useState("blink");
  const board = useProject((s) => s.project.components.find((c) => c.id === s.project.settings.boardId));
  return <div className="flex h-full min-h-0 flex-col"><div className="flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-1"><select aria-label="Contoh program" className="min-h-11 rounded border bg-surface" value={template} onChange={(e) => setTemplate(e.target.value)}><option value="blink">Blink</option><option value="button">Button → LED</option><option value="pot">Potentiometer → PWM</option><option value="dht">DHT22 → Relay</option></select><Button variant="outline" onClick={() => useProject.getState().edit((p) => ({ ...p, code: { ...p.code, source: starterCode(template, board?.type === "esp32") } }))}>Ganti kode dengan contoh</Button></div><p className="shrink-0 border-b px-3 py-2 text-xs text-text-secondary">Arduino C/C++ subset · {board?.label ?? "Pilih board"} · Dukungan API terbatas</p><div className="min-h-0 flex-1"><CodeEditor /></div></div>;
}
