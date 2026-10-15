"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function MarketingThemeMotion() {
  const pathname = usePathname();
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
