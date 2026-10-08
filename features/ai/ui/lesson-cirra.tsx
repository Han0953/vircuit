"use client";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { CirraChat } from "./cirra-chat";
export function LessonCirra({ owner, lessonId, title }: { owner: string; lessonId: string; title: string }) {
  const [open, setOpen] = useState(false);
  return <Sheet open={open} onOpenChange={setOpen}><SheetTrigger asChild><Button variant="outline"><Sparkles aria-hidden />Tanya Cirra</Button></SheetTrigger><SheetContent side="right" className="h-dvh w-full gap-0 p-0 sm:max-w-xl"><SheetHeader className="shrink-0 border-b pr-14"><SheetTitle>Cirra Tutor</SheetTitle><SheetDescription>Bantuan konsep dan petunjuk untuk {title}.</SheetDescription></SheetHeader><div className="min-h-0 flex-1"><CirraChat key={`${owner}:${lessonId}`} owner={owner} scope={lessonId} contextLabel={title} getContext={() => ({ lessonId })} /></div></SheetContent></Sheet>;
}
