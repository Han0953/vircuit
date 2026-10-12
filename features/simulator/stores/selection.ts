import type { Project } from "../types/project";

export function circuitIds(project: Project): string[] {
  return [...project.components.map((c) => c.id), ...project.wires.map((w) => w.id)];
}
export function validSelection(project: Project, selection: readonly string[]): string[] {
  const valid = new Set(circuitIds(project));
  return [...new Set(selection)].filter((id) => valid.has(id));
}
export function updateSelection(selection: readonly string[], changes: readonly { id: string; selected: boolean }[]): string[] {
  const ids = new Set(selection);
  for (const change of changes) { if (change.selected) ids.add(change.id); else ids.delete(change.id); }
  return [...ids];
}
export function isEditingText(target: EventTarget | null): boolean {
  return target instanceof Element && !!target.closest("input,textarea,select,[contenteditable='true'],[role='textbox'],[role='combobox'],.monaco-editor");
}
