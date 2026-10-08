import type { ComponentInstance, Wire } from "../../types/project";
import type { Route } from "../../routing/types";
import type { CircuitNode } from "../components/component-node";
import type { CircuitEdge } from "../components/circuit-wire";

export class FlowElements {
  private nodes = new Map<string, CircuitNode>();
  private edges = new Map<string, { wire: Wire; edge: CircuitEdge }>();

  componentNodes(components: readonly ComponentInstance[], selection: readonly string[]): CircuitNode[] {
    const next = new Map<string, CircuitNode>();
    const selected = new Set(selection);
    for (const component of components) {
      const previous = this.nodes.get(component.id), isSelected = selected.has(component.id);
      const node: CircuitNode = previous?.data.component === component && previous.selected === isSelected ? previous
        : { id: component.id, type: "component", zIndex: component.type.startsWith("breadboard-") ? 0 : 1, position: component.position, selected: isSelected, data: { component } };
      next.set(component.id, node);
    }
    this.nodes = next;
    return [...next.values()];
  }

  wireEdges(wires: readonly Wire[], selection: readonly string[], routes: ReadonlyMap<string, Route>): CircuitEdge[] {
    const next = new Map<string, { wire: Wire; edge: CircuitEdge }>();
    const selected = new Set(selection);
    for (const wire of wires) {
      const previous = this.edges.get(wire.id), isSelected = selected.has(wire.id), route = routes.get(wire.id);
      const edge: CircuitEdge = previous?.wire === wire && previous.edge.selected === isSelected && previous.edge.data?.route === route ? previous.edge
        : { id: wire.id, type: "wire", zIndex: 2, source: wire.from.componentId, sourceHandle: wire.from.pinId, target: wire.to.componentId, targetHandle: wire.to.pinId, selected: isSelected, data: { route }, style: { stroke: wire.color === "red" ? "var(--destructive)" : wire.color === "green" ? "var(--success)" : wire.color === "neutral" ? "var(--foreground)" : "var(--primary)", strokeWidth: 2 } };
      next.set(wire.id, { wire, edge });
    }
    this.edges = next;
    return [...next.values()].map((entry) => entry.edge);
  }
}
