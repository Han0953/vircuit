import { RuntimeControls } from "./runtime-controls";
import { PinHandles } from "./pin-handles";
import { memo } from "react";
import type { Node, NodeProps } from "@xyflow/react";
import { getDefinition } from "../../catalog/registry";
import type { ComponentInstance } from "../../types/project";

export type CircuitNode = Node<{ component: ComponentInstance }, "component">;
export const ComponentNode = memo(function ComponentNode({ data, selected }: NodeProps<CircuitNode>) {
  const component = data.component;
  const definition = getDefinition(component.type);
  return <div style={{ width: definition.groups ? 720 : 240 }} className={`relative rounded-lg border-2 bg-surface p-4 shadow-sm ${selected ? "border-primary" : "border-border"}`}>
    <svg viewBox="0 0 160 64" className="mb-2 h-16 w-full text-primary" aria-hidden="true" style={{ transform: `rotate(${component.rotation}deg)` }}>
      {component.type === "led" ? <><path d="M64 48V24a16 16 0 0 1 32 0v24Z" fill="currentColor" opacity=".3" /><path d="M68 48v14m24-14v14" stroke="currentColor" strokeWidth="3" /></> : component.type === "resistor" ? <><path d="M12 32h30m76 0h30" stroke="currentColor" strokeWidth="3"/><rect x="42" y="20" width="76" height="24" rx="8" fill="currentColor" opacity=".25"/><path d="M62 20v24m14-24v24m22-24v24" stroke="currentColor" strokeWidth="5"/></> : <><rect x="16" y="4" width="128" height="56" rx="6" fill="currentColor" opacity=".15"/><rect x="62" y="16" width="36" height="32" rx="3" fill="currentColor"/><path d="M22 16h26m-26 16h26m-26 16h26m64-32h26m-26 16h26m-26 16h26" stroke="currentColor" strokeWidth="3"/></>}
    </svg>
    <p className="truncate text-sm font-medium">{component.label}</p>
    <p className="text-xs text-text-secondary">{definition.category} · {definition.support === "visual-only" ? "Visual saja" : "Subset MVP"}</p>
    <RuntimeControls component={component} />
    <PinHandles definition={definition} />
  </div>;
});
