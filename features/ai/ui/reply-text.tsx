"use client";
import { useLayoutEffect, useMemo, useRef, type ReactNode } from "react";

// Bound the animation count while preserving whitespace, whole words and Unicode.
export function replyRevealChunks(text: string) {
  const size = Math.max(1, Math.ceil(text.length / 80));
  const chunks: string[] = [];
  let chunk = "";
  for (const word of text.match(/\S+\s*|\s+/gu) ?? []) {
    chunk += word;
    if (chunk.length >= size) { chunks.push(chunk); chunk = ""; }
  }
  if (chunk) chunks.push(chunk);
  return chunks;
}

export function ReplyText({ text, fresh, active, children }: { text: string; fresh: boolean; active: boolean; children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const completed = useRef(false);
  const chunks = useMemo(() => replyRevealChunks(text), [text]);
  useLayoutEffect(() => {
    if (completed.current) return;
    const el = ref.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!el || !fresh || !active || reduce.matches) { completed.current = true; return; }
    const duration = Math.min(2200, Math.max(650, text.length * 12));
    el.dataset.revealing = "true";
    const parts = [...el.querySelectorAll<HTMLElement>("[data-reply-text] > span")];
    const details = el.querySelector<HTMLElement>("[data-reply-details]");
    const timers: ReturnType<typeof setTimeout>[] = [];
    const animations: Animation[] = [];
    const extras = details ? [...details.children].flatMap((child) => child.matches("ul") ? [...child.children] : [child]).filter((child): child is HTMLElement => child instanceof HTMLElement) : [];
    const hide = (part: HTMLElement) => { part.hidden = true; part.style.opacity = "0"; };
    const show = (part: HTMLElement) => {
      part.hidden = false; part.style.removeProperty("opacity");
      animations.push(part.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: "ease-out" }));
    };
    // Hidden chunks take no space: the bubble grows with the answer instead of
    // reserving the full response height before the first words are visible.
    parts.forEach(hide); extras.forEach(hide); if (details) hide(details);
    parts.forEach((part, index) => timers.push(setTimeout(() => show(part), 80 + index * duration / Math.max(1, parts.length))));
    if (details) timers.push(setTimeout(() => {
      details.hidden = false; details.style.removeProperty("opacity");
      extras.forEach((part, index) => timers.push(setTimeout(() => show(part), index * 120)));
    }, 80 + duration));
    const finish = () => {
      timers.forEach(clearTimeout); animations.forEach((animation) => animation.cancel());
      [...parts, ...extras, ...(details ? [details] : [])].forEach((part) => { part.hidden = false; part.style.removeProperty("opacity"); });
      delete el.dataset.revealing;
    };
    const changed = () => { if (reduce.matches) { completed.current = true; finish(); } };
    // Cleanup may be followed by React Strict Mode's setup replay. Only a completed
    // reveal or a genuinely inactive/reduced-motion render should suppress animation.
    timers.push(setTimeout(() => { completed.current = true; delete el.dataset.revealing; }, 80 + duration + Math.max(1, extras.length) * 120 + 180));
    reduce.addEventListener("change", changed);
    return () => { finish(); reduce.removeEventListener("change", changed); };
  }, [active, chunks, fresh, text]);
  return <div ref={ref} className="space-y-2"><p data-reply-text className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{chunks.map((chunk, index) => <span key={index}>{chunk}</span>)}</p>{children && <div data-reply-details className="space-y-2">{children}</div>}</div>;
}
