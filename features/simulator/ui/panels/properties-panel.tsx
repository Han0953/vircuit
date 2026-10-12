"use client";
import { Copy, RotateCw, RotateCcw, Trash2, Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProject } from "../../stores/project-store";
import { useCanvas } from "../../stores/canvas-store";
import { getDefinition } from "../../catalog/registry";
import { RuntimeControls } from "../components/runtime-controls";
import { hasFootprint } from "../../geometry/breadboard-placement";
import styles from "../workspace/workspace-controls.module.css";
const propertyFields: Record<string, { label: string; min: number; max: number }> = {
  light: { label: "Cahaya virtual %", min: 0, max: 100 }, threshold: { label: "Ambang cahaya %", min: 0, max: 100 },
  motion: { label: "Gerakan (0 / 1)", min: 0, max: 1 }, distance: { label: "Jarak pratinjau (cm)", min: 2, max: 400 },
  angle: { label: "Sudut pratinjau (°)", min: 0, max: 180 }, address: { label: "Alamat I2C (desimal)", min: 0, max: 127 }, contrast: { label: "Kontras pratinjau %", min: 0, max: 100 },
};
export function PropertiesPanel() {
  const selected = useCanvas((s) => s.selection);
  const project = useProject((s) => s.project);
  const component = selected.length === 1 ? project.components.find((c) => selected.includes(c.id)) : undefined;
  const wire = selected.length === 1 ? project.wires.find((w) => selected.includes(w.id)) : undefined;
  const canUndo = useProject((s) => s.past.length > 0);
  const canRedo = useProject((s) => s.future.length > 0);
  const store = useProject.getState();
  return <div className="space-y-4 p-4 text-sm">
    <div className="flex flex-wrap gap-1"><Button variant="ghost" aria-label="Undo" disabled={!canUndo} title="Undo · Ctrl+Z" onClick={store.undo}><Undo2 /></Button><Button variant="ghost" aria-label="Redo" disabled={!canRedo} title="Redo · Ctrl+Shift+Z" onClick={store.redo}><Redo2 /></Button></div>
    {selected.length > 1 && <p role="status" className="rounded-lg border bg-primary-soft p-3">{selected.length} item dipilih. Pilih satu item untuk mengubah properti.</p>}
    {wire && <div className="space-y-2"><p>Wire: {wire.from.pinId} → {wire.to.pinId}</p><label>Warna kabel<select className={styles.select} value={wire.color} onChange={(e) => { const color = e.target.value; if (color === "blue" || color === "red" || color === "green" || color === "neutral") store.edit((p) => ({ ...p, wires: p.wires.map((w) => w.id === wire.id ? { ...w, color } : w) })); }}>{["blue", "red", "green", "neutral"].map((c) => <option key={c}>{c}</option>)}</select></label><Button variant="outline" onClick={() => store.remove([wire.id])}>Hapus kabel</Button></div>}
    {!component ? <p className="text-text-secondary">Pilih komponen untuk melihat properti.</p> : <>
      <label className="block space-y-2">Nama<Input value={component.label} onChange={(e) => store.updateComponent(component.id, { label: e.target.value })} /></label>
      <p className="text-xs text-text-secondary">{component.type} · {component.rotation}°</p>
      <p className="text-xs text-text-secondary">{getDefinition(component.type).support === "visual-only" ? "Visual saja · runtime belum didukung" : "Simulasi edukatif"}</p>
      {getDefinition(component.type).supportNote && <p className="rounded-lg border bg-surface-muted p-3 text-xs leading-relaxed text-text-secondary">{getDefinition(component.type).supportNote}</p>}
      {(hasFootprint(component.type) || component.type.startsWith("breadboard-")) && <p className="text-xs text-text-secondary">Snap menyelaraskan kaki saja. Sambungkan pin ke lubang dengan kabel. Menggeser breadboard tidak membawa komponen di atasnya.</p>}
      {Object.entries(component.properties).map(([name, value]) => {
        const field = propertyFields[name];
        return <label className="block space-y-2" key={name}>{field?.label ?? name}<Input type="number" min={field?.min} max={field?.max} value={value} onChange={(e) => {
          const number = Number(e.target.value);
          if (Number.isFinite(number)) store.updateComponent(component.id, { properties: { ...component.properties, [name]: field ? Math.max(field.min, Math.min(field.max, number)) : number } });
        }} /></label>;
      })}
      <RuntimeControls component={component} />
      <div className="flex flex-wrap gap-1"><Button variant="outline" aria-label="Duplikat komponen" onClick={() => store.duplicate(selected)}><Copy /></Button><Button variant="outline" aria-label="Putar ke kiri" onClick={() => store.updateComponent(component.id, { rotation: component.rotation - 90 })}><RotateCcw /></Button><Button variant="outline" aria-label="Putar komponen" title="Putar ke kanan" onClick={() => store.updateComponent(component.id, { rotation: component.rotation + 90 })}><RotateCw /></Button><Button variant="outline" aria-label="Hapus pilihan" onClick={() => { store.remove(selected); useCanvas.getState().select([]); }}><Trash2 /></Button></div>
    </>}
  </div>;
}
