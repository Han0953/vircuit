import { Handle, Position } from "@xyflow/react";
import type { ComponentDefinition } from "../../types/project";
export function PinHandles({ definition }: { definition: ComponentDefinition }) {
  return <div className={`mt-3 grid gap-x-4 gap-y-1 ${definition.groups ? "grid-cols-10" : "grid-cols-2"}`}>
    {definition.pins.map((pin, i) => <div key={pin.id} className="relative flex min-h-11 items-center justify-center rounded border bg-surface-muted px-3 text-xs">
      <span>{pin.label}</span>
      <Handle type="source" id={pin.id} position={i % 2 ? Position.Right : Position.Left} aria-label={`Pin ${pin.label}`} title={`${pin.label} · ${pin.kind}`} style={{ width: 18, height: 32, borderRadius: 6, background: "var(--primary)", borderColor: "var(--surface)" }} />
    </div>)}
  </div>;
}
