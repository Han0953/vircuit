"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { WorkspaceCirra } from "./workspace-cirra";
import { useCirraSession } from "./session-store";

export function FloatingCirra({ desktop, blocked }: { desktop: boolean; blocked: boolean }) {
  const [open, setOpen] = useState(false);
  const [visited, setVisited] = useState(false);
  const bubble = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLElement>(null);
  const origin = useRef<HTMLElement | null>(null);
  const close = useCallback(() => {
    setOpen(false);
    const target = origin.current;
    requestAnimationFrame(() => (target?.isConnected && target.getClientRects().length ? target : bubble.current)?.focus());
  }, []);
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); close(); }
      if (!desktop && event.key === "Tab" && !dialog.current?.contains(document.activeElement)) {
        event.preventDefault(); closeButton.current?.focus();
      }
    };
    const containFocus = (event: FocusEvent) => {
      if (!desktop && event.target instanceof Node && !dialog.current?.contains(event.target)) closeButton.current?.focus();
    };
    document.addEventListener("keydown", escape);
    document.addEventListener("focusin", containFocus);
    return () => { document.removeEventListener("keydown", escape); document.removeEventListener("focusin", containFocus); };
  }, [open, close, desktop]);
  useEffect(() => {
    const show = () => { origin.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; setVisited(true); setOpen(true); requestAnimationFrame(() => closeButton.current?.focus()); };
    const channel = new BroadcastChannel("vircuit-auth");
    channel.onmessage = () => useCirraSession.setState({ threads: {}, launch: null });
    window.addEventListener("vircuit:open-cirra", show);
    return () => { window.removeEventListener("vircuit:open-cirra", show); channel.close(); };
  }, []);
  return <div className={blocked ? "hidden" : "pointer-events-none absolute inset-0 z-20"}>
    <section ref={dialog} role="dialog" aria-label="Asisten Cirra" aria-modal={!desktop && open ? true : undefined} inert={!open} style={{ display: open ? undefined : "none" }}
      className="pointer-events-auto fixed inset-0 z-50 flex min-h-0 flex-col overflow-hidden border bg-background shadow-xl lg:absolute lg:inset-auto lg:right-3 lg:bottom-16 lg:h-[min(38rem,calc(100%-4rem))] lg:max-h-full lg:w-[min(26rem,calc(100%-1.5rem))] lg:rounded-xl"
      onKeyDown={(event) => {
        if (event.key === "Escape") { event.stopPropagation(); close(); }
        if (!desktop && event.key === "Tab") {
          const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')].filter((el) => el.getClientRects().length);
          const first = controls[0], last = controls.at(-1);
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }
      }}>
      <div className="flex shrink-0 items-center justify-between border-b bg-surface px-3"><span className="text-xs text-text-secondary">Asisten belajar</span><Button ref={closeButton} size="icon" variant="ghost" aria-label="Minimalkan Cirra" onClick={close}><X /></Button></div>
      <div className="workspace-cirra-body min-h-0 flex-1">{visited && <WorkspaceCirra />}</div>
    </section>
    <TooltipProvider><Tooltip><TooltipTrigger asChild><Button ref={bubble} aria-label="Buka Cirra" aria-expanded={open} className="pointer-events-auto absolute right-3 bottom-3 size-11 rounded-full shadow-md" onClick={() => { if (open) close(); else window.dispatchEvent(new Event("vircuit:open-cirra")); }}><Sparkles aria-hidden /></Button></TooltipTrigger><TooltipContent side="left">Cirra · Tutor, Debugger, Project Assistant</TooltipContent></Tooltip></TooltipProvider>
  </div>;
}
