import type { VisualLayout } from "./pin-layout";
export function BreadboardVisual({ layout }: { layout: VisualLayout }) {
  const rows = layout.anchors.filter((a) => /^A\d/.test(a.pin.id));
  const rails = layout.anchors.filter((a) => /^[LR][+-]1$/.test(a.pin.id));
  const offset = rows[0].x;
  const holePath = layout.anchors.map((a) => `M${a.x - 3} ${a.y - 3}h6v6h-6Z`).join("");
  return <>
    <rect x="2" y="2" width={layout.width - 4} height={layout.height - 4} rx="12" fill="var(--part-breadboard)" stroke="var(--part-metal)" strokeWidth="2" />
    <rect x={offset + 110} y="10" width="44" height={layout.height - 20} rx="5" fill="var(--part-groove)" />
    {rows.map(({ y, pin }, index) => <g key={pin.id}>
      <path d={`M${offset - 7} ${y}h110m58 0h110`} stroke="var(--part-strip)" strokeWidth="15" strokeLinecap="round" />
      <text x={offset + 132} y={y + 4} textAnchor="middle" fontSize="10" fill="var(--part-outline)">{index + 1}</text>
    </g>)}
    {layout.anchors.filter((a) => /^[A-J]1$/.test(a.pin.id)).map(({ pin, x }) => <text key={pin.id} x={x} y="24" textAnchor="middle" fill="var(--part-outline)" fontSize="11">{pin.id[0]}</text>)}
    {rails.map(({ pin, x }) => <g key={pin.id}><path d={`M${x} 30V${layout.height - 16}`} stroke={pin.id[1] === "+" ? "var(--part-positive)" : "var(--part-negative)"} strokeWidth="16" opacity=".18" /><text x={x} y="23" textAnchor="middle" fill="var(--part-outline)" fontSize="16">{pin.id[1]}</text></g>)}
    <path d={holePath} fill="var(--part-chip)" />
  </>;
}
