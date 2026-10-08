"use client";
import { useEffect, type RefObject } from "react";

export function useChatViewport(ref: RefObject<HTMLElement | null>, open: boolean, mobile: boolean, lockScroll = false) {
  useEffect(() => {
    const panel = ref.current;
    if (!panel || !open || !mobile) return;
    const viewport = window.visualViewport;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        panel.style.setProperty("--cirra-visible-height", `${Math.max(1, viewport?.height ?? window.innerHeight)}px`);
        panel.style.setProperty("--cirra-visible-top", `${Math.max(0, viewport?.offsetTop ?? 0)}px`);
      });
    };
    const bodyOverflow = document.body.style.overflow;
    const rootOverflow = document.documentElement.style.overflow;
    if (lockScroll) { document.body.style.overflow = "hidden"; document.documentElement.style.overflow = "hidden"; }
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    update();
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      panel.style.removeProperty("--cirra-visible-height"); panel.style.removeProperty("--cirra-visible-top");
      if (lockScroll) { document.body.style.overflow = bodyOverflow; document.documentElement.style.overflow = rootOverflow; }
    };
  }, [ref, open, mobile, lockScroll]);
}
