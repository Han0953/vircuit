"use client";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/features/settings/preferences";
import { doorOpenDuration } from "./transition-contract";
import { loginScreenHalf } from "./login-screen";

gsap.registerPlugin(useGSAP);
export default function DoorOverlay({ screen, phase, onCancelled, onFinished }: { screen: HTMLElement | null; phase: "authenticating" | "waiting" | "opening" | "cancelling"; onCancelled: () => void; onFinished: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useGSAP(() => {
    if (!screen || reduced) { onFinished(); return; }
    const copies: HTMLElement[] = [];
    const panels = root.current?.querySelectorAll("[data-door-panel]");
    panels?.forEach((panel, index) => {
      const copy = loginScreenHalf(screen, index); panel.appendChild(copy); copies.push(copy);
    });
    // One uninterrupted timeline, independent of authentication/data readiness.
    // Changing phase must neither retarget nor restart the door's movement.
    const tl = gsap.timeline({ onComplete: onFinished });
    panels?.forEach((panel, index) => tl.to(panel, { xPercent: index ? 100 : -100, duration: doorOpenDuration, ease: "power2.inOut" }, 0));
    return () => copies.forEach((copy) => copy.remove());
  }, { scope: root, dependencies: [screen, reduced], revertOnUpdate: true });
  useGSAP(() => {
    const panels = root.current?.querySelectorAll("[data-door-panel]");
    if (!panels) return;
    if (phase !== "cancelling") return;
    gsap.killTweensOf(panels);
    if (reduced || !screen) { onCancelled(); return; }
    gsap.to(panels, { xPercent: 0, duration: 0.32, ease: "power2.inOut", onComplete: onCancelled });
  }, { scope: root, dependencies: [phase, reduced, screen] });
  return <div ref={root} data-auth-door data-phase={phase} aria-hidden="true" className="fixed inset-0 z-[100] overflow-hidden" style={{ background: phase === "opening" ? "transparent" : "var(--background)" }}>
    {[0, 1].map((index) => <div key={index} data-door-panel className={`absolute inset-y-0 w-1/2 overflow-hidden ${index ? "right-0" : "left-0"}`} />)}
  </div>;
}
