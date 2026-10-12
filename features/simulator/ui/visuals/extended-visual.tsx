import type { ComponentInstance } from "../../types/project";
import type { VisualLayout } from "./pin-layout";

export const extendedTypes = ["ldr", "hcsr04", "pir", "buzzer", "servo", "lcd16x2", "oled"];

export function ExtendedVisual({ component, layout, value, output }: { component: ComponentInstance; layout: VisualLayout; value: number; output: number }) {
  const { width: w, height: h } = layout;
  const type = component.type;
  return <g data-hardware={type}>
    {type === "ldr" && <>
      <rect x={8} y={8} width={w - 16} height={h - 36} rx={6} fill="var(--part-pcb)" stroke="var(--part-outline)" strokeWidth={2} />
      <circle cx={w / 2} cy={42} r={25} fill="var(--part-resistor)" stroke="var(--part-outline)" strokeWidth={2} />
      <path d="M45 25v28h8V29h9v24h9V25" fill="none" stroke="var(--part-positive)" strokeWidth={3} />
      <rect x={22} y={84} width={28} height={35} rx={3} fill="var(--part-chip)" /><rect x={66} y={86} width={32} height={30} rx={3} fill="var(--part-relay)" />
      <circle cx={82} cy={101} r={9} fill="var(--part-metal)" /><path d="M75 101h14" stroke="var(--part-outline)" strokeWidth={2} />
      <text x={w / 2} y={140} textAnchor="middle" fontSize={11} fill="var(--part-silkscreen)">LDR · {Math.round(value)}%</text>
    </>}
    {type === "hcsr04" && <>
      <rect x={5} y={8} width={w - 10} height={h - 37} rx={5} fill="var(--part-pcb)" stroke="var(--part-outline)" strokeWidth={2} />
      {[65, w - 65].map((x, i) => <g key={x}><circle cx={x} cy={55} r={41} fill="var(--part-metal)" stroke="var(--part-outline)" strokeWidth={2} /><circle cx={x} cy={55} r={31} fill="var(--part-chip)" /><circle cx={x} cy={55} r={25} fill="none" stroke="var(--part-metal)" strokeWidth={2} /><text x={x} y={59} textAnchor="middle" fontSize={12} fill="var(--part-metal)">{i ? "R" : "T"}</text></g>)}
      <text x={w / 2} y={45} textAnchor="middle" fontSize={11} fill="var(--part-silkscreen)">{Math.max(2, Math.min(400, component.properties.distance ?? 100))} cm</text>
      <text x={w / 2} y={70} textAnchor="middle" fontSize={10} fill="var(--part-silkscreen)">HC-SR04</text><text x={w / 2} y={88} textAnchor="middle" fontSize={9} fill="var(--part-silkscreen)">VISUAL</text>
    </>}
    {type === "pir" && <>
      <rect x={8} y={8} width={w - 16} height={h - 36} rx={5} fill="var(--part-terminal)" stroke="var(--part-outline)" strokeWidth={2} />
      <circle cx={w / 2} cy={66} r={48} fill="var(--part-breadboard)" stroke={value ? "var(--primary)" : "var(--part-metal)"} strokeWidth={3} />
      {[18, 32].map((r) => <circle key={r} cx={w / 2} cy={66} r={r} fill="none" stroke="var(--part-groove)" strokeWidth={2} />)}
      <path d="M25 66h94M72 19v94M39 33l66 66M105 33l-66 66" stroke="var(--part-groove)" />
      <text x={w / 2} y={124} textAnchor="middle" fontSize={10} fill="var(--part-silkscreen)">{value ? "GERAKAN" : "PIR"}</text>
    </>}
    {type === "buzzer" && <>
      <path d="M36 76v32M60 76v32" stroke="var(--part-metal)" strokeWidth={4} />
      <ellipse cx={48} cy={49} rx={38} ry={36} fill="var(--part-chip)" stroke="var(--part-outline)" strokeWidth={3} />
      <circle cx={48} cy={43} r={9} fill="var(--part-outline)" stroke="var(--part-metal)" />
      <text x={25} y={32} fill="var(--part-silkscreen)" fontSize={13}>+</text>
      <text x={48} y={71} textAnchor="middle" fill={output ? "var(--primary)" : "var(--part-silkscreen)"} fontSize={10}>{output ? "ON" : "OFF"}</text>
    </>}
    {type === "servo" && <>
      <path d="M31 112H12V43h144v69h-19" fill="var(--part-relay)" stroke="var(--part-outline)" strokeWidth={3} />
      <rect x={31} y={30} width={106} height={105} rx={7} fill="var(--part-relay)" stroke="var(--part-outline)" strokeWidth={2} />
      <rect x={41} y={103} width={86} height={24} rx={2} fill="var(--part-chip)" />
      <text x={84} y={119} textAnchor="middle" fill="var(--part-silkscreen)" fontSize={10}>SERVO · VISUAL</text>
      <g transform={`rotate(${Math.max(0, Math.min(180, component.properties.angle ?? 90)) - 90} 84 62)`}><rect x={45} y={54} width={78} height={16} rx={8} fill="var(--part-breadboard)" stroke="var(--part-metal)" /><circle cx={84} cy={62} r={9} fill="var(--part-metal)" /></g>
    </>}
    {type === "lcd16x2" && <>
      <rect x={5} y={8} width={w - 10} height={h - 36} rx={5} fill="var(--part-pcb-dark)" stroke="var(--part-outline)" strokeWidth={3} />
      <rect x={28} y={25} width={w - 56} height={111} rx={4} fill="var(--part-chip)" stroke="var(--part-metal)" strokeWidth={3} />
      <rect x={42} y={38} width={w - 84} height={84} fill="var(--part-terminal)" />
      {[62, 92].map((y) => Array.from({ length: 16 }, (_, n) => <rect key={`${y}-${n}`} x={49 + n * 18} y={y - 15} width={13} height={22} fill="var(--part-pcb-dark)" opacity={.3} />))}
      <g opacity={.2 + Math.max(0, Math.min(100, component.properties.contrast ?? 50)) / 125}><text x={53} y={64} fill="var(--part-silkscreen)" fontSize={17} fontFamily="monospace">LCD 16x2</text><text x={53} y={94} fill="var(--part-silkscreen)" fontSize={15} fontFamily="monospace">VISUAL SAJA</text></g>
      {[14, w - 14].flatMap((x) => [18, h - 46].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r={4} fill="var(--part-metal)" />))}
    </>}
    {type === "oled" && <>
      <rect x={7} y={7} width={w - 14} height={h - 35} rx={5} fill="var(--part-pcb)" stroke="var(--part-outline)" strokeWidth={2} />
      <rect x={16} y={27} width={w - 32} height={113} fill="var(--part-chip)" stroke="var(--part-metal)" />
      <text x={w / 2} y={63} textAnchor="middle" fill="var(--part-silkscreen)" fontSize={15}>OLED</text><text x={w / 2} y={88} textAnchor="middle" fill="var(--part-silkscreen)" fontSize={12}>128 × 64</text><text x={w / 2} y={116} textAnchor="middle" fill="var(--part-silkscreen)" fontSize={9}>VISUAL SAJA</text>
    </>}
    {layout.anchors.map(({ pin, x, y }) => <g key={pin.id} data-visual-pin={pin.id}><path d={`M${x} ${y - 15}v15`} stroke="var(--part-metal)" strokeWidth={4} /><circle cx={x} cy={y} r={3} fill="var(--part-gold)" stroke="var(--part-outline)" /><text x={x} y={y - 20} textAnchor="middle" fontSize={9} fill={type === "buzzer" || type === "servo" ? "var(--foreground)" : "var(--part-silkscreen)"}>{pin.label}</text></g>)}
  </g>;
}
