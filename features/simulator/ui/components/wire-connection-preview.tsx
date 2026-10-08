import { ViewportPortal, useStore, type ConnectionLineComponentProps } from "@xyflow/react";
import { componentGeometry } from "../../geometry/component-geometry";
import { escapePorts, previewRoute, routeResult } from "../../routing/route-geometry";
import type { Port } from "../../routing/types";
import type { CircuitNode } from "./component-node";
import { useProject } from "../../stores/project-store";

export function WireConnectionPreview(props: ConnectionLineComponentProps<CircuitNode>) {
  const from = componentGeometry({ ...props.fromNode.data.component, position: props.fromNode.position });
  const source = from.anchors.find((a) => a.pin.id === props.fromHandle.id);
  if (!source) return null;
  let target: Port = { x: props.toX, y: props.toY, side: props.toPosition };
  if (props.toNode && props.toHandle) {
    const to = componentGeometry({ ...props.toNode.data.component, position: props.toNode.position });
    const anchor = to.anchors.find((a) => a.pin.id === props.toHandle?.id);
    if (anchor) target = { ...anchor, bounds: to.bounds, surface: to.surface };
  }
  const route = previewRoute({ ...source, bounds: from.bounds, surface: from.surface }, target);
  return <path className="react-flow__connection-path" d={route.path} fill="none" stroke={props.connectionStatus === "invalid" ? "var(--destructive)" : "var(--primary)"} strokeWidth={2} strokeDasharray="6 4" />;
}

export function TapWirePreview() {
  const start = useStore((state) => state.connectionClickStartHandle);
  const dragging = useStore((state) => state.connection.inProgress);
  const component = useProject((state) => start ? state.project.components.find((c) => c.id === start.nodeId) : undefined);
  if (!start || !component || dragging) return null;
  const geometry = componentGeometry(component);
  const anchor = geometry.anchors.find((a) => a.pin.id === start.id);
  if (!anchor) return null;
  const port = { ...anchor, bounds: geometry.bounds, surface: geometry.surface };
  const route = routeResult([port, escapePorts(port)[0]], "fallback");
  // XYFlow's click-to-connect state does not render its drag connection line.
  return <ViewportPortal><svg aria-hidden="true" width={1} height={1} className="pointer-events-none absolute left-0 top-0 overflow-visible">
    <path className="react-flow__connection-path" d={route.path} fill="none" stroke="var(--primary)" strokeWidth={2} strokeDasharray="6 4" />
  </svg></ViewportPortal>;
}
