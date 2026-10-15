"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/features/settings/preferences";
import { useAuthTransition } from "@/features/auth/motion/auth-transition";

gsap.registerPlugin(useGSAP);
const selector = "[data-motion='header'],[data-motion='action'],[data-motion='kpi'],[data-motion='card'],[data-motion='item'],[data-motion='meter'],[data-motion='notice']";
export function DashboardMotionSection({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const root = useRef<HTMLDivElement>(null);
  const seen = useRef(new WeakSet<Element>());
  const reduced = useReducedMotion();
  const transition = useAuthTransition();
  const pathname = usePathname();
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (document.activeElement?.closest("button,input,textarea,select,[contenteditable=true],[role=menu],[role=dialog]")) return;
      const heading = root.current?.querySelector<HTMLElement>("h1");
      if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
    }, 350);
    const cancel = () => window.clearTimeout(timer);
    window.addEventListener("pointerdown", cancel, { once: true, capture: true });
    window.addEventListener("keydown", cancel, { once: true, capture: true });
    return () => { cancel(); window.removeEventListener("pointerdown", cancel, true); window.removeEventListener("keydown", cancel, true); };
  }, [pathname]);
  useGSAP((context, contextSafe) => {
    const container = root.current;
    if (!container || transition.waiting || (!!container.closest("[data-intro-pending=true]") && !transition.intro)) return;
    if (reduced) { gsap.set(container.querySelectorAll(selector), { clearProps: "opacity,transform" }); return; }
    const reveal = contextSafe?.(() => {
      const elements = Array.from(container.querySelectorAll<HTMLElement>(selector)).filter((element) => {
        if (seen.current.has(element) || element.closest("[hidden]")) return false;
        const parent = element.parentElement?.closest(selector);
        if (parent && container.contains(parent) && element.dataset.motion !== "meter") { seen.current.add(element); return false; }
        return true;
      });
      const tl = gsap.timeline({ delay: Math.max(0, delay) + (transition.intro ? 0.25 : 0), defaults: { ease: "power2.out", clearProps: "opacity,transform" } });
      elements.forEach((element, index) => {
        seen.current.add(element);
        const meter = element.dataset.motion === "meter";
        tl.fromTo(element, meter ? { scaleX: 0.6, transformOrigin: "left center" } : { opacity: 0.8, y: window.innerWidth < 768 ? 4 : 8 }, meter ? { scaleX: 1, duration: 0.35 } : { opacity: 1, y: 0, duration: 0.24 }, Math.min(index * 0.025, 0.24));
      });
    });
    reveal?.();
    const observer = new MutationObserver(() => reveal?.());
    observer.observe(container, { subtree: true, childList: true });
    return () => observer.disconnect();
  }, { scope: root, dependencies: [reduced, transition.waiting, transition.intro], revertOnUpdate: true });
  return <div ref={root} className={className}>{children}</div>;
}
