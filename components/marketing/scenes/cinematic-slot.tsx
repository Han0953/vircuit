import type { ReactNode } from "react";
import type { CinematicZone } from "./homepage-cinematic-config";
import styles from "../homepage.module.css";

/** SSR / unavailable-WebGL artwork; the live renderer is warmed before stage entry. */
export function CinematicSlot({ zone, children, className = "" }: { zone: CinematicZone; children: ReactNode; className?: string }) {
  return <div className={`${styles.cinematicSlot} component-art ${className}`} data-cinematic-slot={zone} data-renderer="svg" aria-hidden="true">
    <div className={styles.cinematicFallback} data-cinematic-fallback>{children}</div>
  </div>;
}
