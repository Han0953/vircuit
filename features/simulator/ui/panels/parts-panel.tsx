"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { catalog } from "../../catalog/registry";
import { useProject } from "../../stores/project-store";
export function PartsPanel({ category, onCategoryChange }: { category: string; onCategoryChange: (category: string) => void }) {
  const [query, setQuery] = useState("");
  const add = useProject((s) => s.add);
  return <div className="space-y-3 p-3">
    <Input aria-label="Cari komponen" placeholder="Cari komponen" value={query} onChange={(e) => setQuery(e.target.value)} />
    <div className="flex flex-wrap gap-1" aria-label="Kategori Parts">{["Boards", "Breadboards", "Basic", "Sensors", "Actuators", "Displays"].map((name) => <Button key={name} variant={category === name ? "secondary" : "ghost"} className="text-xs" onClick={() => onCategoryChange(name)} aria-pressed={category === name}>{name}</Button>)}</div>
    <p className="text-xs text-text-secondary">Klik untuk menambah, atau seret ke canvas.</p>
    {catalog.filter((c) => (query ? c.name.toLowerCase().includes(query.toLowerCase()) : c.category === category)).map((c) => <Button key={c.key} variant="outline" className="h-auto min-h-12 w-full justify-start whitespace-normal text-left" draggable onDragStart={(e) => { e.dataTransfer.setData("application/vircuit-component", c.key); e.dataTransfer.effectAllowed = "copy"; }} onClick={() => { const p = useProject.getState().project; const v = p.viewport; add(c.key, { x: (40 - v.x) / v.zoom + (p.components.length % 4) * 35, y: (60 - v.y) / v.zoom + (p.components.length % 4) * 35 }); }}><Plus className="shrink-0" />{c.name}</Button>)}
    {category === "Displays" && !query && <p className="text-sm text-text-secondary">Display tersedia pada tahap berikutnya.</p>}
  </div>;
}
