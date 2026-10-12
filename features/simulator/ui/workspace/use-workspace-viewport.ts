"use client";
import { useEffect, useRef } from "react";

export function useWorkspaceViewport() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const mobile = matchMedia("(max-width: 1023px)");
    const viewport = window.visualViewport;
    let frame = 0;
    const measure = () => {
      frame = 0;
      if (!mobile.matches) {
        element.style.removeProperty("--workspace-height");
        element.style.removeProperty("--workspace-top");
        delete element.dataset.keyboardOpen;
        return;
      }
      element.style.setProperty("--workspace-height", `${viewport?.height ?? innerHeight}px`);
      element.style.setProperty("--workspace-top", `${viewport?.offsetTop ?? 0}px`);
      const active = document.activeElement;
      const typing = active?.matches("input,textarea,[contenteditable]:not([contenteditable='false'])") || active?.closest(".monaco-editor");
      element.dataset.keyboardOpen = String((!!typing || element.dataset.keyboardOpen === "true") && (viewport?.scale ?? 1) < 1.05 && innerHeight - (viewport?.height ?? innerHeight) > 120);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    measure();
    mobile.addEventListener("change", schedule);
    viewport?.addEventListener("resize", schedule);
    viewport?.addEventListener("scroll", schedule);
    window.addEventListener("resize", schedule);
    document.addEventListener("focusin", schedule);
    document.addEventListener("focusout", schedule);
    return () => {
      cancelAnimationFrame(frame);
      mobile.removeEventListener("change", schedule);
      viewport?.removeEventListener("resize", schedule);
      viewport?.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("focusin", schedule);
      document.removeEventListener("focusout", schedule);
    };
  }, []);
  return root;
}
