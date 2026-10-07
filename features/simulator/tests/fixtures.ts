import { getDefinition } from "../catalog/registry";
import { emptyProject } from "../stores/project-store";
import type { Project } from "../types/project";
export function fixture(types: Record<string, string>, connections: string[][], source: string): Project {
  const p = emptyProject(); p.code.source = source;
  p.components = Object.entries(types).map(([id, type], n) => ({ id, type, label: getDefinition(type).name, properties: { ...getDefinition(type).defaults }, position: { x: n * 280, y: 0 }, rotation: 0 }));
  p.settings.boardId = p.components.find((c) => ["uno", "esp32"].includes(c.type))?.id ?? null;
  p.wires = connections.map(([a, b], n) => { const [componentId, pinId] = a.split("."); const [toId, toPin] = b.split("."); return { id: `w${n}`, from: { componentId, pinId }, to: { componentId: toId, pinId: toPin }, color: "blue" }; });
  return p;
}
