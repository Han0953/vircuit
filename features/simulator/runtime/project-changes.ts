import type { Project } from "../types/project";

export function runtimeProjectChanged(previous: Project, next: Project): boolean {
  if (previous.code.source !== next.code.source || previous.settings.boardId !== next.settings.boardId) return true;
  if (previous.components.length !== next.components.length || previous.wires.length !== next.wires.length) return true;
  if (previous.components !== next.components) {
    const byId = new Map(previous.components.map((c) => [c.id, c]));
    for (const c of next.components) {
      const old = byId.get(c.id);
      if (!old || old.type !== c.type) return true;
      if (old.properties === c.properties) continue;
      const keys = Object.keys(c.properties);
      if (keys.length !== Object.keys(old.properties).length || keys.some((key) => old.properties[key] !== c.properties[key])) return true;
    }
  }
  if (previous.wires !== next.wires) {
    const byId = new Map(previous.wires.map((w) => [w.id, w]));
    for (const w of next.wires) {
      const old = byId.get(w.id);
      if (!old || old.from.componentId !== w.from.componentId || old.from.pinId !== w.from.pinId || old.to.componentId !== w.to.componentId || old.to.pinId !== w.to.pinId) return true;
    }
  }
  return false;
}
