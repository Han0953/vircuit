"use client";
import { useRef, useState, useSyncExternalStore } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { CirraChat } from "./cirra-chat";
import { desktopChatInput } from "./chat-input";
import { useChatViewport } from "./use-chat-viewport";
const subscribe = (listener: () => void) => { const query = window.matchMedia("(min-width: 1024px)"); query.addEventListener("change", listener); return () => query.removeEventListener("change", listener); };
export function LessonCirra({ owner, lessonId, title }: { owner: string; lessonId: string; title: string }) {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null), close = useRef<HTMLButtonElement>(null);
  const openingInput = useRef("keyboard");
  const desktop = useSyncExternalStore(subscribe, () => window.matchMedia("(min-width: 1024px)").matches, () => false);
  useChatViewport(panel, open, !desktop);
  return <Sheet open={open} onOpenChange={setOpen}>
    <SheetTrigger asChild><Button variant="outline" onPointerDown={(event) => { openingInput.current = event.pointerType; }} onKeyDown={() => { openingInput.current = "keyboard"; }}><Sparkles aria-hidden />Tanya Cirra</Button></SheetTrigger>
    <SheetContent ref={panel} side="right" showCloseButton={false} className="cirra-viewport h-dvh w-full gap-0 overflow-hidden p-0 sm:max-w-xl" onOpenAutoFocus={(event) => {
      event.preventDefault();
      const input = desktopChatInput() && openingInput.current !== "touch" ? panel.current?.querySelector<HTMLTextAreaElement>("textarea") : null;
      (input ?? close.current)?.focus({ preventScroll: true });
    }}>
      <SheetHeader className="shrink-0 border-b px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]"><div className="flex items-center justify-between gap-3"><SheetTitle className="flex items-center gap-2 text-sm"><Sparkles aria-hidden className="size-4 text-ai" />Cirra</SheetTitle><SheetClose asChild><Button ref={close} variant="ghost" size="icon" aria-label="Tutup Cirra"><X aria-hidden /></Button></SheetClose></div><SheetDescription className="truncate text-xs" title={title}>{title}</SheetDescription></SheetHeader>
      <div className="min-h-0 flex-1"><CirraChat key={`${owner}:${lessonId}`} owner={owner} scope={lessonId} active={open} contextLabel={title} getContext={() => ({ lessonId })} /></div>
    </SheetContent>
  </Sheet>;
}
