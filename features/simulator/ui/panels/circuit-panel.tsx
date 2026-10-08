"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useProject } from "../../stores/project-store";
import { deserializeProject, serializeProject } from "../../schemas/project-schema";
import { useCanvas } from "../../stores/canvas-store";
import { openCirra } from "@/features/ai/ui/session-store";
export function CircuitPanel() {
  const components = useProject((s) => s.project.components.length);
  const wires = useProject((s) => s.project.wires.length);
  const [error, setError] = useState("");
  return <div className="space-y-3 p-4 text-sm"><Button variant="outline" onClick={() => openCirra("project-assistant")}>Rencanakan proyek dengan Cirra</Button><p>{components} komponen · {wires} kabel</p><p className="text-text-secondary">Seret untuk memindahkan, Shift untuk multiseleksi. Ctrl+Z / Ctrl+Shift+Z untuk undo/redo.</p><div className="flex flex-wrap items-center gap-3"><Button variant="outline" onClick={() => { try { const url = URL.createObjectURL(new Blob([serializeProject(useProject.getState().project)], { type: "application/json" })); const a = document.createElement("a"); a.href = url; a.download = "vircuit-project.json"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); } catch { setError("Project tidak valid untuk diekspor. Periksa properti dan wiring."); } }}>Ekspor JSON</Button><label className="flex min-h-11 items-center gap-2">Impor JSON (mengganti rangkaian)<input aria-label="Impor JSON" type="file" accept=".json,application/json" className="max-w-52" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; try { if (file.size > 2_000_000) throw new Error(); const project = deserializeProject(await file.text()); useProject.getState().edit(() => project); useCanvas.getState().select([]); setError(""); } catch { setError("Snapshot tidak valid atau versi belum didukung. Rangkaian sekarang tetap tersedia."); } e.target.value = ""; }} /></label></div>{error && <p role="alert" className="text-destructive">{error}</p>}</div>;
}
