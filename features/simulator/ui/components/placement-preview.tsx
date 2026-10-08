import { ViewportPortal } from "@xyflow/react";
import type { ComponentInstance } from "../../types/project";
import type { Placement } from "../../geometry/breadboard-placement";
import { getDefinition } from "../../catalog/registry";
import { rotateLayout, visualLayout } from "../visuals/pin-layout";

export function PlacementPreview({ component, placement }: { component: ComponentInstance; placement: Placement }) {
  if (!placement.valid) return null;
  const layout = rotateLayout(visualLayout(getDefinition(component.type)), component.rotation);
  return <ViewportPortal><svg data-testid="placement-preview" className="pointer-events-none absolute overflow-visible" style={{ left: placement.position.x, top: placement.position.y }} width={layout.width} height={layout.height} aria-hidden="true">
    <rect x={-3} y={-3} width={layout.width + 6} height={layout.height + 6} rx={4} stroke="var(--primary)" fill="var(--primary-soft)" fillOpacity={0.25} strokeDasharray="4 4" />
    {placement.holes.map((hole) => <circle key={hole.pinId} cx={hole.x - placement.position.x} cy={hole.y - placement.position.y} r={8} fill="var(--primary)" fillOpacity={0.3} stroke="var(--primary)" />)}
  </svg></ViewportPortal>;
}
