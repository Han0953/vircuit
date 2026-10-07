"use client";
import { Copy, RotateCw, Trash2, Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProject } from "../../stores/project-store";
import { useCanvas } from "../../stores/canvas-store";
export function PropertiesPanel() {
  const selected = useCanvas((s) => s.selection);
  const project = useProject((s) => s.project);
  const component = project.components.find((c) => selected.includes(c.id));
  const wire = project.wires.find((w) => selected.includes(w.id));
  const store = useProject.getState();
  return <div className="space-y-4 p-4 text-sm">
    <div className="flex flex-wrap gap-1"><Button variant="ghost" aria-label="Undo" onClick={store.undo}><Undo2 /></Button><Button variant="ghost" aria-label="Redo" onClick={store.redo}><Redo2 /></Button></div>
    {wire && <div className="space-y-2"><p>Wire: {wire.from.pinId} → {wire.to.pinId}</p><label>Warna kabel<select className="min-h-11 w-full rounded border bg-surface" value={wire.color} onChange={(e) => { const color = e.target.value; if (color === "blue" || color === "red" || color === "green" || color === "neutral") store.edit((p) => ({ ...p, wires: p.wires.map((w) => w.id === wire.id ? { ...w, color } : w) })); }}>{["blue", "red", "green", "neutral"].map((c) => <option key={c}>{c}</option>)}</select></label><Button variant="outline" onClick={() => store.remove([wire.id])}>Hapus kabel</Button></div>}
    {!component ? <p className="text-text-secondary">Pilih komponen untuk melihat properti.</p> : <>
      <label className="block space-y-2">Nama<Input value={component.label} onChange={(e) => store.updateComponent(component.id, { label: e.target.value })} /></label>
      <p className="text-xs text-text-secondary">{component.type} · {component.rotation}°</p>
      {Object.entries(component.properties).map(([name, value]) => <label className="block space-y-2" key={name}>{name}<Input type="number" value={value} onChange={(e) => { const number = Number(e.target.value); if (Number.isFinite(number)) store.updateComponent(component.id, { properties: { ...component.properties, [name]: number } }); }} /></label>)}
      <div className="flex flex-wrap gap-1"><Button variant="outline" aria-label="Duplikat komponen" onClick={() => store.duplicate(selected)}><Copy /></Button><Button variant="outline" aria-label="Putar komponen" onClick={() => store.updateComponent(component.id, { rotation: (component.rotation + 90) % 360 })}><RotateCw /></Button><Button variant="outline" aria-label="Hapus pilihan" onClick={() => { store.remove(selected); useCanvas.getState().select([]); }}><Trash2 /></Button></div>
    </>}
  </div>;
}
