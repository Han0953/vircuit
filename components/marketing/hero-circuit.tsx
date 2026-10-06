export function HeroCircuit() {
  return (
    <figure className="min-w-0" aria-label="Ilustrasi board, resistor, dan LED yang terhubung oleh kabel">
      <div className="flex items-center justify-between gap-4 border-b pb-4 font-mono text-xs text-text-secondary">
        <span>VIRTUAL LAB / 001</span>
        <span>Ilustrasi rangkaian</span>
      </div>

      <svg viewBox="0 0 600 480" className="h-auto w-full" aria-hidden="true" fill="none">
        <g stroke="var(--border)" strokeWidth="1">
          <path d="M24 72V24h48M528 24h48v48M24 408v48h48M528 456h48v-48" />
          <path d="M40 420h520M52 412v16M548 412v16" />
        </g>
        <g className="font-mono" fontSize="12" fill="var(--text-secondary)">
          <text x="52" y="448">01 / BOARD</text>
          <text x="284" y="448">02 / WIRING</text>
          <text x="468" y="448">03 / OUTPUT</text>
        </g>

        <rect x="52" y="62" width="270" height="40" rx="6" fill="var(--surface)" stroke="var(--border)" />
        <text x="68" y="87" className="font-mono" fontSize="13" fill="var(--text-secondary)">
          digitalWrite(<tspan fill="var(--primary)">LED, HIGH</tspan>);
        </text>

        <circle cx="528" cy="260" r="46" fill="var(--primary-soft)" />

        <path d="M260 188h78l28-28h64" stroke="var(--primary)" strokeWidth="3" strokeLinejoin="round" />
        <path d="M478 160h14v146h27v-12" stroke="var(--primary)" strokeWidth="3" strokeLinejoin="round" />
        <path d="M537 294v50H302l-22-22h-20" stroke="var(--text-secondary)" strokeWidth="3" strokeLinejoin="round" />

        <g stroke="var(--border-strong)" strokeWidth="2">
          <rect x="64" y="126" width="196" height="248" rx="14" fill="var(--surface)" />
          <rect x="82" y="144" width="160" height="212" rx="6" fill="var(--surface-muted)" />
          <rect x="130" y="118" width="64" height="36" rx="6" fill="var(--surface-elevated)" />
        </g>

        <g fill="var(--surface-elevated)" stroke="var(--border-strong)">
          {Array.from({ length: 10 }, (_, index) => (
            <g key={index}>
              <rect x="56" y={170 + index * 16} width="16" height="7" rx="2" />
              <rect x="252" y={170 + index * 16} width="16" height="7" rx="2" />
            </g>
          ))}
        </g>

        <g stroke="var(--border-strong)">
          <path d="M106 206h18m-18 14h18m-18 14h18m-18 14h18m76-42h18m-18 14h18m-18 14h18m-18 14h18M140 180v12m16-12v12m16-12v12m16-12v12M140 268v12m16-12v12m16-12v12m16-12v12" strokeWidth="3" />
          <rect x="124" y="192" width="76" height="76" rx="4" fill="var(--surface-elevated)" />
        </g>
        <text x="162" y="236" textAnchor="middle" className="font-mono" fontSize="16" fill="var(--text-primary)">MCU</text>
        <g fill="var(--text-secondary)" className="font-mono" fontSize="11">
          <text x="96" y="308">VIRCUIT</text>
          <text x="96" y="324">VIRTUAL BOARD</text>
          <text x="282" y="180">OUT</text>
          <text x="282" y="368">GND</text>
        </g>
        <circle cx="96" cy="338" r="3" fill="var(--primary)" />
        <g fill="var(--surface)" stroke="var(--border-strong)">
          <circle cx="76" cy="138" r="3" /><circle cx="248" cy="138" r="3" />
          <circle cx="76" cy="362" r="3" /><circle cx="248" cy="362" r="3" />
        </g>

        <rect x="430" y="149" width="48" height="22" rx="5" fill="var(--surface-elevated)" stroke="var(--primary)" strokeWidth="2" />
        <path d="M442 150v20m12-20v20m12-20v20" stroke="var(--primary)" strokeWidth="3" />
        <text x="454" y="132" textAnchor="middle" className="font-mono" fontSize="12" fill="var(--text-secondary)">RESISTOR</text>

        <path d="M506 275v-25a22 22 0 0 1 44 0v25Z" fill="var(--primary-soft)" stroke="var(--primary)" strokeWidth="2" />
        <path d="M502 276h52M519 276v18m18-18v18" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" />
        <path d="M517 252v-4a11 11 0 0 1 11-11" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" />
        <text x="528" y="320" textAnchor="middle" className="font-mono" fontSize="12" fill="var(--text-secondary)">LED</text>
        <g fill="var(--surface)" stroke="var(--primary)" strokeWidth="2">
          <circle cx="264" cy="188" r="4" /><circle cx="264" cy="322" r="4" />
        </g>
      </svg>
      <figcaption className="flex items-start gap-3 border-t pt-4 text-sm leading-relaxed text-text-secondary">
        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
        Dari baris kode ke respons rangkaian. Pahami hubungan keduanya.
      </figcaption>
    </figure>
  );
}
