import { getDefinition } from "@/features/simulator/catalog/registry";
import { visualLayout } from "@/features/simulator/ui/visuals/pin-layout";
import { BoardArtwork } from "./board-showcase";
import { heroScenes, stageAnchor, type HeroBoard } from "./hero-showcase-config";
import styles from "../homepage.module.css";

export function HeroCircuitArtwork({ type }: { type: HeroBoard }) {
  const scene = heroScenes[type];
  const layout = visualLayout(getDefinition(type));
  const pin = (id: string) => {
    const anchor = layout.anchors.find((item) => item.pin.id === id);
    if (!anchor) throw new Error(`Hero pin missing: ${type}.${id}`);
    return stageAnchor(scene.frame, layout, anchor);
  };
  const output = pin(scene.pin), ground = pin("GND"), y = scene.routeY;
  const lead = type === "uno" ? `M${output.x} ${output.y} V64 H452 V${y} H470` : `M${output.x} ${output.y} H320 V${y} H470`;
  return <svg viewBox="0 0 720 480" className={styles.circuitStageArt} aria-hidden="true" data-hero-art={type}>
    <ellipse cx="310" cy="412" rx="210" ry="15" fill="var(--part-outline)" opacity=".12" />
    <g data-hero-circuit>
      <g transform={`translate(${scene.frame.x} ${scene.frame.y})`} data-hero-board={type}>
        <svg width={scene.frame.width} height={scene.frame.height} viewBox={`0 0 ${layout.width} ${layout.height}`}><BoardArtwork type={type} /></svg>
      </g>
      <g fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d={lead} data-hero-wire data-from-pin={scene.pin} />
        <path d={`M530 ${y} H552 Q564 ${y} 564 ${y + 12} V254 Q564 266 576 266 H592`} data-hero-wire />
        <path d={`M624 266 V404 Q624 420 608 420 H${ground.x - 28} Q${ground.x - 40} 420 ${ground.x - 40} 408 V${ground.y} H${ground.x}`} data-hero-wire data-to-pin="GND" />
      </g>
      <g data-hero-resistor>
        <path d={`M470 ${y} H480 M520 ${y} H530`} stroke="var(--part-metal)" strokeWidth="4" />
        <rect x="480" y={y - 12} width="40" height="24" rx="8" fill="var(--part-resistor)" stroke="var(--part-outline)" strokeWidth="2" />
        <text x="500" y={y - 24} textAnchor="middle" className={styles.circuitLabel}>220 Ω</text>
      </g>
      <g data-hero-led>
        <path d="M592 266 V240 M624 266 V240" stroke="var(--part-metal)" strokeWidth="4" />
        <path d="M584 236 V218 A24 24 0 0 1 632 218 V236 Z" fill="var(--part-led-off)" stroke="var(--part-outline)" strokeWidth="2" data-hero-lens />
        <path d="M590 214 Q590 204 599 202" fill="none" stroke="var(--part-metal)" strokeWidth="3" opacity=".6" />
        <path d="M580 237 H636" stroke="var(--part-outline)" strokeWidth="5" />
        <text x="608" y="300" textAnchor="middle" className={styles.circuitLabel}>LED / A · K</text>
      </g>
      <g data-hero-pin>
        <circle cx={output.x} cy={output.y} r="8" fill="var(--primary-soft)" stroke="var(--primary)" strokeWidth="2" />
        <text x={type === "uno" ? output.x - 14 : output.x + 16} y={output.y - 14} className={styles.circuitLabel}>{scene.pin}</text>
        <circle cx={ground.x} cy={ground.y} r="6" fill="var(--surface)" stroke="var(--primary)" strokeWidth="2" />
        <text x={ground.x + 14} y={ground.y + 20} className={styles.circuitLabel}>GND</text>
      </g>
    </g>
  </svg>;
}
