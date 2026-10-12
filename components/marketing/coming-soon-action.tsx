"use client";

import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ComingSoonAction({
  children,
  destination,
}: {
  children: ReactNode;
  destination: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <span className="flex size-12 items-center justify-center rounded-md bg-primary-soft text-primary">
          <ArrowUpRight aria-hidden="true" className="size-6" />
        </span>
        <DialogHeader className="text-left">
          <DialogTitle>{destination} belum tersedia</DialogTitle>
          <DialogDescription className="leading-relaxed">
            Fitur ini belum dapat digunakan. Kamu tetap bisa belajar dan
            bereksperimen melalui Virtual Lab.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Mengerti</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
