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
    // Text already occupies its final height: revealing it never moves the reader.
    const parts = [...el.querySelectorAll("[data-reply-text] > span")];
    const animations = parts.map((part, index) => part.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { delay: 120 + index * duration / Math.max(1, parts.length), duration: parts.length === 1 ? 350 : 220, fill: "backwards", easing: "ease-out" },
    ));
    const details = el.querySelector("[data-reply-details]");
    if (details) animations.push(details.animate([{ opacity: 0 }, { opacity: 1 }], { delay: 120 + duration, duration: 220, fill: "backwards", easing: "ease-out" }));
    const finish = () => { animations.forEach((animation) => animation.cancel()); delete el.dataset.revealing; };
    const changed = () => { if (reduce.matches) { completed.current = true; finish(); } };
    // Cleanup may be followed by React Strict Mode's setup replay. Only a completed
    // reveal or a genuinely inactive/reduced-motion render should suppress animation.
    void Promise.all(animations.map((animation) => animation.finished)).then(() => { completed.current = true; delete el.dataset.revealing; }).catch(() => {});
    reduce.addEventListener("change", changed);
    return () => { finish(); reduce.removeEventListener("change", changed); };
  }, [active, chunks, fresh, text]);
  return <div ref={ref} className="space-y-2"><p data-reply-text className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{chunks.map((chunk, index) => <span key={index}>{chunk}</span>)}</p>{children && <div data-reply-details className="space-y-2">{children}</div>}</div>;
}
