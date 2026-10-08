import type { VisualLayout } from "./pin-layout";

export function BoardVisual({ type, layout }: { type: string; layout: VisualLayout }) {
  const esp = type === "esp32", nano = type === "nano";
  const { width: w, height: h } = layout;
  return <>
    {type === "uno" ? <>
      <path d={`M28 8H${w - 52}L${w - 8} 48V${h - 48}L${w - 52} ${h - 8}H28Z`} fill="var(--part-pcb)" stroke="var(--part-outline)" strokeWidth={2} />
      {[{ x: 62, y: 58 }, { x: w - 62, y: 58 }, { x: 62, y: h - 60 }, { x: w - 62, y: h - 60 }].map((p, i) => <circle key={i} {...{ cx: p.x, cy: p.y }} r={11} fill="var(--part-metal)" stroke="var(--part-outline)" strokeWidth={3} />)}
      <rect x={0} y={104} width={98} height={104} rx={5} fill="var(--part-metal)" stroke="var(--part-outline)" strokeWidth={3} />
      <path d="M0 126H32L44 140V176L32 188H0Z" fill="var(--part-chip)" />
      <rect x={0} y={340} width={98} height={72} rx={8} fill="var(--part-chip)" />
      <circle cx={24} cy={376} r={20} fill="var(--part-outline)" stroke="var(--part-metal)" strokeWidth={4} />
      <rect x={90} y={68} width={36} height={30} rx={3} fill="var(--part-metal)" />
      <rect x={98} y={72} width={20} height={20} fill="var(--part-chip)" />
      <text x={140} y={87} fill="var(--part-silkscreen)" fontSize={12}>RESET</text>
      <rect x={150} y={137} width={50} height={50} fill="var(--part-chip)" />
      <rect x={304} y={310} width={270} height={72} rx={5} fill="var(--part-chip)" stroke="var(--part-outline)" />
      {Array.from({ length: 14 }, (_, i) => <path key={i} d={`M${315 + i * 19} 298v12m0 72v12`} stroke="var(--part-metal)" strokeWidth={8} />)}
      <text x={439} y={353} textAnchor="middle" fill="var(--part-silkscreen)" fontSize={17}>ATmega328P</text>
      <text x={365} y={176} textAnchor="middle" fill="var(--part-silkscreen)" fontSize={38} fontWeight={600}>UNO R3</text>
      <text x={365} y={200} textAnchor="middle" fill="var(--part-silkscreen)" fontSize={12}>VIRCUIT · PIN SIMULASI</text>
      {[158, 216].map((x) => <g key={x}><circle cx={x} cy={392} r={20} fill="var(--part-metal)" stroke="var(--part-outline)" strokeWidth={3} /><path d={`M${x - 10} 392h20`} stroke="var(--part-outline)" strokeWidth={2} /></g>)}
      <rect x={180} y={276} width={46} height={18} rx={8} fill="var(--part-metal)" stroke="var(--part-outline)" />
      <text x={504} y={443} fill="var(--part-silkscreen)" fontSize={13}>ANALOG IN</text>
      <text x={273} y={443} fill="var(--part-silkscreen)" fontSize={13}>POWER</text>
      <text x={390} y={66} fill="var(--part-silkscreen)" fontSize={13}>DIGITAL</text>
    </> : <>
      <rect x={8} y={8} width={w - 16} height={h - 16} rx={9} fill={esp ? "var(--part-pcb-dark)" : "var(--part-pcb)"} stroke="var(--part-outline)" strokeWidth={2} />
      <rect x={17} y={36} width={14} height={h - 104} fill="var(--part-chip)" />
      <rect x={w - 31} y={36} width={14} height={h - 104} fill="var(--part-chip)" />
      {esp ? <>
        <rect x={65} y={16} width={134} height={230} rx={4} fill="var(--part-metal)" stroke="var(--part-outline)" strokeWidth={2} />
        <rect x={67} y={18} width={130} height={56} fill="var(--part-chip)" />
        <path d="M78 62V30h18v32h18V30h18v32h18V30h18v32h17" stroke="var(--part-gold)" fill="none" strokeWidth={3} />
        <text x={w / 2} y={130} textAnchor="middle" fill="var(--part-chip)" fontSize={19}>ESP32</text>
        <text x={w / 2} y={154} textAnchor="middle" fill="var(--part-chip)" fontSize={11}>WROOM · V4</text>
        <rect x={104} y={318} width={56} height={56} rx={3} fill="var(--part-chip)" />
        {[76, 188].map((x) => <g key={x}><rect x={x - 10} y={460} width={20} height={24} fill="var(--part-metal)" /><circle cx={x} cy={472} r={6} fill="var(--part-chip)" /></g>)}
        <text x={w / 2} y={426} textAnchor="middle" fill="var(--part-silkscreen)" fontSize={10}>PIN SIMULASI</text>
      </> : <>
        <rect x={56} y={130} width={56} height={56} transform="rotate(45 84 158)" fill="var(--part-chip)" stroke="var(--part-metal)" strokeWidth={3} />
        <text x={w / 2} y={240} textAnchor="middle" fill="var(--part-silkscreen)" fontSize={20}>NANO</text>
        <text x={w / 2} y={258} textAnchor="middle" fill="var(--part-silkscreen)" fontSize={9}>VISUAL SAJA</text>
        <rect x={68} y={292} width={32} height={28} fill="var(--part-metal)" /><circle cx={84} cy={306} r={8} fill="var(--part-chip)" />
        <rect x={62} y={353} width={44} height={20} rx={6} fill="var(--part-metal)" />
      </>}
      <rect x={w / 2 - 28} y={h - 64} width={56} height={60} rx={4} fill="var(--part-metal)" stroke="var(--part-outline)" strokeWidth={2} />
      <rect x={w / 2 - 18} y={h - 34} width={36} height={18} rx={3} fill="var(--part-chip)" />
      <text x={w / 2} y={h - 77} textAnchor="middle" fill="var(--part-silkscreen)" fontSize={10}>{nano ? "MINI USB" : "MICRO USB"}</text>
    </>}
    {layout.anchors.map(({ pin, x, y, side }) => <g key={pin.id} data-visual-pin={pin.id}>
      <rect x={x - 9} y={y - 9} width={18} height={18} rx={2} fill="var(--part-chip)" stroke="var(--part-metal)" />
      <rect x={x - 3} y={y - 3} width={6} height={6} fill="var(--part-gold)" />
      <text x={x + (side === "left" ? 15 : side === "right" ? -15 : 0)} y={y + (side === "top" ? 24 : side === "bottom" ? -17 : 4)} textAnchor={side === "left" ? "start" : side === "right" ? "end" : "middle"} fill="var(--part-silkscreen)" fontSize={nano ? 10 : 11}>{pin.label.replace("GPIO", "")}</text>
    </g>)}
  </>;
}
