"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { codeExamples, starterCode, type ExampleId } from "../../runtime/templates";
import { OptionPicker } from "@/components/shared/option-picker";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Code2 } from "lucide-react";
import { ExampleLibrary } from "../components/example-library";
import dynamic from "next/dynamic";
import { useProject } from "../../stores/project-store";
const CodeEditor = dynamic(() => import("./code-editor"), { ssr: false, loading: () => <p className="p-4 text-sm">Memuat editor…</p> });
export function CodePanel() {
  const [template, setTemplate] = useState<ExampleId>("blink");
  const [confirm, setConfirm] = useState(false);
  const board = useProject((s) => s.project.components.find((c) => c.id === s.project.settings.boardId));
  return <div className="flex h-full min-h-0 flex-col"><div data-code-tools className="flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2">
    <OptionPicker label="Contoh program" value={template} onChange={(value) => { const example = codeExamples.find((item) => item.id === value); if (example) setTemplate(example.id); }} options={codeExamples.map((item) => ({ value: item.id, label: item.title, description: item.description, icon: <Code2 aria-hidden /> }))} />
    <Button variant="outline" onClick={() => setConfirm(true)}>Ganti kode dengan contoh</Button><ExampleLibrary initialId={template} label="Pratinjau rangkaian" />
  </div><p data-code-help className="shrink-0 border-b px-3 py-2 text-xs text-text-secondary">Arduino C/C++ subset · {board?.label ?? "Pilih board"} · 12 contoh · API display virtual, bukan library Arduino</p><div className="min-h-0 flex-1"><CodeEditor /></div>
    <Dialog open={confirm} onOpenChange={setConfirm}><DialogContent><DialogHeader><DialogTitle>Ganti kode aktif?</DialogTitle><DialogDescription>Gunakan {codeExamples.find((item) => item.id === template)?.title}. Rangkaian tetap dipertahankan. Perubahan kode dapat dibatalkan dengan Undo.</DialogDescription></DialogHeader><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setConfirm(false)}>Batal</Button><Button onClick={() => { useProject.getState().edit((p) => ({ ...p, code: { ...p.code, source: starterCode(template, board?.type === "esp32") } })); setConfirm(false); }}>Ganti kode</Button></div></DialogContent></Dialog>
  </div>;
}
