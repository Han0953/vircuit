"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { marketingScrollRoute } from "./public-motion-config";
import type Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { smoothScrollEligible } from "./scroll-policy";
import "lenis/dist/lenis.css";

// Route-owned adapter: no editor state or second scroll animation loop.
let active: Lenis | null = null;
let cancelFocus: (() => void) | undefined;

export function scrollHomeTo(target: number, focus?: HTMLElement) {
  cancelFocus?.();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let timer = 0;
  let settleFrame = 0;
  let retries = 0;
  const cancel = () => {
    window.clearTimeout(timer); cancelAnimationFrame(settleFrame); window.removeEventListener("scrollend", done);
    window.removeEventListener("wheel", cancel); window.removeEventListener("touchstart", cancel); window.removeEventListener("keydown", cancel);
    delete document.documentElement.dataset.homeMoving;
    window.dispatchEvent(new Event("home-scroll-settled"));
  };
  const native = () => {
    window.scrollTo({ top: target, behavior: reduced ? "instant" : "smooth" });
    timer = window.setTimeout(done, reduced ? 0 : 1500);
  };
  const done = () => {
    window.clearTimeout(timer);
    // Lazy ScrollTrigger refresh may interrupt a native smooth scroll. Resume
    // the requested destination, but never fight a new user gesture.
    if (!active && !reduced && Math.abs(scrollY - target) >= 3 && retries++ < 2) { native(); return; }
    cancel();
    if (Math.abs(scrollY - target) < 3) {
      // Finalize after queued scene refresh: native smooth scrolling may stop a pixel short.
      settleFrame = requestAnimationFrame(() => {
        if (active && !reduced) active.scrollTo(target, { immediate: true });
        else window.scrollTo({ top: target, behavior: "instant" });
        focus?.focus({ preventScroll: true });
      });
    }
  };
  cancelFocus = cancel;
  document.documentElement.dataset.homeMoving = "true";
  window.addEventListener("wheel", cancel, { passive: true });
  window.addEventListener("touchstart", cancel, { passive: true });
  window.addEventListener("keydown", cancel);
  if (active && !reduced) active.scrollTo(target, { duration: .85, onComplete: done });
  else {
    window.addEventListener("scrollend", done);
    native();
  }
}

export function MarketingScroll() {
  const pathname = usePathname();
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const desktop = matchMedia("(min-width: 1024px)");
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    const coarse = matchMedia("(any-pointer: coarse)");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    let touch = false;
    let generation = 0;
    let ticker: ((time: number) => void) | undefined;
    const destroy = () => {
      generation++;
      if (ticker) gsap.ticker.remove(ticker);
      ticker = undefined;
      if (active) { active.destroy(); active = null; gsap.ticker.lagSmoothing(500, 33); }
      document.documentElement.dataset.homeScroll = "native";
    };
    const update = async () => {
      const eligible = marketingScrollRoute(pathname) && smoothScrollEligible({ desktop: desktop.matches, fine: fine.matches, coarse: coarse.matches, reduced: reduced.matches, touch, locked: document.body.hasAttribute("data-scroll-locked") || document.querySelector("[data-menu-open='true']") !== null });
      if (!eligible) { destroy(); return; }
      if (active) return;
      const request = ++generation;
      try {
        const { default: Lenis } = await import("lenis");
        if (disposed || request !== generation) return;
        const instance = new Lenis({ autoRaf: false, syncTouch: false, smoothWheel: true, lerp: .12, anchors: false, prevent: (node) => node.hasAttribute("data-lenis-prevent") });
        active = instance;
        instance.on("scroll", ScrollTrigger.update);
        ticker = (time) => { if (!document.hidden) instance.raf(time * 1000); };
        gsap.ticker.add(ticker);
        gsap.ticker.lagSmoothing(0);
        document.documentElement.dataset.homeScroll = "lenis";
      } catch { destroy(); }
    };
    const changed = () => { void update(); };
    const touched = () => { touch = true; destroy(); };
    const anchor = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href^='#']") : null;
      if (!link?.hash) return;
      let element: HTMLElement | null = null;
      try { element = document.getElementById(decodeURIComponent(link.hash.slice(1))); } catch { return; }
      if (!element) return;
      event.preventDefault();
      const offset = document.querySelector<HTMLElement>("[data-home-header]")?.offsetHeight ?? 0;
      const top = element.id === "main-content" ? 0 : Math.max(0, element.getBoundingClientRect().top + scrollY - offset - 16);
      scrollHomeTo(top, element);
      history.replaceState(history.state, "", link.hash);
    };
    const observer = new MutationObserver(changed);
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-scroll-locked"] });
    const header = document.querySelector("[data-home-header]");
    if (header) observer.observe(header, { attributes: true, attributeFilter: ["data-menu-open"] });
    for (const query of [desktop, fine, coarse, reduced]) query.addEventListener("change", changed);
    window.addEventListener("touchstart", touched, { passive: true });
    document.addEventListener("click", anchor);
    void update();
    return () => {
      disposed = true; destroy(); cancelFocus?.(); cancelFocus = undefined;
      observer.disconnect();
      for (const query of [desktop, fine, coarse, reduced]) query.removeEventListener("change", changed);
      window.removeEventListener("touchstart", touched); document.removeEventListener("click", anchor);
      delete document.documentElement.dataset.homeScroll;
    };
  }, [pathname]);
  return null;
}

export const HomeScroll = MarketingScroll;
