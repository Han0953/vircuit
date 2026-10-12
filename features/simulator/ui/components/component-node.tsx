import { RuntimeControls } from "./runtime-controls";
import { PinHandles } from "./pin-handles";
import { memo, useEffect, useMemo } from "react";
import { useUpdateNodeInternals, type Node, type NodeProps } from "@xyflow/react";
import { getDefinition } from "../../catalog/registry";
import type { ComponentInstance } from "../../types/project";
import { visualLayout, rotateLayout } from "../visuals/pin-layout";
import { ComponentVisual } from "../visuals/component-visual";
import { useSimulation } from "../../stores/simulation-store";
export type CircuitNode = Node<{ component: ComponentInstance }, "component">;
export const ComponentNode = memo(function ComponentNode({ data, selected, id }: NodeProps<CircuitNode>) {
  const component = data.component;
  const definition = getDefinition(component.type);
  const output = useSimulation((s) => s.outputs[component.id] ?? 0);
  const display = useSimulation((s) => s.displays[component.id]);
  const inputKey = component.type === "button" ? "pressed" : component.type === "ldr" ? "light" : component.type === "pir" ? "motion" : "value";
  const value = useSimulation((s) => s.inputs[component.id]?.[inputKey] ?? component.properties[inputKey] ?? definition.defaults[inputKey] ?? 0);
  const temperature = useSimulation((s) => s.inputs[component.id]?.temperature ?? component.properties.temperature);
  const humidity = useSimulation((s) => s.inputs[component.id]?.humidity ?? component.properties.humidity);
  const layout = useMemo(() => visualLayout(definition), [definition]);
  const rotated = useMemo(() => rotateLayout(layout, component.rotation), [layout, component.rotation]);
  const update = useUpdateNodeInternals();
  useEffect(() => { update(id); }, [id, rotated, update]);
  return <div title={`${component.label}${definition.support === "visual-only" ? " · Visual saja" : ""}`} data-testid="component-body" style={{ width: rotated.width, height: rotated.height }} className={`component-art component-object relative ${selected ? "is-selected" : ""}`}>
    <ComponentVisual component={component} layout={layout} rotated={rotated} output={output} value={value} temperature={temperature} humidity={humidity} display={display} />
    {["lcd16x2", "oled"].includes(component.type) && <output aria-label={`Data ${component.label}`} data-testid={`display-${id}`} className="sr-only">{display ? display.lines.map((text) => text.trimEnd()).join("\n") : "Display belum diinisialisasi."}</output>}
    <div className="pointer-events-none absolute left-0 top-0" style={{ width: layout.width, height: layout.height, transformOrigin: "center", transform: `translate(${(rotated.width - layout.width) / 2}px, ${(rotated.height - layout.height) / 2}px) rotate(${component.rotation}deg)` }}>
      <RuntimeControls component={component} layout={layout} />
    </div>
    <PinHandles layout={rotated} label={component.label} />
  </div>;
}, (previous, next) => previous.id === next.id && previous.selected === next.selected && previous.data.component === next.data.component);
