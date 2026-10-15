"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { MarketingThemeToggle } from "./marketing-theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { isActiveRoute, marketingRoutes, primaryNavigation } from "./marketing-routes";
import { scrolledHeader } from "./scenes/scroll-policy";
import styles from "./home-controls.module.css";

function MenuLines({ open }: { open: boolean }) {
  return <span aria-hidden="true" className={styles.menuLines} data-open={open}><span /><span /><span /></span>;
}

export function PublicNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const header = useRef<HTMLElement>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const loginActive = isActiveRoute(pathname, marketingRoutes.login);

  useEffect(() => {
    if (menuOpen) {
      primaryNavigation.forEach(({ href }) => {
        router.prefetch(href);
      });
      router.prefetch(marketingRoutes.login);
      router.prefetch(marketingRoutes.simulator);
    }
  }, [menuOpen, router]);

  useEffect(() => {
    if (!header.current) return;
    const element = header.current;
    const measure = () => document.documentElement.style.setProperty("--home-header-height", `${element.offsetHeight}px`);
    const update = () => setScrolled((previous) => scrolledHeader(previous, scrollY));
    const observer = new ResizeObserver(measure);
    observer.observe(element); measure();
    const frame = requestAnimationFrame(update);
    window.addEventListener("scroll", update, { passive: true });
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("scroll", update); document.documentElement.style.removeProperty("--home-header-height"); };
  }, []);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setMenuOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <header ref={header} data-home-header="" data-scrolled={scrolled} data-menu-open={menuOpen} data-route={pathname} className={styles.header}>
      <a
        data-motion-group="nav.skip" data-motion="control"
        href="#main-content"
        className="sr-only z-(--z-tooltip) rounded-md bg-primary p-4 text-primary-foreground focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
      >
        Lewati ke konten utama
      </a>
      <div className={cn("mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-8 lg:gap-6", styles.headerInner)}>
        <Link
          href={marketingRoutes.home}
          aria-label="Vircuit — Beranda"
          data-motion-group="nav.logo" data-motion="control" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-sm text-xl font-bold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <BrandLogo size="sm" />
        </Link>

        <nav aria-label="Navigasi utama" className={cn("hidden items-center gap-1 lg:flex", styles.desktopNav)}>
          {primaryNavigation.map(({ label, href }) => {
            const active = isActiveRoute(pathname, href);
            return (
              <Button
                key={href}
                asChild
                variant="ghost"
                data-motion-group={`nav.${href}`} data-motion="control" className={cn(active ? "text-primary font-semibold" : "text-text-secondary hover:text-foreground")}
              >
                <Link href={href} aria-current={active ? "page" : undefined}>
                  {label}
                </Link>
              </Button>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <span data-motion-group="nav.theme" data-motion="control"><MarketingThemeToggle /></span>
          <Button data-motion-group="nav.login" data-motion="control" asChild variant="ghost" className={cn(loginActive && "text-primary font-semibold")}>
            <Link href={marketingRoutes.login} aria-current={loginActive ? "page" : undefined}>
              Masuk
            </Link>
          </Button>
          <Button data-motion-group="nav.simulator" data-motion="control" asChild>
            <Link href={marketingRoutes.simulator}>
              Buka Virtual Lab
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <span data-motion-group="nav.theme" data-motion="control"><MarketingThemeToggle /></span>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button ref={menuTrigger} data-motion-group="nav.menu" data-motion="control" className={styles.menuButton} variant="outline" size="icon" aria-label="Buka menu navigasi">
                <MenuLines open={menuOpen} />
              </Button>
            </SheetTrigger>
            <SheetContent data-motion-group="nav.sheet" data-motion="control" className={styles.mobileMenu} showCloseButton={false} onCloseAutoFocus={(event) => {
              event.preventDefault();
              menuTrigger.current?.focus({ preventScroll: true });
            }}>
              <SheetClose asChild><Button variant="ghost" size="icon" className={styles.menuClose} aria-label="Tutup"><MenuLines open={menuOpen} /></Button></SheetClose>
              <div data-mobile-menu-header className={styles.mobileMenuHeader}>
                <SheetTitle className="sr-only">Navigasi Vircuit</SheetTitle>
                <SheetDescription className="sr-only">Pilih halaman yang ingin dibuka.</SheetDescription>
              </div>
              <nav aria-label="Navigasi mobile" className={styles.mobileLinks}>
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
                        <Link
                          href={href}
                          aria-current={active ? "page" : undefined}
                          onClick={() => setMenuOpen(false)}
                        >
                          {label}
                        </Link>
                      </Button>
                    </SheetClose>
                  );
                })}
              </nav>
              <div className="mx-4 flex flex-col gap-3 border-t pt-4">
                <SheetClose asChild><Button asChild><Link href={marketingRoutes.simulator} onClick={() => setMenuOpen(false)}>Buka Virtual Lab<ArrowUpRight aria-hidden="true" /></Link></Button></SheetClose>
                <SheetClose asChild>
                  <Button
                    asChild
                    variant="outline"
                    className={cn(loginActive && "text-primary font-semibold")}
                  >
                    <Link
                      href={marketingRoutes.login}
                      aria-current={loginActive ? "page" : undefined}
                      onClick={() => setMenuOpen(false)}
                    >
                      Masuk
                    </Link>
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
