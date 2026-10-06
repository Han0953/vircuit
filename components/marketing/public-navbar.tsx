"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { cn } from "@/lib/utils";
import { isActiveRoute, marketingRoutes, primaryNavigation } from "./marketing-routes";

export function PublicNavbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const loginActive = isActiveRoute(pathname, marketingRoutes.login);

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
          href={marketingRoutes.home}
          aria-label="Vircuit — Beranda"
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-sm text-xl font-bold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CircuitBoard aria-hidden="true" className="size-7 text-primary" strokeWidth={1.75} />
          Vircuit<span className="text-primary" aria-hidden="true">.</span>
        </Link>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 lg:flex">
          {primaryNavigation.map(({ label, href }) => {
            const active = isActiveRoute(pathname, href);
            return (
              <Button
                key={href}
                asChild
                variant="ghost"
                className={cn(active ? "text-primary font-semibold" : "text-text-secondary hover:text-foreground")}
              >
                <Link href={href} aria-current={active ? "page" : undefined}>
                  {label}
                </Link>
              </Button>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          <Button asChild variant="ghost" className={cn(loginActive && "text-primary font-semibold")}>
            <Link href={marketingRoutes.login} aria-current={loginActive ? "page" : undefined}>
              Masuk
            </Link>
          </Button>
          <Button asChild>
            <Link href={marketingRoutes.simulator}>
              Coba Simulator
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <Button asChild className="px-3">
            <Link href={marketingRoutes.simulator}>Coba Simulator</Link>
          </Button>
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
                {primaryNavigation.map(({ label, href }) => {
                  const active = isActiveRoute(pathname, href);
                  return (
                    <SheetClose key={href} asChild>
                      <Button
                        asChild
                        variant="ghost"
                        className={cn(
                          "justify-start",
                          active && "bg-primary-soft text-primary font-semibold"
                        )}
                      >
                        <Link href={href} aria-current={active ? "page" : undefined}>
                          {label}
                        </Link>
                      </Button>
                    </SheetClose>
                  );
                })}
              </nav>
              <div className="mx-4 flex flex-col gap-3 border-t pt-4">
                <SheetClose asChild>
                  <Button
                    asChild
                    variant="outline"
                    className={cn(loginActive && "text-primary font-semibold")}
                  >
                    <Link href={marketingRoutes.login} aria-current={loginActive ? "page" : undefined}>
                      Masuk
                    </Link>
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button asChild>
                    <Link href={marketingRoutes.simulator}>
                      Coba Simulator
                      <ArrowUpRight aria-hidden="true" />
                    </Link>
                  </Button>
                </SheetClose>
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
