"use client";

import { useContext, useRef, type ReactNode } from "react";
import { StoryContext } from "./story-context";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import styles from "../homepage.module.css";
import { requestSceneRefresh } from "./scene-refresh";

export type SceneKind = "hero" | "story" | "simulator" | "cirra" | "challenge" | "closing" | "catalog";

export function MotionScene({ kind, children }: { kind: SceneKind; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const channel = useContext(StoryContext);
  useGSAP((_context, contextSafe) => {
    const root = ref.current;
    if (!root || !contextSafe) return;
    // HeroShowcase owns the intro and playback together, without a lazy-import gap.
    if (kind === "hero") {
      root.dataset.motion = kind;
      return () => { root.removeAttribute("data-motion"); };
    }
    gsap.registerPlugin(ScrollTrigger, useGSAP);
    const media = gsap.matchMedia();
    let disposed = false;
    let observer: IntersectionObserver | undefined;
    let initialized = false;
    let setupFrame = 0;
    let setupTask = 0;
    let cancelRefresh: (() => void) | undefined;
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
          if (!disposed) cancelRefresh = requestSceneRefresh();
        });
      } catch {
        media.revert();
        root.removeAttribute("data-motion");
      }
    });
    const schedule = () => {
      if (initialized || setupFrame || setupTask) return;
      setupFrame = requestAnimationFrame(() => {
        setupFrame = 0;
        setupTask = window.setTimeout(() => { setupTask = 0; void initialize(); }, 0);
      });
    };
    if (kind === "story") schedule();
    else {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) { observer?.disconnect(); schedule(); }
      }, { rootMargin: "400px" });
      observer.observe(root);
    }
    return () => {
      disposed = true;
      observer?.disconnect();
      cancelAnimationFrame(setupFrame); clearTimeout(setupTask);
      cancelRefresh?.();
      media.revert();
      root.removeAttribute("data-motion");
    };
  }, { scope: ref, dependencies: [kind], revertOnUpdate: true });
  return <div ref={ref} className={styles.scene} data-scene={kind}>{children}</div>;
}
