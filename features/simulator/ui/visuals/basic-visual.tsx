import type { ComponentInstance } from "../../types/project";
import type { VisualLayout } from "./pin-layout";

export function BasicVisual({ component, layout, output = 0, value = 0 }: { component: ComponentInstance; layout: VisualLayout; output?: number; value?: number }) {
  return <>
    {component.type === "led" && <>
      <path d="M12 36V60M36 36V60" stroke="var(--part-metal)" strokeWidth={4} />
      <path d="M8 40V24a16 16 0 0 1 32 0v16Z" fill="var(--part-led-off)" stroke="var(--part-outline)" strokeWidth={1.5} />
      <path d="M8 40V24a16 16 0 0 1 32 0v16Z" fill="var(--part-led-on)" opacity={Math.max(0, Math.min(1, output))} />
      <path d="M15 24q0-10 8-11" fill="none" stroke="var(--part-silkscreen)" opacity={0.6} strokeWidth={3} strokeLinecap="round" />
      <path d="M6 41h36" stroke="var(--part-outline)" strokeWidth={3} />
      <text x={4} y={53} fill="var(--foreground)" fontSize={10}>+</text>
    </>}
    {component.type === "resistor" && <>
      <path d="M12 24H108" stroke="var(--part-metal)" strokeWidth={4} />
      <path d="M28 18q0-7 10-7h44q10 0 10 7v12q0 7-10 7H38q-10 0-10-7Z" fill="var(--part-resistor)" stroke="var(--part-outline)" />
      <text x={60} y={28} textAnchor="middle" fill="var(--part-outline)" fontSize={10} fontWeight={600}>{component.properties.resistance} Ω</text>
    </>}
    {component.type === "button" && <>
      <path d="M12 36H84" stroke="var(--part-metal)" strokeWidth={5} />
      <rect x={23} y={9} width={50} height={54} rx={4} fill="var(--part-chip)" stroke="var(--part-outline)" strokeWidth={1.5} />
      <rect x={26} y={12} width={44} height={48} rx={3} fill="var(--part-metal)" />
      <circle cx={48} cy={36} r={value ? 15 : 19} fill="var(--part-chip)" stroke={value ? "var(--primary)" : "var(--part-outline)"} strokeWidth={2} />
      <path d="M29 17h5m28 0h5M29 55h5m28 0h5" stroke="var(--part-outline)" strokeWidth={2} />
    </>}
    {component.type === "pot" && <>
      <path d="M24 68V108M48 74V108M72 68V108" stroke="var(--part-metal)" strokeWidth={5} />
      <circle cx={48} cy={48} r={37} fill="var(--part-metal)" stroke="var(--part-outline)" strokeWidth={2} />
      <circle cx={48} cy={48} r={28} fill="var(--part-chip)" />
      <path d="M48 48V27" transform={`rotate(${-135 + Math.max(0, Math.min(100, value)) * 2.7} 48 48)`} stroke="var(--part-silkscreen)" strokeWidth={4} strokeLinecap="round" />
    </>}
    {layout.anchors.map(({ pin, x, y, side }) => <g key={pin.id} data-visual-pin={pin.id}>
      <circle cx={x} cy={y} r={3} fill="var(--part-metal)" stroke="var(--part-outline)" />
      {component.type !== "resistor" && <text x={x} y={side === "bottom" ? y + 10 : y + 17} fill="var(--foreground)" textAnchor="middle" fontSize={8}>{pin.label}</text>}
    </g>)}
  </>;
}
