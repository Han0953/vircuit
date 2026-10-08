import type { ComponentInstance } from "../../types/project";
import type { VisualLayout } from "./pin-layout";

export function PeripheralVisual({ component, layout, output, temperature, humidity }: { component: ComponentInstance; layout: VisualLayout; output: number; temperature?: number; humidity?: number }) {
  return <>
    {component.type === "dht22" && <>
      <path d="M12 134V156M36 134V156M84 134V156" stroke="var(--part-metal)" strokeWidth={5} />
      <rect x={4} y={4} width={88} height={134} rx={8} fill="var(--part-breadboard)" stroke="var(--part-metal)" strokeWidth={2} />
      {Array.from({ length: 7 }, (_, i) => <path key={i} d={`M14 ${16 + i * 11}H82`} stroke="var(--part-groove)" strokeWidth={5} />)}
      <text x={48} y={104} textAnchor="middle" fill="var(--part-outline)" fontSize={12}>DHT22</text>
      <text x={48} y={123} textAnchor="middle" fill="var(--part-outline)" fontSize={10}>{temperature ?? 25} °C · {humidity ?? 50}%</text>
    </>}
    {component.type === "relay" && <>
      <rect x={5} y={5} width={158} height={206} rx={5} fill="var(--part-pcb)" stroke="var(--part-outline)" strokeWidth={2} />
      <rect x={24} y={49} width={120} height={100} rx={5} fill="var(--part-relay)" stroke="var(--part-outline)" strokeWidth={2} />
      <text x={84} y={82} textAnchor="middle" fill="var(--part-silkscreen)" fontSize={15}>RELAY</text>
      <text x={84} y={103} textAnchor="middle" fill="var(--part-silkscreen)" fontSize={10}>SIMULASI EDUKATIF</text>
      <circle cx={38} cy={132} r={5} fill={output > 0 ? "var(--success)" : "var(--part-led-off)"} />
      <path d={output > 0 ? "M74 134L105 119" : "M74 134L105 142"} stroke="var(--part-silkscreen)" strokeWidth={2} />
      <rect x={24} y={165} width={120} height={32} rx={3} fill="var(--part-terminal)" stroke="var(--part-outline)" />
      {[36, 84, 132].map((x) => <g key={x}><circle cx={x} cy={181} r={8} fill="var(--part-metal)" /><path d={`M${x - 5} 181h10`} stroke="var(--part-outline)" strokeWidth={2} /></g>)}
    </>}
    {component.type === "fan" && <>
      <path d="M60 145V180" stroke="var(--part-positive)" strokeWidth={4} /><path d="M132 145V180" stroke="var(--part-negative)" strokeWidth={4} />
      <rect x={8} y={8} width={176} height={152} rx={10} fill="var(--part-chip)" stroke="var(--part-outline)" strokeWidth={3} />
      {[22, 170].flatMap((x) => [22, 146].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r={5} fill="var(--part-metal)" />))}
      <circle cx={96} cy={83} r={66} fill="var(--part-outline)" stroke="var(--part-metal)" strokeWidth={2} />
      {Array.from({ length: 5 }, (_, i) => <path key={i} d="M96 83Q120 23 144 52Q157 71 113 98Z" transform={`rotate(${i * 72} 96 83)`} fill="var(--part-chip)" stroke="var(--part-metal)" strokeWidth={1} />)}
      <circle cx={96} cy={83} r={25} fill="var(--part-chip)" stroke={output > 0 ? "var(--success)" : "var(--part-metal)"} strokeWidth={3} />
      <text x={96} y={87} textAnchor="middle" fill="var(--part-silkscreen)" fontSize={11}>{Math.round(output * 100)}%</text>
    </>}
    {layout.anchors.map(({ pin, x, y, side }) => <g key={pin.id} data-visual-pin={pin.id}>
      <circle cx={x} cy={y} r={4} fill="var(--part-metal)" stroke="var(--part-outline)" />
      <text x={x} y={side === "top" ? y + 19 : y - 11} textAnchor="middle" fill={component.type === "dht22" || component.type === "fan" ? "var(--foreground)" : "var(--part-silkscreen)"} fontSize={component.type === "dht22" ? 8 : 9}>{pin.label}</text>
    </g>)}
  </>;
}
