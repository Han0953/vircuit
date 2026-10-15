"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ellipsis } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { dashboardLinks, activeDashboardLink } from "../navigation";
import { useReducedMotion } from "@/features/settings/preferences";
import { LogoutButton } from "./logout-button";
import type { DashboardIdentity } from "./user-menu";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);
export function DashboardMobileDock({ user }: { user: DashboardIdentity }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const root = useRef<HTMLElement>(null);
  const previousPill = useRef<{ x: number; width: number } | null>(null);
  const reduced = useReducedMotion();
  const previous = useRef(pathname);
  useEffect(() => {
    if (previous.current !== pathname) { previous.current = pathname; setOpen(false); }
  }, [pathname]);
  useEffect(() => {
    let frame = 0;
    const viewport = window.visualViewport;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const editable = document.activeElement?.matches("input,textarea,select,[contenteditable=true]") ?? false;
        const keyboard = editable && !!viewport && viewport.scale === 1 && window.innerHeight - viewport.height > 120;
        const modal = !!document.querySelector('[role="dialog"][data-state="open"]');
        setHidden(editable || keyboard || (modal && !open));
      });
    };
    const observer = new MutationObserver(update);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-state"] });
    document.addEventListener("focusin", update); document.addEventListener("focusout", update); viewport?.addEventListener("resize", update); update();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); document.removeEventListener("focusin", update); document.removeEventListener("focusout", update); viewport?.removeEventListener("resize", update); };
  }, [open]);
  const main = dashboardLinks.slice(0, 4);
  const moreActive = dashboardLinks.slice(4).some((link) => activeDashboardLink(pathname, link.href));
  const activeIndex = moreActive || open ? 4 : main.findIndex((link) => activeDashboardLink(pathname, link.href));
  useGSAP(() => {
    const element = root.current;
    if (!element) return;
    const pill = element.querySelector("[data-dock-pill]");
    const target = element.querySelector<HTMLElement>(`[data-dock-index='${activeIndex}']`);
    if (!pill || !target) return;
    const position = () => { gsap.to(pill, { x: target.offsetLeft, width: target.offsetWidth, opacity: 1, duration: reduced ? 0 : 0.22, ease: "power3.out", overwrite: true }); previousPill.current = { x: target.offsetLeft, width: target.offsetWidth }; };
    gsap.set(pill, previousPill.current ?? { x: target.offsetLeft, width: target.offsetWidth });
    const observer = new ResizeObserver(position);
    observer.observe(element); position();
    return () => observer.disconnect();
  }, { scope: root, dependencies: [activeIndex, reduced, hidden], revertOnUpdate: true });
  return <Sheet open={open} onOpenChange={setOpen}>
    <nav ref={root} data-dashboard-dock aria-label="Navigasi utama mobile" hidden={hidden} className="dashboard-dock">
      <span data-dock-pill aria-hidden className="absolute inset-y-1.5 left-0 rounded-full bg-primary-soft" />
      {main.map(({ href, label, icon: Icon }, index) => <Link key={href} href={href} prefetch={href !== "/simulator" ? true : undefined} data-dock-index={index} aria-label={label} aria-current={activeDashboardLink(pathname, href) ? "page" : undefined} className={cn("dashboard-dock-item", activeIndex === index && "text-primary")}><Icon aria-hidden className="size-5" /><span>{index === 2 ? "Lab" : index === 3 ? "Proyek" : label}</span></Link>)}
      <SheetTrigger data-dock-index={4} className={cn("dashboard-dock-item", activeIndex === 4 && "text-primary")} aria-label="Lainnya" aria-current={moreActive ? "page" : undefined}><Ellipsis aria-hidden className="size-5" /><span>Lainnya</span></SheetTrigger>
    </nav>
    <SheetContent side="bottom" className="dashboard-more max-h-[85dvh] overflow-y-auto rounded-t-3xl px-5 pt-6 pb-[max(24px,env(safe-area-inset-bottom))]" onCloseAutoFocus={(event) => { if (previous.current !== pathname) event.preventDefault(); }}>
      <SheetHeader className="px-0"><SheetTitle>Ruang belajarmu</SheetTitle><SheetDescription>Pilih tujuan atau kelola akunmu.</SheetDescription></SheetHeader>
      <nav aria-label="Navigasi lainnya" className="mt-3 space-y-1">{dashboardLinks.slice(4).map(({ href, label, icon: Icon }) => <Link key={href} href={href} prefetch={href !== "/simulator" ? true : undefined} onClick={() => setOpen(false)} aria-current={activeDashboardLink(pathname, href) ? "page" : undefined} className={cn("dashboard-nav-link", activeDashboardLink(pathname, href) && "is-active")}><Icon aria-hidden className="size-5" />{label}</Link>)}</nav>
      <div className="mt-4 border-t pt-4"><p className="truncate text-sm font-medium">{user.name}</p><p className="mt-1 truncate text-xs text-text-secondary">{user.email}</p><LogoutButton user={user} className="mt-4 min-h-11 w-full justify-start" /></div>
    </SheetContent>
  </Sheet>;
}
