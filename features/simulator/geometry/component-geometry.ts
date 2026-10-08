import { getDefinition } from "../catalog/registry";
import type { ComponentInstance } from "../types/project";
import { rotateLayout, visualLayout, type Anchor, type Bounds } from "../ui/visuals/pin-layout";

export function componentGeometry(component: ComponentInstance): { bounds: Bounds; anchors: Anchor[]; surface: boolean } {
  const layout = rotateLayout(visualLayout(getDefinition(component.type)), component.rotation);
  return {
    bounds: { ...component.position, width: layout.width, height: layout.height },
    anchors: layout.anchors.map((anchor) => ({ ...anchor, x: anchor.x + component.position.x, y: anchor.y + component.position.y })),
    surface: component.type.startsWith("breadboard-"),
  };
}

export function worldPins(component: ComponentInstance): Anchor[] {
  return componentGeometry(component).anchors;
}
