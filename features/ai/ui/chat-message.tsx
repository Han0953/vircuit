"use client";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import type { ChatMessage } from "./session-store";
import { CirraAvatar } from "./cirra-avatar";

export function MessageSurface({ role, children }: { role: ChatMessage["role"]; children: ReactNode }) {
  return <>
    {role === "assistant" && <CirraAvatar size={32} />}
    <div data-chat-bubble className={`min-w-0 space-y-2 rounded-2xl border px-3 py-2.5 text-sm leading-relaxed ${role === "user" ? "rounded-tr-md border-primary/15 bg-primary-soft" : "rounded-tl-md bg-surface"}`}>{children}</div>
  </>;
}

export function ChatBubble({ message, fresh, active, children }: { message: ChatMessage; fresh: boolean; active: boolean; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const completed = useRef(false);
  useLayoutEffect(() => {
    if (completed.current) return;
    const el = ref.current, reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!el || !fresh || !active || reduce.matches) { completed.current = true; return; }
    const duration = parseFloat(getComputedStyle(el).getPropertyValue("--motion-ui")) || 200;
    const animation = el.animate([{ opacity: 0, transform: "translateY(4px)" }, { opacity: 1, transform: "translateY(0)" }], { duration, easing: "ease-out" });
    const stop = () => { if (reduce.matches) { completed.current = true; animation.cancel(); } };
    void animation.finished.then(() => { completed.current = true; }).catch(() => {});
    reduce.addEventListener("change", stop);
    return () => { animation.cancel(); reduce.removeEventListener("change", stop); };
  }, [active, fresh]);
  return <article ref={ref} data-message-id={message.id} data-message-role={message.role} data-message-mode={message.mode} className={`flex w-fit min-w-0 items-start gap-2 ${message.role === "user" ? "ml-auto max-w-[85%]" : "mr-auto max-w-full"}`}><MessageSurface role={message.role}>{children}</MessageSurface></article>;
}
