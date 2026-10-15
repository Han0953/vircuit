"use client";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { useReducedMotion } from "@/features/settings/preferences";

gsap.registerPlugin(useGSAP);
export default function DoorOverlay({ phase, onClosed, onFinished }: { phase: "closing" | "waiting" | "opening"; onClosed: () => void; onFinished: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useGSAP(() => {
    if (phase === "waiting") return;
    if (reduced) { if (phase === "closing") onClosed(); else onFinished(); return; }
    const panels = root.current?.querySelectorAll("[data-door]");
    if (!panels) return;
    const mobile = window.innerWidth < 1024;
    const tl = gsap.timeline({ onComplete: phase === "closing" ? onClosed : onFinished });
    panels.forEach((panel, index) => tl.fromTo(panel, { xPercent: phase === "closing" ? (index ? 100 : -100) : 0 }, { xPercent: phase === "closing" ? 0 : (index ? 100 : -100), duration: mobile ? 0.18 : phase === "closing" ? 0.24 : 0.28, ease: "power2.inOut" }, 0));
    tl.fromTo("[data-door-brand]", { opacity: phase === "closing" ? 0 : 1 }, { opacity: phase === "closing" ? 1 : 0, duration: 0.12 }, 0);
  }, { scope: root, dependencies: [phase, reduced], revertOnUpdate: true });
  return <div ref={root} data-auth-door data-phase={phase} role="status" aria-live="polite" className="fixed inset-0 z-[100] overflow-hidden">
    <span className="sr-only">Menyiapkan ruang belajarmu…</span>
    {[0, 1].map((index) => <div key={index} data-door aria-hidden className={`absolute inset-y-0 w-1/2 bg-surface ${index ? "right-0 border-l border-primary/30" : "left-0"}`} style={{ backgroundImage: "linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)", backgroundSize: "64px 64px" }} />)}
    <div data-door-brand aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center"><div className="rounded-2xl border bg-surface p-5 shadow-lg"><BrandLogo /></div></div>
  </div>;
}
