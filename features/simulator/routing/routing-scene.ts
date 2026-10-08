import { componentGeometry } from "../geometry/component-geometry";
import type { ComponentInstance, Wire } from "../types/project";
import { routingConfig, type Obstacle, type Port, type RoutingInput } from "./types";

export type RoutingScene = { signature: string; ports: Map<string, Port>; obstacles: Obstacle[] };
export type GeometryCache = Map<string, { signature: string; geometry: ReturnType<typeof componentGeometry> }>;
export const endpointKey = (endpoint: Wire["from"]) => `${endpoint.componentId}.${endpoint.pinId}`;

export function geometrySignature(components: readonly ComponentInstance[], wires: readonly Wire[]) {
  return JSON.stringify([
    components.map((c) => [c.id, c.type, c.position.x, c.position.y, c.rotation]).sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
    wires.map((w) => [w.id, endpointKey(w.from), endpointKey(w.to)]).sort((a, b) => a[0].localeCompare(b[0])),
  ]);
}

export function buildRoutingScene(components: readonly ComponentInstance[], wires: readonly Wire[], cache: GeometryCache = new Map()): RoutingScene {
  const ports = new Map<string, Port>(), obstacles: Obstacle[] = [];
  const attached = new Set(wires.flatMap((w) => [endpointKey(w.from), endpointKey(w.to)]));
  for (const component of components) {
    const signature = JSON.stringify([component.type, component.position.x, component.position.y, component.rotation]);
    const cached = cache.get(component.id);
    const geometry = cached?.signature === signature ? cached.geometry : componentGeometry(component);
    cache.set(component.id, { signature, geometry });
    const { bounds, surface } = geometry;
    if (!surface) obstacles.push({ id: component.id, x: bounds.x - routingConfig.clearance, y: bounds.y - routingConfig.clearance, width: bounds.width + 2 * routingConfig.clearance, height: bounds.height + 2 * routingConfig.clearance });
    for (const anchor of geometry.anchors) {
      const key = `${component.id}.${anchor.pin.id}`;
      if (attached.has(key)) ports.set(key, { x: anchor.x, y: anchor.y, side: anchor.side, owner: component.id, bounds, surface });
    }
  }
  const present = new Set(components.map((c) => c.id));
  for (const id of cache.keys()) if (!present.has(id)) cache.delete(id);
  obstacles.sort((a, b) => a.id.localeCompare(b.id));
  return { signature: geometrySignature(components, wires), ports, obstacles };
}

export function wireInput(scene: RoutingScene, wire: Wire): RoutingInput | undefined {
  const source = scene.ports.get(endpointKey(wire.from)), target = scene.ports.get(endpointKey(wire.to));
  return source && target ? { source, target, obstacles: scene.obstacles } : undefined;
}
