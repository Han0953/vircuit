"use client";
import { useEffect, type RefObject } from "react";
import { usePathname, useRouter } from "next/navigation";
import { swipeDestination, swipeRoutes } from "../navigation";

export function useDashboardSwipe(root: RefObject<HTMLElement | null>) {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    const element = root.current;
    if (!element || !swipeRoutes.some((route) => route === pathname)) return;
    let start: { id: number; x: number; y: number; time: number } | null = null;
    let lock = false;
    let timer = 0;
    const excluded = "a,button,input,textarea,select,label,pre,code,[contenteditable],[role=slider],[role=dialog],[role=tablist],[data-no-swipe],[data-slot=sheet-content],.react-flow,.monaco-editor";
    const down = (event: PointerEvent) => {
      if (!event.isPrimary) { start = null; return; }
      if (lock || event.pointerType !== "touch" || window.innerWidth >= 1024 || !(event.target instanceof Element) || event.target.closest(excluded) || document.querySelector('[role="dialog"][data-state="open"]')) return;
      let target: Element | null = event.target;
      while (target && target !== element) { if (target.scrollWidth > target.clientWidth + 2 && ["auto", "scroll"].includes(getComputedStyle(target).overflowX)) return; target = target.parentElement; }
      start = { id: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now() };
    };
    const cancel = () => { start = null; };
    const move = (event: PointerEvent) => { if (start && (event.pointerId !== start.id || Math.abs(event.clientY - start.y) > 24)) cancel(); };
    const up = (event: PointerEvent) => {
      const initial = start; start = null;
      if (!initial || event.pointerId !== initial.id || window.getSelection()?.toString()) return;
      const target = swipeDestination(pathname, { dx: event.clientX - initial.x, dy: event.clientY - initial.y, elapsed: performance.now() - initial.time, startX: initial.x, width: window.innerWidth });
      if (!target) return;
      lock = true;
      router.push(target);
      timer = window.setTimeout(() => { lock = false; }, 1200);
    };
    element.addEventListener("pointerdown", down, { passive: true }); element.addEventListener("pointermove", move, { passive: true }); element.addEventListener("pointerup", up, { passive: true }); element.addEventListener("pointercancel", cancel);
    return () => { window.clearTimeout(timer); element.removeEventListener("pointerdown", down); element.removeEventListener("pointermove", move); element.removeEventListener("pointerup", up); element.removeEventListener("pointercancel", cancel); };
  }, [root, pathname, router]);
}
