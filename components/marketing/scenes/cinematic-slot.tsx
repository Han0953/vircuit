import type { ReactNode } from "react";
import type { CinematicZone } from "./homepage-cinematic-config";
import styles from "../homepage.module.css";

/** SSR / unavailable-WebGL artwork; a neutral pending state avoids a 2D-to-3D model swap. */
export function CinematicSlot({ zone, children, className = "" }: { zone: CinematicZone; children: ReactNode; className?: string }) {
  return <div className={`${styles.cinematicSlot} component-art ${className}`} data-cinematic-slot={zone} data-renderer="svg" aria-hidden="true">
    <div className={styles.worldPending}>Menyiapkan visual 3D</div>
    <div className={styles.cinematicFallback} data-cinematic-fallback>{children}</div>
  </div>;
}
