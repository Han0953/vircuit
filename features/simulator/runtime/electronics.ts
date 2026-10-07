import { buildCircuit } from "../graph/circuit";
import type { ComponentInstance, Project } from "../types/project";
export class Electronics {
  readonly graph;
  readonly inputs: Record<string, Record<string, number>> = {};
  readonly pins: Record<string, number> = {};
  readonly modes: Record<string, number> = {};
  constructor(readonly project: Project, readonly board: ComponentInstance) {
    this.graph = buildCircuit(project);
    for (const c of project.components) this.inputs[c.id] = { ...c.properties };
  }
  private net(id: string, pin: string) { return this.graph.netByPin.get(`${id}.${pin}`) ?? `${id}.${pin}`; }
  signal(id: string, pin: string, contacts = false): number | undefined {
    const adjacency = new Map<string, string[]>();
    const connect = (a: string, b: string) => { adjacency.set(a, [...(adjacency.get(a) ?? []), b]); adjacency.set(b, [...(adjacency.get(b) ?? []), a]); };
    for (const c of this.project.components) {
      if (c.type === "resistor" || (c.type === "button" && this.inputs[c.id].pressed)) connect(this.net(c.id, "1"), this.net(c.id, "2"));
      if (contacts && c.type === "relay" && this.powered(c.id)) connect(this.net(c.id, "COM"), this.net(c.id, (this.signal(c.id, "IN") ?? 0) > 0.5 ? "NO" : "NC"));
    }
    const visited = new Set<string>(); const queue = [this.net(id, pin)];
    while (queue.length) { const net = queue.pop()!; if (visited.has(net)) continue; visited.add(net); queue.push(...(adjacency.get(net) ?? [])); }
    const values: number[] = [];
    const connected = (componentId: string, pinId: string) => visited.has(this.net(componentId, pinId));
    if (connected(this.board.id, "GND")) values.push(0);
    if (connected(this.board.id, "5V") || connected(this.board.id, "3V3")) values.push(1);
    for (const [pinId, value] of Object.entries(this.pins)) if (connected(this.board.id, pinId)) values.push(value);
    for (const c of this.project.components) if (c.type === "pot" && pin !== "VCC" && pin !== "GND" && connected(c.id, "OUT") && this.powered(c.id)) values.push(Math.max(0, Math.min(100, this.inputs[c.id].value)) / 100);
    if (!values.length) return undefined;
    if (values.some((v) => v === 0) && values.some((v) => v > 0)) throw new Error("Konflik sinyal: output/power terhubung ke GND atau output lain. Periksa wiring.");
    return Math.max(...values);
  }
  powered(id: string) { return this.signal(id, "VCC") === 1 && this.signal(id, "GND") === 0; }
  outputs(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const c of this.project.components) {
      if (c.type === "led") result[c.id] = this.signal(c.id, "K") === 0 ? this.signal(c.id, "A") ?? 0 : 0;
      if (c.type === "relay") result[c.id] = Number(this.powered(c.id) && (this.signal(c.id, "IN") ?? 0) > 0.5);
      if (c.type === "fan") result[c.id] = this.signal(c.id, "-", true) === 0 ? this.signal(c.id, "+", true) ?? 0 : 0;
    }
    return result;
  }
}
