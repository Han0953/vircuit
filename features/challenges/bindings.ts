import type { Project } from "@/features/simulator/types/project";
import type { Bindings, Challenge, Role } from "./contracts";
export function roleCandidates(project: Project, role: Role) {
  const types = role === "board" ? ["uno", "esp32"] : role === "potentiometer" ? ["pot"] : role === "button" ? ["button"] : ["led"];
  return project.components.filter((c) => types.includes(c.type));
}
export function resolveBindings(project: Project, challenge: Challenge, requested: Bindings): Bindings {
  const result: Bindings = {};
  for (const role of challenge.roles) {
    const candidates = roleCandidates(project, role);
    const selected = requested[role];
    if (selected && candidates.some((c) => c.id === selected)) result[role] = selected;
    else if (!selected && candidates.length === 1) result[role] = candidates[0].id;
  }
  return result;
}
export function bindingsComplete(challenge: Challenge, bindings: Bindings) {
  const values = challenge.roles.map((r) => bindings[r]);
  return values.every(Boolean) && new Set(values).size === values.length;
}
