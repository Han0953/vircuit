import { getDefinition } from "../catalog/registry";
import { endpointKey } from "../validation/wires";
import type { Project, Problem } from "../types/project";
export interface CircuitGraph { netByPin: Map<string, string>; nets: Map<string, string[]> }
export function buildCircuit(project: Project): CircuitGraph {
  const parent = new Map<string, string>();
  function find(key: string): string { const p = parent.get(key); if (!p) return key; if (p === key) return p; const root = find(p); parent.set(key, root); return root; }
  function union(a: string, b: string) { if (parent.has(a) && parent.has(b)) parent.set(find(b), find(a)); }
  for (const c of project.components) for (const pin of getDefinition(c.type).pins) parent.set(`${c.id}.${pin.id}`, `${c.id}.${pin.id}`);
  for (const c of project.components) for (const group of getDefinition(c.type).groups ?? []) for (const pin of group.slice(1)) union(`${c.id}.${group[0]}`, `${c.id}.${pin}`);
  for (const wire of project.wires) union(endpointKey(wire.from), endpointKey(wire.to));
  const netByPin = new Map<string, string>(); const nets = new Map<string, string[]>();
  for (const key of parent.keys()) { const net = find(key); netByPin.set(key, net); nets.set(net, [...(nets.get(net) ?? []), key]); }
  return { netByPin, nets };
}
export function validateCircuit(project: Project, graph = buildCircuit(project)): Problem[] {
  const problems: Problem[] = [];
  const add = (id: string, message: string, severity: Problem["severity"] = "error", componentId?: string) => problems.push({ id, message, severity, componentId, source: "wiring" });
  const boards = project.components.filter((c) => getDefinition(c.type).category === "Boards");
  if (boards.length !== 1) add("board-count", "Gunakan tepat satu board untuk menjalankan simulasi.");
  if (boards[0]?.type === "nano") add("board-unsupported", "Runtime Nano belum didukung. Pilih Uno R3 atau ESP32 DevKitC V4.");
  for (const wire of project.wires) for (const endpoint of [wire.from, wire.to]) if (!graph.netByPin.has(endpointKey(endpoint))) add(`endpoint-${wire.id}`, "Kabel merujuk pin yang tidak tersedia.");
  for (const [net, pins] of graph.nets) {
    const supply = boards.flatMap((c) => getDefinition(c.type).pins.filter((p) => p.kind === "power" && pins.includes(`${c.id}.${p.id}`)));
    const ground = boards.some((c) => pins.includes(`${c.id}.GND`));
    if (ground && supply.length) add(`short-${net}`, "Power terhubung langsung ke GND. Perbaiki hubung singkat sebelum Run.");
    if (new Set(supply.map((p) => p.id)).size > 1) add(`supply-${net}`, "Rail 5V dan 3V3 tidak boleh dihubungkan langsung.");
  }
  for (const c of project.components) {
    if (c.type === "resistor" && !(c.properties.resistance > 0)) add(`resistor-${c.id}`, "Resistansi harus lebih besar dari nol.", "error", c.id);
    if (getDefinition(c.type).category !== "Boards" && !getDefinition(c.type).groups && !project.wires.some((w) => w.from.componentId === c.id || w.to.componentId === c.id)) add(`floating-${c.id}`, `${c.label} belum terhubung.`, "warning", c.id);
  }
  return problems;
}
