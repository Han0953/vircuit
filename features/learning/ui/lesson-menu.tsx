"use client";
import { useState, type ReactNode } from "react";
import { List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
export function LessonMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <Sheet open={open} onOpenChange={setOpen}><SheetTrigger asChild><Button variant="outline" className="xl:hidden"><List aria-hidden />Daftar lesson</Button></SheetTrigger><SheetContent side="left" className="w-80 max-w-[90vw] overflow-y-auto p-5"><SheetHeader className="px-0"><SheetTitle>Daftar lesson</SheetTitle><SheetDescription>Urutan belajar yang direkomendasikan.</SheetDescription></SheetHeader><div onClick={(event) => { if (event.target instanceof Element && event.target.closest("a")) setOpen(false); }}>{children}</div></SheetContent></Sheet>;
}
