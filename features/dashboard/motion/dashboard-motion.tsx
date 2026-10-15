"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { usePreferences, useReducedMotion } from "@/features/settings/preferences";
import { useAuthTransition } from "@/features/auth/motion/auth-transition";
import { contentDuration, contentStagger, dashboardIntroTiming } from "./intro-timing";
import { dashboardLinks } from "../navigation";

gsap.registerPlugin(useGSAP);
const selector = "[data-motion='header'],[data-motion='action'],[data-motion='kpi'],[data-motion='card'],[data-motion='item'],[data-motion='meter'],[data-motion='notice']";
export function DashboardMotionSection({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const root = useRef<HTMLDivElement>(null);
  const seen = useRef(new WeakSet<Element>());
  const reduced = useReducedMotion();
  const preferences = usePreferences();
  const transition = useAuthTransition();
  const pathname = usePathname();
  const loginIntro = useRef("");
  useEffect(() => {
    if (transition.waiting) return;
    const timer = window.setTimeout(() => {
      if (document.activeElement?.closest("button,input,textarea,select,[contenteditable=true],[role=menu],[role=dialog]")) return;
      const heading = root.current?.querySelector<HTMLElement>("h1");
      if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
    }, transition.intro ? Math.max(0, (dashboardIntroTiming(window.innerWidth < 1024 ? 5 : dashboardLinks.length + 1).contentStart + contentDuration) * 1000 - (performance.now() - transition.introStartedAt)) : 350);
    const cancel = () => window.clearTimeout(timer);
    window.addEventListener("pointerdown", cancel, { once: true, capture: true });
    window.addEventListener("keydown", cancel, { once: true, capture: true });
    return () => { cancel(); window.removeEventListener("pointerdown", cancel, true); window.removeEventListener("keydown", cancel, true); };
  }, [pathname, transition.waiting, transition.intro, transition.introStartedAt, preferences.dashboardSidebar]);
  useGSAP((context, contextSafe) => {
    const container = root.current;
    if (!container || transition.waiting || (!!container.closest("[data-intro-pending=true]") && !transition.intro)) return;
    if (reduced) { gsap.set(container.querySelectorAll(selector), { clearProps: "opacity,transform" }); gsap.set(container, { attr: { "data-content-motion-ready": "true" } }); return; }
    const entering = !!transition.intro && loginIntro.current !== transition.intro;
    if (entering) loginIntro.current = transition.intro;
    const contentStart = entering ? Math.max(0, dashboardIntroTiming(window.innerWidth < 1024 ? 5 : dashboardLinks.length + 1).contentStart - (performance.now() - transition.introStartedAt) / 1000) : 0;
    let firstReveal = true;
    const reveal = contextSafe?.(() => {
      const elements = Array.from(container.querySelectorAll<HTMLElement>(selector)).filter((element) => {
        if (seen.current.has(element) || element.closest("[hidden]")) return false;
        const parent = element.parentElement?.closest(selector);
        if (parent && container.contains(parent) && element.dataset.motion !== "meter") { seen.current.add(element); return false; }
        return true;
      });
      if (firstReveal && !entering) {
        firstReveal = false;
        elements.forEach((element) => seen.current.add(element));
        gsap.set(elements, { clearProps: "opacity,transform" });
        return;
      }
      const loginGroup = firstReveal && entering;
      firstReveal = false;
      const tl = gsap.timeline({ delay: Math.max(0, delay) + (loginGroup ? contentStart : 0), defaults: { ease: "power3.out", clearProps: "opacity,transform" } });
      elements.forEach((element, index) => {
        seen.current.add(element);
        const meter = element.dataset.motion === "meter";
        gsap.set(element, meter ? { scaleX: 0.6, transformOrigin: "left center" } : { opacity: loginGroup ? 0 : 0.6, y: window.innerWidth < 768 ? 8 : 14 });
        tl.to(element, meter ? { scaleX: 1, duration: contentDuration } : { opacity: 1, y: 0, duration: loginGroup ? contentDuration : 0.68 }, index * (loginGroup ? contentStagger : 0.045));
      });
    });
    reveal?.();
    gsap.set(container, { attr: { "data-content-motion-ready": "true" } });
    const observer = new MutationObserver(() => reveal?.());
    observer.observe(container, { subtree: true, childList: true });
    return () => observer.disconnect();
  }, { scope: root, dependencies: [pathname, reduced, transition.waiting, transition.intro, transition.introStartedAt], revertOnUpdate: true });
  return <div ref={root} data-dashboard-content-ready className={className}>{children}</div>;
}
