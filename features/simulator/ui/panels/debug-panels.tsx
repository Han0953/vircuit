"use client";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CircleAlert, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSimulation } from "../../stores/simulation-store";
import { useCanvas } from "../../stores/canvas-store";
import { useProject } from "../../stores/project-store";
import { validateCircuit } from "../../graph/circuit";
import { clearSerial } from "../../worker/bridge";
export function ProblemsPanel() {
  const problems = useSimulation((s) => s.problems);
  return <div className="h-full overflow-auto p-3 text-sm"><Button variant="outline" onClick={() => useSimulation.setState({ problems: validateCircuit(useProject.getState().project) })}>Periksa rangkaian</Button>
    {!problems.length && <p className="py-3 text-text-secondary">Belum ada diagnostic. Periksa rangkaian atau jalankan kode.</p>}
    <ul className="mt-3 space-y-2">{problems.map((p, i) => { const Icon = p.severity === "error" ? CircleAlert : p.severity === "warning" ? AlertTriangle : Info; return <li key={`${p.id}-${i}`} className="flex items-start gap-2 rounded border p-3"><Icon className={`mt-0.5 size-4 shrink-0 ${p.severity === "error" ? "text-destructive" : "text-text-secondary"}`} /><div><p>{p.message}</p><p className="text-xs text-text-secondary">{p.source} · {p.severity}{p.line ? ` · baris ${p.line}` : ""}</p>{p.componentId && <Button variant="ghost" onClick={() => useCanvas.getState().select([p.componentId!])}>Pilih komponen</Button>}</div></li>; })}</ul>
  </div>;
}
export function SerialPanel() {
  const serial = useSimulation((s) => s.serial);
  const [paused, setPaused] = useState<string | null>(null);
  const [copied, setCopied] = useState("");
  const output = useRef<HTMLPreElement>(null);
  useEffect(() => { if (paused === null && output.current) output.current.scrollTop = output.current.scrollHeight; }, [serial, paused]);
  return <div className="flex h-full min-h-0 flex-col"><div className="flex shrink-0 gap-1 border-b p-1"><Button variant="ghost" onClick={clearSerial}>Bersihkan</Button><Button variant="ghost" onClick={() => setPaused(paused === null ? serial : null)}>{paused === null ? "Jeda tampilan" : "Lanjutkan"}</Button><Button variant="ghost" onClick={async () => { try { await navigator.clipboard.writeText(paused ?? serial); setCopied("Disalin"); } catch { setCopied("Gagal menyalin"); } }}>Salin</Button><span role="status" className="self-center text-xs">{copied}</span></div><pre ref={output} aria-label="Output Serial Monitor" className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap p-3 font-mono text-sm">{paused ?? (serial || "Belum ada output serial.")}</pre></div>;
}
