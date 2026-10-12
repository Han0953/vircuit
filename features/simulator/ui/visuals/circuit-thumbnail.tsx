import { memo } from "react";
import type { Project } from "../../types/project";
import { componentGeometry } from "../../geometry/component-geometry";
import { getDefinition } from "../../catalog/registry";
import { ComponentVisual } from "./component-visual";
import { visualLayout, rotateLayout } from "./pin-layout";

export const CircuitThumbnail = memo(function CircuitThumbnail({ project, title }: { project: Project; title: string }) {
  const geometry = new Map(project.components.map((component) => [component.id, componentGeometry(component)]));
  const width = Math.max(...[...geometry.values()].map(({ bounds }) => bounds.x + bounds.width)) + 48;
  const height = Math.max(...[...geometry.values()].map(({ bounds }) => bounds.y + bounds.height)) + 48;
  return <svg role="img" aria-label={`Pratinjau rangkaian ${title}`} viewBox={`-24 -24 ${width} ${height}`} className="component-art h-full w-full">
    {project.components.map((component) => {
      const layout = visualLayout(getDefinition(component.type)), rotated = rotateLayout(layout, component.rotation);
      return <g key={component.id} transform={`translate(${component.position.x} ${component.position.y})`}><ComponentVisual component={component} layout={layout} rotated={rotated} output={0} value={component.properties.value ?? component.properties.light ?? 0} /></g>;
    })}
    <g fill="none" strokeWidth={3} strokeLinejoin="round" opacity={.8}>{project.wires.map((wire) => {
      const from = geometry.get(wire.from.componentId)?.anchors.find((a) => a.pin.id === wire.from.pinId), to = geometry.get(wire.to.componentId)?.anchors.find((a) => a.pin.id === wire.to.pinId);
      if (!from || !to) return null;
      const middle = (from.x + to.x) / 2;
      return <path key={wire.id} d={`M${from.x} ${from.y}H${middle}V${to.y}H${to.x}`} stroke={wire.color === "red" ? "var(--destructive)" : wire.color === "neutral" ? "var(--text-secondary)" : "var(--primary)"} />;
    })}</g>
  </svg>;
});
