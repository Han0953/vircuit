import { Handle, Position } from "@xyflow/react";
import { pinHitSize, type VisualLayout } from "../visuals/pin-layout";
const sides = { top: Position.Top, right: Position.Right, bottom: Position.Bottom, left: Position.Left };
export function PinHandles({ layout, label }: { layout: VisualLayout; label: string }) {
  return <>{layout.anchors.map(({ pin, x, y, side }) => <Handle key={pin.id} type="source" id={pin.id} position={sides[side]} role="button" tabIndex={0}
    aria-label={`${label} · Pin ${pin.label}`} title={`${pin.label} · ${pin.kind}`} className="component-pin"
    onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); event.currentTarget.click(); } }}
    style={{ width: pinHitSize, height: pinHitSize, minWidth: pinHitSize, minHeight: pinHitSize, left: x, top: y, right: "auto", bottom: "auto", transform: "translate(-50%, -50%)" }} />)}</>;
}
