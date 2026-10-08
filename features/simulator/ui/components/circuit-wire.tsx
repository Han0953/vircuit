import { BaseEdge, getBezierPath, Position, type EdgeProps } from "@xyflow/react";
import { pinHitSize } from "../visuals/pin-layout";

function pinCenter(x: number, y: number, position: Position) {
  const radius = pinHitSize / 2;
  switch (position) {
    case Position.Top: return { x, y: y + radius };
    case Position.Bottom: return { x, y: y - radius };
    case Position.Left: return { x: x + radius, y };
    case Position.Right: return { x: x - radius, y };
  }
}

export function CircuitWire(props: EdgeProps) {
  // React Flow attaches to the hit-area boundary; electrical wires end at the pin center.
  const source = pinCenter(props.sourceX, props.sourceY, props.sourcePosition);
  const target = pinCenter(props.targetX, props.targetY, props.targetPosition);
  const [path] = getBezierPath({ ...props, sourceX: source.x, sourceY: source.y, targetX: target.x, targetY: target.y });
  return <BaseEdge id={props.id} path={path} style={props.style} markerEnd={props.markerEnd} markerStart={props.markerStart} />;
}
