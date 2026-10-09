"use client";
import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import styles from "../public-pages.module.css";

export function PublicMotion({ route, children, className = "" }: { route: string; children: ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP((_context, safe) => {
    if (!root.current || !safe) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;
    const element = root.current;
    const initialize = safe(async () => {
      try {
        const { animatePublic } = await import("./public-timelines");
        if (!disposed) cleanup = animatePublic(element, route);
      } catch {
        element.dataset.motionReady = "fallback";
      }
    });
    void initialize();
    return () => { disposed = true; cleanup?.(); };
  }, { scope: root, dependencies: [route], revertOnUpdate: true });
  return <div ref={root} data-public-route={route} className={`${styles.page} ${className}`}>{children}</div>;
}
