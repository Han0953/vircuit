import styles from "../homepage.module.css";

export function CircuitArtwork() {
  return <svg className={styles.artwork + " component-art"} viewBox="0 0 600 360" fill="none" aria-hidden="true">
    <g data-part="board">
      <path d="M64 64H278L306 92V278L278 302H64Z" fill="var(--part-pcb)" stroke="var(--part-outline)" strokeWidth="2" />
      <path d="M85 107H115V230H255M108 273h65v-55m29-76v-38h58" stroke="var(--part-silkscreen)" opacity=".22" strokeWidth="2" />
      {[80, 284].flatMap((x) => [80, 284].map((y) => <circle key={x + "-" + y} cx={x} cy={y} r="7" fill="var(--part-metal)" stroke="var(--part-outline)" strokeWidth="3" />))}
      <rect x="42" y="108" width="54" height="62" rx="4" fill="var(--part-metal)" stroke="var(--part-outline)" strokeWidth="2" />
      <path d="M42 121h20l9 10v21H42Z" fill="var(--part-chip)" />
      <rect x="48" y="230" width="47" height="34" rx="5" fill="var(--part-chip)" />
      <rect x="117" y="128" width="58" height="60" rx="3" fill="var(--part-chip)" />
      <rect x="153" y="218" width="116" height="36" rx="3" fill="var(--part-chip)" />
      {Array.from({ length: 8 }, (_, i) => <g key={i} fill="var(--part-metal)">
        <rect x={161 + i * 13} y="212" width="5" height="6" /><rect x={161 + i * 13} y="254" width="5" height="6" />
        <rect x={111 + i * 20} y="74" width="13" height="13" rx="2" fill="var(--part-chip)" />
        <rect x={111 + i * 20} y="278" width="13" height="13" rx="2" fill="var(--part-chip)" />
      </g>)}
      <g fill="var(--part-silkscreen)" fontFamily="var(--font-code)"><text x="197" y="162" fontSize="23" fontWeight="bold">UNO</text><text x="195" y="180" fontSize="9">DIGITAL LAB</text><text x="275" y="122" fontSize="10">D3</text><text x="263" y="265" fontSize="10">GND</text></g>
      <rect x="116" y="101" width="25" height="12" rx="5" fill="var(--part-metal)" />
      <circle cx="203" cy="107" r="4" fill="var(--iot)" />
    </g>
    <g strokeWidth="3" strokeLinejoin="round">
      <path data-wire d="M304 132H360V112H390" stroke="var(--primary)" />
      <path data-wire d="M450 112H516V173" stroke="var(--primary)" />
      <path data-wire d="M535 173V266H306" stroke="var(--text-secondary)" />
    </g>
    <g data-part="resistor">
      <rect x="390" y="101" width="60" height="22" rx="7" fill="var(--part-resistor)" stroke="var(--part-outline)" strokeWidth="2" />
      <text x="420" y="88" textAnchor="middle" fill="var(--text-secondary)" fontFamily="var(--font-code)" fontSize="11">220 Ω</text>
    </g>
    <g data-part="led">
      <circle data-led-halo cx="525" cy="145" r="34" fill="var(--primary-soft)" />
      <path d="M509 159v-22a16 16 0 0 1 32 0v22Z" fill="var(--iot)" stroke="var(--part-outline)" strokeWidth="2" />
      <path d="M505 159h40m-29 0v14m19-14v14" stroke="var(--part-metal)" strokeWidth="3" />
      <path d="M517 137v-3a8 8 0 0 1 8-8" stroke="var(--surface)" strokeWidth="2" />
      <text x="525" y="204" textAnchor="middle" fill="var(--text-secondary)" fontFamily="var(--font-code)" fontSize="11">LED / OUTPUT</text>
    </g>
    <g fill="var(--surface)" stroke="var(--primary)" strokeWidth="2"><circle cx="304" cy="132" r="4" /><circle cx="306" cy="266" r="4" /></g>
  </svg>;
}
