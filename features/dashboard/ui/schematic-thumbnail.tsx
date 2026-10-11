import { cn } from "@/lib/utils";

interface SchematicThumbnailProps {
  title?: string;
  className?: string;
}

/**
 * Lightweight procedural SVG schematic blueprint preview.
 * Renders an educational circuit diagram without loading the full simulation engine.
 */
export function SchematicThumbnail({ title = "Proyek Sirkuit", className }: SchematicThumbnailProps) {
  // Simple deterministic seed based on project title
  const seed = title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const isAltLayout = seed % 2 === 1;

  return (
    <div
      className={cn(
        "relative flex h-28 w-full items-center justify-center overflow-hidden rounded-md border border-border/60 bg-surface-muted/60 p-2 select-none",
        className
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 240 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full text-primary"
      >
        {/* Background circuit grid */}
        <defs>
          <pattern id={`schematic-grid-${seed}`} width="12" height="12" patternUnits="userSpaceOnUse">
            <path d="M 12 0 L 0 0 0 12" fill="none" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.08" />
          </pattern>
        </defs>
        <rect width="240" height="100" fill={`url(#schematic-grid-${seed})`} />

        {/* MCU Chip outline */}
        <rect
          x="20"
          y="25"
          width="50"
          height="50"
          rx="4"
          className="fill-surface stroke-primary/50"
          strokeWidth="1.5"
        />
        {/* Microcontroller core mark */}
        <rect x="30" y="35" width="30" height="30" rx="2" className="fill-primary/10 stroke-primary/30" strokeWidth="1" />
        <circle cx="45" cy="50" r="3" className="fill-primary/60" />

        {/* IC Pins */}
        <path d="M12 35h8 M12 45h8 M12 55h8 M12 65h8" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.5" />
        <path d="M70 35h8 M70 45h8 M70 55h8 M70 65h8" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.5" />

        {/* Circuit Traces */}
        {isAltLayout ? (
          <>
            {/* Trace 1 to Resistor & LED */}
            <path d="M78 45h30l12-15h40" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.6" strokeLinecap="round" />
            {/* Resistor symbol */}
            <path d="M160 30l3-5 6 10 6-10 6 10 3-5h12" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.8" strokeLinejoin="round" />
            {/* LED symbol */}
            <circle cx="206" cy="30" r="8" className="fill-surface stroke-primary" strokeWidth="1.5" />
            <path d="M202 26l8 8 M210 26l-8 8" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.7" />
            {/* Ground trace */}
            <path d="M214 30h14v35H78" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" strokeDasharray="3 3" />
          </>
        ) : (
          <>
            {/* Direct digital trace */}
            <path d="M78 35h45l15 15h40" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.6" strokeLinecap="round" />
            {/* Capacitor / Resistor node */}
            <rect x="178" y="44" width="16" height="12" rx="2" className="fill-surface stroke-primary/70" strokeWidth="1.2" />
            {/* Output terminal */}
            <circle cx="210" cy="50" r="6" className="fill-primary/20 stroke-primary" strokeWidth="1.5" />
            <circle cx="210" cy="50" r="2" className="fill-primary" />
            {/* Secondary bypass track */}
            <path d="M78 65h60l10-8h45" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.35" strokeLinecap="round" />
          </>
        )}
      </svg>
      <div className="absolute right-2 bottom-1.5 flex items-center gap-1 rounded bg-surface/90 px-1.5 py-0.5 text-[9px] font-mono font-medium text-text-tertiary backdrop-blur-xs">
        <span className="size-1 rounded-full bg-primary" />
        SCHEMATIC
      </div>
    </div>
  );
}
