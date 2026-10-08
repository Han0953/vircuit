"use client";
import { useEffect, useRef, type ReactNode } from "react";
import type { ChatMessage } from "./session-store";

export function ChatBubble({ message, fresh, active, children }: { message: ChatMessage; fresh: boolean; active: boolean; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const seen = useRef(false);
  useEffect(() => {
    if (seen.current) return;
    seen.current = true;
    const el = ref.current, reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!el || !fresh || !active || reduce.matches) return;
    const duration = parseFloat(getComputedStyle(el).getPropertyValue("--motion-ui")) || 200;
    const animation = el.animate([{ opacity: 0, transform: "translateY(4px)" }, { opacity: 1, transform: "translateY(0)" }], { duration, easing: "ease-out" });
    const stop = () => { if (reduce.matches) animation.cancel(); };
    reduce.addEventListener("change", stop);
    return () => { animation.cancel(); reduce.removeEventListener("change", stop); };
  }, [active, fresh]);
  return <article ref={ref} data-message-id={message.id} data-message-role={message.role} data-message-mode={message.mode} className={`min-w-0 space-y-2 rounded-xl px-3 py-2.5 text-sm leading-relaxed ${message.role === "user" ? "ml-6 bg-surface" : "mr-2"}`}>{children}</article>;
}
