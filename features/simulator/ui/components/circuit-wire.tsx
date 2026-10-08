import { BaseEdge, Position, useViewport, type Edge, type EdgeProps } from "@xyflow/react";
import { pinHitSize } from "../visuals/pin-layout";
import { previewRoute } from "../../routing/route-geometry";
import type { Route } from "../../routing/types";
import { memo } from "react";

export type CircuitEdge = Edge<{ route?: Route }, "wire">;

function pinCenter(x: number, y: number, position: Position) {
  const radius = pinHitSize / 2;
  switch (position) {
    case Position.Top: return { x, y: y + radius };
    case Position.Bottom: return { x, y: y - radius };
    case Position.Left: return { x: x + radius, y };
    case Position.Right: return { x: x - radius, y };
  }
}

export const CircuitWire = memo(function CircuitWire(props: EdgeProps<CircuitEdge>) {
  // React Flow attaches to the hit-area boundary; electrical wires end at the pin center.
  const source = pinCenter(props.sourceX, props.sourceY, props.sourcePosition);
  const target = pinCenter(props.targetX, props.targetY, props.targetPosition);
  const { zoom } = useViewport();
  const route = props.data?.route ?? previewRoute({ ...source, side: props.sourcePosition }, { ...target, side: props.targetPosition });
  const coincident = route.status === "coincident";
  const path = coincident ? `${route.path} L${source.x} ${source.y}` : route.path;
  return <g data-routing-status={route.status}>
    <path d={path} className={`wire-highlight${props.selected ? " is-selected" : ""}`} />
    <BaseEdge id={props.id} path={path} interactionWidth={Math.min(24 / zoom, 32)} style={{ ...props.style, strokeWidth: props.selected ? 3 : 2 }} markerEnd={props.markerEnd} markerStart={props.markerStart} />
    {coincident && <circle cx={source.x} cy={source.y} r={4 / zoom} style={{ fill: props.style?.stroke }} className="wire-coincident" />}
  </g>;
}, (previous, next) => previous.id === next.id && previous.selected === next.selected
  && previous.data?.route === next.data?.route && previous.style?.stroke === next.style?.stroke
  && previous.style?.strokeWidth === next.style?.strokeWidth
  && previous.sourceX === next.sourceX && previous.sourceY === next.sourceY && previous.targetX === next.targetX && previous.targetY === next.targetY
  && previous.sourcePosition === next.sourcePosition && previous.targetPosition === next.targetPosition
  && previous.markerStart === next.markerStart && previous.markerEnd === next.markerEnd);
