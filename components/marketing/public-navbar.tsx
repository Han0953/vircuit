"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CircuitBoard, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ComingSoonAction } from "./coming-soon-action";

const navigation = ["Fitur", "Belajar", "Jelajahi", "Harga"] as const;

export function PublicNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setMenuOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <header className="border-b border-border bg-background">
      <a
        href="#main-content"
        className="sr-only z-(--z-tooltip) rounded-md bg-primary p-4 text-primary-foreground focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
      >
        Lewati ke konten utama
      </a>
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:px-8 lg:gap-6">
        <Link
          href="/"
          aria-label="Vircuit — Beranda"
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-sm text-xl font-bold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CircuitBoard aria-hidden="true" className="size-7 text-primary" strokeWidth={1.75} />
          Vircuit<span className="text-primary" aria-hidden="true">.</span>
        </Link>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 lg:flex">
          <Button asChild variant="ghost" className="text-primary">
            <Link href="/" aria-current="page">Beranda</Link>
          </Button>
          {navigation.map((label) => (
            <ComingSoonAction key={label} destination={label}>
              <Button variant="ghost" className="text-text-secondary">{label}</Button>
            </ComingSoonAction>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          <ComingSoonAction destination="Masuk">
            <Button variant="ghost">Masuk</Button>
          </ComingSoonAction>
          <ComingSoonAction destination="Virtual Lab">
            <Button>Coba Simulator<ArrowUpRight aria-hidden="true" /></Button>
          </ComingSoonAction>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ComingSoonAction destination="Virtual Lab">
            <Button className="px-3">Coba Simulator</Button>
          </ComingSoonAction>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Buka menu navigasi">
                <Menu aria-hidden="true" className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full max-w-sm overflow-y-auto">
              <SheetHeader className="border-b p-6 pr-16 text-left">
                <SheetTitle className="text-xl">Vircuit</SheetTitle>
                <SheetDescription>Belajar IoT lewat praktik.</SheetDescription>
              </SheetHeader>
              <nav aria-label="Navigasi mobile" className="flex flex-col gap-1 px-4">
                <SheetClose asChild>
                  <Button asChild variant="ghost" className="justify-start text-primary">
                    <Link href="/" aria-current="page">Beranda</Link>
                  </Button>
                </SheetClose>
                {navigation.map((label) => (
                  <ComingSoonAction key={label} destination={label}>
                    <Button variant="ghost" className="justify-start">{label}</Button>
                  </ComingSoonAction>
                ))}
              </nav>
              <div className="mx-4 flex flex-col gap-3 border-t pt-4">
                <ComingSoonAction destination="Masuk">
                  <Button variant="outline">Masuk</Button>
                </ComingSoonAction>
                <ComingSoonAction destination="Virtual Lab">
                  <Button>Coba Simulator<ArrowUpRight aria-hidden="true" /></Button>
                </ComingSoonAction>
                <p className="text-center text-xs text-text-secondary">Virtual Lab segera hadir</p>
              </div>
              <div className="mt-auto flex items-center justify-between gap-4 border-t p-6">
                <span className="text-sm text-text-secondary">Tampilan</span>
                <ThemeToggle />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
