import { create } from "zustand";
import { getDefinition } from "../catalog/registry";
import type { ComponentInstance, Project } from "../types/project";
import { normalizeRotation } from "../geometry/rotation";

export const emptyProject = (): Project => ({ schemaVersion: 1, metadata: { name: "Proyek tanpa judul" }, components: [], wires: [], viewport: { x: 0, y: 0, zoom: 1 }, code: { language: "arduino-cpp-subset", source: "void setup() {\n  pinMode(13, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(13, HIGH);\n  delay(500);\n  digitalWrite(13, LOW);\n  delay(500);\n}\n" }, settings: { boardId: null } });
interface ProjectStore {
  project: Project; past: Project[]; future: Project[];
  edit: (update: (project: Project) => Project, history?: boolean) => void;
  checkpoint: () => void;
  move: (positions: ReadonlyMap<string, { x: number; y: number }>) => void;
  add: (type: string, position: { x: number; y: number }) => void;
  remove: (ids: string[]) => void;
  clearCircuit: () => void;
  updateComponent: (id: string, update: Partial<ComponentInstance>) => void;
  duplicate: (ids: string[]) => void;
  undo: () => void; redo: () => void;
}
export const useProject = create<ProjectStore>((set, get) => ({
  project: emptyProject(), past: [], future: [],
  edit: (update, history = true) => set((s) => {
    const project = update(s.project);
    if (project === s.project) return s;
    return { project, past: history ? [...s.past.slice(-49), s.project] : s.past, future: history ? [] : s.future };
  }),
  checkpoint: () => set((s) => ({ past: [...s.past.slice(-49), s.project], future: [] })),
  move: (positions) => {
    if (!positions.size) return;
    get().edit((project) => {
      let changed = false;
      const components = project.components.map((component) => {
        const position = positions.get(component.id);
        if (!position || (position.x === component.position.x && position.y === component.position.y)) return component;
        changed = true;
        return { ...component, position };
      });
      return changed ? { ...project, components } : project;
    }, false);
  },
  add: (type, position) => {
    if (get().project.components.length >= 100) return;
    const definition = getDefinition(type);
    const id = crypto.randomUUID();
    get().edit((p) => ({ ...p, components: [...p.components, { id, type, position, label: definition.name, rotation: 0, properties: { ...definition.defaults } }], settings: { boardId: p.settings.boardId ?? (definition.category === "Boards" ? id : null) } }));
  },
  remove: (ids) => get().edit((p) => {
    if (!p.components.some((c) => ids.includes(c.id)) && !p.wires.some((w) => ids.includes(w.id))) return p;
    return { ...p, components: p.components.filter((c) => !ids.includes(c.id)), wires: p.wires.filter((w) => !ids.includes(w.id) && !ids.includes(w.from.componentId) && !ids.includes(w.to.componentId)), settings: { boardId: ids.includes(p.settings.boardId ?? "") ? null : p.settings.boardId } };
  }),
  clearCircuit: () => get().remove([...get().project.components.map((c) => c.id), ...get().project.wires.map((w) => w.id)]),
  updateComponent: (id, update) => get().edit((p) => ({ ...p, components: p.components.map((c) => c.id === id ? { ...c, ...update, rotation: normalizeRotation(update.rotation ?? c.rotation) } : c) })),
  duplicate: (ids) => get().edit((p) => {
    const source = p.components.filter((c) => ids.includes(c.id));
    if (!source.length || p.components.length + source.length > 100) return p;
    return { ...p, components: [...p.components, ...source.map((c) => ({ ...c, id: crypto.randomUUID(), properties: { ...c.properties }, position: { x: c.position.x + 40, y: c.position.y + 40 } }))] };
  }),
  undo: () => set((s) => s.past.length ? { project: s.past.at(-1)!, past: s.past.slice(0, -1), future: [s.project, ...s.future] } : s),
  redo: () => set((s) => s.future.length ? { project: s.future[0], future: s.future.slice(1), past: [...s.past, s.project] } : s),
}));
