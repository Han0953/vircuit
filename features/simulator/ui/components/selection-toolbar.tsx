"use client";
import { useState } from "react";
import { MousePointerSquareDashed, SquareCheckBig, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCanvas } from "../../stores/canvas-store";
import { useProject } from "../../stores/project-store";
import { circuitIds } from "../../stores/selection";

export function SelectionToolbar({ area, onAreaChange, focusCanvas }: { area: boolean; onAreaChange: (value: boolean) => void; focusCanvas: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const selection = useCanvas((s) => s.selection);
  const nodes = useProject((s) => s.project.components.length);
  const wires = useProject((s) => s.project.wires.length);
  return <>
    <div role="group" aria-label="Kontrol pilihan rangkaian" className="flex shrink-0 flex-wrap items-center gap-1 border-b bg-surface px-2 py-1">
      <Button variant={area ? "secondary" : "ghost"} size="icon" aria-label="Pilih area" aria-pressed={area} title="Pilih area · Shift + seret" onClick={() => { onAreaChange(!area); focusCanvas(); }}><MousePointerSquareDashed /></Button>
      <Button variant="ghost" size="icon" disabled={!nodes && !wires} aria-label="Pilih semua" title="Pilih semua · Ctrl+A / Cmd+A" onClick={() => { useCanvas.getState().select(circuitIds(useProject.getState().project)); focusCanvas(); }}><SquareCheckBig /></Button>
      <Button variant="ghost" size="icon" disabled={!selection.length} aria-label="Batalkan pilihan" title="Batalkan pilihan · Esc" onClick={() => { useCanvas.getState().select([]); focusCanvas(); }}><X /></Button>
      <Button variant="ghost" size="icon" disabled={!selection.length} aria-label="Hapus yang dipilih" title="Hapus yang dipilih · Delete" onClick={() => { useProject.getState().remove(selection); useCanvas.getState().select([]); focusCanvas(); }}><Trash2 /></Button>
      <span role="status" className="min-w-0 flex-1 px-1 text-xs text-text-secondary">{selection.length ? `${selection.length} item dipilih` : "Belum ada pilihan"}</span>
      <Button variant="outline" disabled={!nodes && !wires} aria-label="Hapus seluruh rangkaian" title="Hapus seluruh rangkaian" className="px-2 text-xs" onClick={() => setConfirm(true)}><span className="hidden sm:inline">Hapus seluruh rangkaian</span><span className="sm:hidden">Hapus semua</span></Button>
    </div>
    <Dialog open={confirm} onOpenChange={setConfirm}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto" onCloseAutoFocus={(event) => { event.preventDefault(); focusCanvas(); }}>
        <DialogHeader><DialogTitle>Hapus seluruh rangkaian?</DialogTitle><DialogDescription>Semua komponen dan kabel akan dihapus. Kode C++, nama proyek, dan metadata tetap disimpan. Kamu dapat membatalkannya dengan Undo.</DialogDescription></DialogHeader>
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2"><DialogClose asChild><Button variant="outline">Batal</Button></DialogClose><Button variant="destructive" onClick={() => { useProject.getState().clearCircuit(); useCanvas.getState().select([]); setConfirm(false); }}>Hapus rangkaian</Button></div>
      </DialogContent>
    </Dialog>
  </>;
}
