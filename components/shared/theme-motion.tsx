"use client";

import { useEffect } from "react";

/** One color clock for every shell, including OS and cross-tab theme changes. */
export function ThemeMotion() {
  useEffect(() => {
    const root = document.documentElement;
    let dark = root.classList.contains("dark");
    root.dataset.themeReady = "true";
    let timer: ReturnType<typeof setTimeout> | undefined;
    let frame = 0;
    let generation = 0;
    let alive = true;
    const palette = (classes: string | null) => (classes ?? "").split(/\s+/).filter(value => value === "light" || value === "dark").sort().join(" ");
    const observe = () => observer.observe(root, { attributes: true, attributeFilter: ["class"], attributeOldValue: true });
    const observer = new MutationObserver((records) => {
      const currentPalette = palette(root.className);
      if (!records.some(record => palette(record.oldValue) !== currentPalette)) return;
      const next = root.classList.contains("dark");
      if (next === dark) return;
      dark = next;
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      const current = ++generation;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches || !!document.querySelector('[data-motion-preference="reduced"]');
      const finish = () => { if (alive && current === generation) delete root.dataset.themeChanging; };
      // A microtask before style/paint: animate palette tokens once, rather than
      // cascading separate inherited color transitions through every child.
      root.dataset.themeChanging = reduced ? "instant" : "colors";
      if (reduced) { timer = setTimeout(finish, 32); return; }
      // Read only the small set of palette owners, never every UI node. Waiting
      // for actual CSS completion avoids re-enabling child transitions early
      // when a busy frame delays the start of the palette animation.
      const owners = [root, ...document.querySelectorAll(':is(section,div):has(> [data-marketing-background])')];
      const animations = owners.flatMap((owner) => owner.getAnimations()).filter((animation) => typeof CSSTransition !== "undefined" && animation instanceof CSSTransition && animation.transitionProperty.startsWith("--"));
      if (!animations.length) { timer = setTimeout(finish, 32); return; }
      void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
        if (!alive || current !== generation) return;
        // Paint the final palette before restoring each control's hover CSS.
        frame = requestAnimationFrame(() => { frame = requestAnimationFrame(finish); });
      });
    });
    observe();
    return () => { alive = false; generation++; observer.disconnect(); clearTimeout(timer); cancelAnimationFrame(frame); delete root.dataset.themeChanging; delete root.dataset.themeReady; };
  }, []);
  return null;
}
