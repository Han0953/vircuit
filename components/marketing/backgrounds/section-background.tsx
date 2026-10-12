import { backgroundTreatment, type BackgroundScene } from "./background-scenes";
import styles from "./backgrounds.module.css";

const paths = {
  traces: ["M0 96H220L268 144H400", "M1200 460H1010L950 400H810V330", "M0 540H120L200 460H320", "M1200 80H1030L970 140H880"],
  blueprint: ["M40 80H330V140H460", "M1160 520H920V450H780", "M940 40V120H1080V240", "M80 400H160V560"],
  journey: ["M0 480H120L200 400V280L280 200H440", "M1200 100H1100L1020 180V340L940 420H800", "M500 560H660L720 500V440"],
  diagnostics: ["M0 140H160L190 110L220 170L250 140H400", "M1200 400H1060L1030 370L1000 430L970 400H800", "M80 540H360M840 60H1120"],
  tiles: ["M0 100H240V200H360", "M1200 520H960V420H840", "M1040 60H1140V160H1040Z", "M60 460H160V560H60Z"],
  spotlight: [],
} as const;

// Server-rendered, complete static artwork before JS. Each motif stays at the edges;
// there is deliberately no overlay over the foreground hardware/illustrations.
export function SectionBackground({ scene }: { scene: BackgroundScene }) {
  const { tone, motif, motion, owner } = backgroundTreatment(scene);
  return <div className={styles.backdrop} data-marketing-background={scene} data-bg-tone={tone} data-bg-motif={motif} data-bg-motion={owner ?? (motion ? "scroll" : "static")} aria-hidden="true">
    <div className={styles.base} />
    <div className={styles.atmosphere} data-bg-drift />
    <div className={styles.pattern} />
    {paths[motif].length > 0 && <svg className={styles.routes} viewBox="0 0 1200 600" preserveAspectRatio="none" fill="none" focusable="false">
      <g className={styles.underlay}>{paths[motif].map((d) => <path key={d} d={d} />)}</g>
      <g className={styles.signals}>{paths[motif].map((d) => <path data-bg-path pathLength="1" key={d} d={d} />)}</g>
      <g className={styles.nodes} data-bg-nodes><circle cx="160" cy="140" r="4" /><circle cx="1040" cy="400" r="4" /><circle cx="280" cy="200" r="3" /><circle cx="940" cy="420" r="3" /></g>
    </svg>}
    <div className={styles.scan} data-bg-sweep />
  </div>;
}
