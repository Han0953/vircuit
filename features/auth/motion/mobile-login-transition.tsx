"use client";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { loginScreenHalf } from "./login-screen";

gsap.registerPlugin(useGSAP);
export default function MobileLoginTransition({ screen, phase, onCancelled, onFinished }: {
  screen: HTMLElement | null;
  phase: "authenticating" | "waiting" | "opening" | "cancelling";
  onCancelled: () => void;
  onFinished: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLElement | null>(null);
  useGSAP(() => {
    if (!screen || !root.current) return;
    const view = loginScreenHalf(screen, 0);
    copy.current = view;
    root.current.appendChild(view);
    // Keep the form recognizable while authentication runs. Only a verified
    // destination starts the short fade out; there is no split-screen motion.
    gsap.to(view, { opacity: 0.9, duration: 0.18, ease: "power2.out" });
    return () => { view.remove(); copy.current = null; };
  }, { scope: root, dependencies: [screen], revertOnUpdate: true });
  useGSAP(() => {
    if (phase !== "opening" && phase !== "cancelling") return;
    const cancel = phase === "cancelling";
    const done = cancel ? onCancelled : onFinished;
    if (!copy.current) { done(); return; }
    gsap.to(copy.current, { opacity: cancel ? 1 : 0, y: cancel ? 0 : -8, duration: cancel ? 0.18 : 0.36, ease: "power2.out", overwrite: true, onComplete: done });
  }, { scope: root, dependencies: [phase] });
  return <div ref={root} data-auth-transition data-auth-mobile data-phase={phase} aria-hidden="true" className="fixed inset-0 z-[100] overflow-hidden" style={{ background: phase === "opening" ? "transparent" : "var(--background)" }} />;
}
