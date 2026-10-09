"use client";

import { useContext, useRef, type ReactNode } from "react";
import { StoryContext } from "./story-context";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import styles from "../homepage.module.css";

export type SceneKind = "hero" | "story" | "simulator" | "cirra" | "challenge" | "closing" | "catalog";

export function MotionScene({ kind, children }: { kind: SceneKind; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const channel = useContext(StoryContext);
  useGSAP((_context, contextSafe) => {
    const root = ref.current;
    if (!root || !contextSafe) return;
    gsap.registerPlugin(ScrollTrigger, useGSAP);
    const media = gsap.matchMedia();
    let disposed = false;
    let observer: IntersectionObserver | undefined;
    let initialized = false;
    let refreshFrame = 0;
    const refresh = () => {
      if (disposed) return;
      if (document.documentElement.hasAttribute("data-home-moving")) {
        window.addEventListener("home-scroll-settled", refresh, { once: true });
      } else refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
    };
    const initialize = contextSafe(async () => {
      if (initialized) return;
      initialized = true;
      try {
        const { animateScene } = await import("./scene-timelines");
        if (disposed) return;
        media.add({ all: "(min-width: 0px)", desktop: "(min-width: 1024px)", tall: "(min-height: 620px)", fine: "(hover: hover) and (pointer: fine)", reduce: "(prefers-reduced-motion: reduce)" }, (match) => {
          if (match.conditions?.reduce) { channel?.publish(1); return; }
          return animateScene(kind, root, match.conditions ?? {}, channel);
        }, root);
        void document.fonts.ready.then(() => {
          refresh();
        });
      } catch {
        media.revert();
        root.removeAttribute("data-motion");
      }
    });
    if (kind === "hero" || kind === "story") void initialize();
    else {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) { observer?.disconnect(); void initialize(); }
      }, { rootMargin: "400px" });
      observer.observe(root);
    }
    return () => {
      disposed = true;
      observer?.disconnect();
      cancelAnimationFrame(refreshFrame);
      window.removeEventListener("home-scroll-settled", refresh);
      media.revert();
      root.removeAttribute("data-motion");
    };
  }, { scope: ref, dependencies: [kind], revertOnUpdate: true });
  return <div ref={ref} className={styles.scene} data-scene={kind}>{children}</div>;
}
