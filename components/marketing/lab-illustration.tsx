/**
 * Pure SVG vector illustration depicting a simplified Virtual Lab workspace (MCU board, breadboard, LED, resistor).
 *
 * Implements DESIGN.md Section 26:
 * - Uses SVG vector shapes rather than raster images for sharp rendering across high-DPI viewports
 * - Uses theme CSS variables (var(--surface), var(--primary), var(--border)) to adapt automatically
 *   between Light (off-white) and Dark (pure black) modes without raster color inversions
 */
export function LabIllustration() {
  return (
    <svg viewBox="0 0 560 340" fill="none" className="h-auto w-full" aria-hidden="true">
      {/* Outer corner alignment markers */}
      <g stroke="var(--border)">
        <path d="M24 56V24h32M504 24h32v32M24 284v32h32M504 316h32v-32" />
        <path d="M40 300h480" />
      </g>

      {/* Virtual Microcontroller Board Outline */}
      <rect x="64" y="72" width="176" height="196" rx="14" fill="var(--surface-muted)" stroke="var(--border-strong)" strokeWidth="2" />
      <rect x="120" y="60" width="64" height="32" rx="6" fill="var(--surface-elevated)" stroke="var(--border-strong)" />
      <rect x="116" y="130" width="72" height="72" rx="6" fill="var(--surface)" stroke="var(--primary)" />

      {/* IC Pin traces */}
      <g stroke="var(--border-strong)" strokeWidth="4">
        <path d="M104 140h12m-12 16h12m-12 16h12m-12 16h12m72-48h12m-12 16h12m-12 16h12m-12 16h12" />
      </g>

      {/* Header pin sockets */}
      {Array.from({ length: 8 }, (_, i) => (
        <g key={i} fill="var(--surface-elevated)" stroke="var(--border-strong)">
          <rect x="56" y={106 + i * 18} width="16" height="8" rx="2" />
          <rect x="232" y={106 + i * 18} width="16" height="8" rx="2" />
        </g>
      ))}

      {/* Breadboard component body */}
      <rect x="326" y="112" width="176" height="156" rx="10" fill="var(--surface-elevated)" stroke="var(--border-strong)" />
      <path d="M338 190h152" stroke="var(--border)" strokeWidth="8" />

      {/* Breadboard contact hole grid */}
      {Array.from({ length: 8 }, (_, column) => (
        <g key={column} fill="var(--border-strong)">
          {[134, 150, 166, 214, 230, 246].map((y) => <circle key={y} cx={344 + column * 20} cy={y} r="3" />)}
        </g>
      ))}

      {/* Jumper wires connecting board pins to breadboard rails */}
      <path d="M248 128h32l24 22h40" stroke="var(--primary)" strokeWidth="3" />
      <path d="M248 236h40l24-22h92" stroke="var(--text-secondary)" strokeWidth="3" />
      <path d="M344 150h20m36 0h24v-50m20 0v114h-40" stroke="var(--primary)" strokeWidth="2" />

      {/* Inline resistor symbol */}
      <rect x="364" y="142" width="36" height="16" rx="4" fill="var(--primary-soft)" stroke="var(--primary)" />
      <path d="M373 142v16m9-16v16m9-16v16" stroke="var(--primary)" />

      {/* LED output indicator */}
      <path d="M414 88V70a20 20 0 0 1 40 0v18Zm-4 0h48m-34 0v12m20-12v12" fill="var(--primary-soft)" stroke="var(--primary)" strokeWidth="2" />

      {/* Technical annotation labels */}
      <g fill="var(--text-secondary)" className="font-mono" fontSize="13" textAnchor="middle">
        <text x="152" y="171" fill="var(--text-primary)">MCU</text>
        <text x="152" y="240">BOARD</text>
        <text x="414" y="292">BREADBOARD + LED</text>
      </g>
    </svg>
  );
}
