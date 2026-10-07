import { getDefinition } from "../catalog/registry";
import type { Endpoint, Project } from "../types/project";
export const endpointKey = (endpoint: Endpoint) => `${endpoint.componentId}.${endpoint.pinId}`;
export function validConnection(project: Project, from: Endpoint, to: Endpoint): boolean {
  if (endpointKey(from) === endpointKey(to)) return false;
  for (const endpoint of [from, to]) {
    const component = project.components.find((c) => c.id === endpoint.componentId);
    if (!component || !getDefinition(component.type).pins.some((p) => p.id === endpoint.pinId)) return false;
  }
  return !project.wires.some((w) => (endpointKey(w.from) === endpointKey(from) && endpointKey(w.to) === endpointKey(to)) || (endpointKey(w.from) === endpointKey(to) && endpointKey(w.to) === endpointKey(from)));
}
