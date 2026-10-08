"use client";
import { useCallback, useLayoutEffect, useRef } from "react";
import { updateSession, useCirraSession, type ChatMessage } from "./session-store";

export const nearBottom = (top: number, height: number, viewport: number) => height - viewport - top <= 64;
export function useChatScroll(key: string, messages: ChatMessage[], active: boolean) {
  const log = useRef<HTMLDivElement>(null);
  const previous = useRef({ key, active: false, last: messages.at(-1)?.id });
  const anchor = useRef<{ id: string; offset: number } | null>(null);
  const remember = useCallback(() => {
    const el = log.current;
    if (!active || !el?.clientHeight) return;
    const first = [...el.querySelectorAll<HTMLElement>("[data-message-id]")].find((message) => message.offsetTop + message.offsetHeight > el.scrollTop);
    anchor.current = first ? { id: first.dataset.messageId!, offset: first.offsetTop - el.scrollTop } : null;
    updateSession(key, { scroll: { top: el.scrollTop, nearBottom: nearBottom(el.scrollTop, el.scrollHeight, el.clientHeight) } });
  }, [active, key, log]);
  const jump = useCallback(() => {
    const el = log.current;
    if (!el?.clientHeight) return;
    el.scrollTop = el.scrollHeight;
    remember();
  }, [log, remember]);
  useLayoutEffect(() => {
    const el = log.current, last = messages.at(-1), old = previous.current;
    previous.current = { key, active, last: last?.id };
    if (!active || !el?.clientHeight) return;
    const saved = useCirraSession.getState().sessions[key]?.scroll;
    if (!saved) return;
    const restoring = key !== old.key || !old.active;
    if (saved.nearBottom || (!restoring && last?.id !== old.last && last?.role === "user")) el.scrollTop = el.scrollHeight;
    else if (restoring) el.scrollTop = saved.top;
    else if (anchor.current) {
      const target = [...el.querySelectorAll<HTMLElement>("[data-message-id]")].find((message) => message.dataset.messageId === anchor.current?.id);
      if (target) el.scrollTop = target.offsetTop - anchor.current.offset;
    }
    remember();
  }, [active, key, log, messages, remember]);
  useLayoutEffect(() => {
    const el = log.current;
    if (!active || !el) return;
    const observer = new ResizeObserver(() => {
      if (!el.clientHeight) return;
      if (useCirraSession.getState().sessions[key]?.scroll.nearBottom) el.scrollTop = el.scrollHeight;
      remember();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [active, key, log, remember]);
  return { log, remember, jump };
}
