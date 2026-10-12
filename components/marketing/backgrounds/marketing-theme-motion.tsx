"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

export function MarketingThemeMotion() {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const previousTheme = useRef(resolvedTheme);
  useEffect(() => {
    const previous = previousTheme.current;
    previousTheme.current = resolvedTheme;
    if (!previous || previous === resolvedTheme || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const animations = Array.from(document.querySelectorAll<HTMLElement>("[data-theme-visible='true'] > [data-marketing-background] > [data-bg-drift]"),
      (layer) => layer.animate([{ opacity: .6 }, { opacity: 1 }], { duration: 240, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }));
    return () => animations.forEach((animation) => animation.cancel());
  }, [resolvedTheme, pathname]);
  useEffect(() => {
    const sections = new Set(Array.from(document.querySelectorAll("main [data-marketing-background]"), (background) => background.parentElement!));
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) entry.target.setAttribute("data-theme-visible", String(entry.isIntersecting));
    }, { rootMargin: "80px 0px" });
    sections.forEach((section) => observer.observe(section));
    return () => {
      observer.disconnect();
      sections.forEach((section) => section.removeAttribute("data-theme-visible"));
    };
  }, [pathname]);
  return null;
}
