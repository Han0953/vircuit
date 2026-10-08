import { memo } from "react";
import type { ComponentInstance } from "../../types/project";
import type { VisualLayout } from "./pin-layout";
import { BoardVisual } from "./board-visual";
import { BreadboardVisual } from "./breadboard-visual";
import { BasicVisual } from "./basic-visual";
import { PeripheralVisual } from "./peripheral-visual";
export const ComponentVisual = memo(function ComponentVisual({ component, layout, rotated, output, value, temperature, humidity }: { component: ComponentInstance; layout: VisualLayout; rotated: VisualLayout; output: number; value: number; temperature?: number; humidity?: number }) {
  return <svg width={rotated.width} height={rotated.height} viewBox={`0 0 ${rotated.width} ${rotated.height}`} data-output={output} data-value={value} className="block overflow-visible" aria-hidden="true">
    <g transform={`translate(${rotated.width / 2} ${rotated.height / 2}) rotate(${component.rotation}) translate(${-layout.width / 2} ${-layout.height / 2})`}>
      {["uno", "nano", "esp32"].includes(component.type) ? <BoardVisual type={component.type} layout={layout} /> : component.type.startsWith("breadboard-") ? <BreadboardVisual layout={layout} /> : ["led", "resistor", "button", "pot"].includes(component.type) ? <BasicVisual component={component} layout={layout} output={output} value={value} /> : ["dht22", "relay", "fan"].includes(component.type) ? <PeripheralVisual component={component} layout={layout} output={output} temperature={temperature} humidity={humidity} /> : <>
        <rect x="7" y="7" width={layout.width - 14} height={layout.height - 14} rx="8" fill="var(--surface-muted)" stroke="var(--border-strong)" />
        <text x={layout.width / 2} y={layout.height / 2} textAnchor="middle" fill="var(--foreground)" fontSize="12">{component.label}</text>
        {layout.anchors.map(({ pin, x, y, side }) => <g key={pin.id} data-visual-pin={pin.id}><circle cx={x} cy={y} r="4" fill="var(--part-metal)" stroke="var(--part-outline)" /><text x={x + (side === "left" ? 12 : side === "right" ? -12 : 0)} y={y + (side === "bottom" ? -12 : side === "top" ? 18 : 4)} textAnchor={side === "left" ? "start" : side === "right" ? "end" : "middle"} fill="var(--foreground)" fontSize="9">{pin.label}</text></g>)}
      </>}
    </g>
  </svg>;
});
