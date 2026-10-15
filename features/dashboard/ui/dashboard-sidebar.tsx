"use client";
import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/features/settings/preferences";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/shared/brand-logo";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { dashboardLinks, activeDashboardLink } from "../navigation";
import { LogoutButton } from "./logout-button";
import type { DashboardIdentity } from "./user-menu";
import { cn } from "@/lib/utils";

export function DashboardSidebar({ user, pathname, collapsed, onToggle }: { user: DashboardIdentity; pathname: string; collapsed: boolean; onToggle: () => void }) {
  const nav = useRef<HTMLElement>(null);
  const previousTop = useRef<number | null>(null);
  const reduced = useReducedMotion();
  useGSAP(() => {
    const element = nav.current;
    if (!element) return;
    const target = element.querySelector<HTMLElement>("a[aria-current=page]");
    const pill = element.querySelector("[data-sidebar-pill]");
    if (!target || !pill) return;
    gsap.fromTo(pill, { y: previousTop.current ?? target.offsetTop, height: target.offsetHeight }, { y: target.offsetTop, duration: reduced ? 0 : 0.2, ease: "power2.out", overwrite: true });
    previousTop.current = target.offsetTop;
  }, { scope: nav, dependencies: [pathname, collapsed, reduced], revertOnUpdate: true });
  return <aside data-dashboard-sidebar className="dashboard-sidebar">
    <div data-sidebar-surface className="absolute inset-0 border-r bg-surface" aria-hidden />
    <div className="relative flex h-full min-h-0 flex-col p-3">
      <Link data-shell-brand href="/dashboard" aria-label="Vircuit — Dashboard" className="mb-6 flex min-h-14 items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-primary"><BrandLogo size={collapsed ? "sm" : "default"} iconOnly={collapsed} /></Link>
      <TooltipProvider delayDuration={250}><nav ref={nav} aria-label="Navigasi dashboard" className="relative min-h-0 flex-1 space-y-1 overflow-y-auto"><span data-sidebar-pill aria-hidden className="pointer-events-none absolute inset-x-0 top-0 rounded-lg bg-primary-soft" />{dashboardLinks.map(({ href, label, icon: Icon }, index) => <Tooltip key={href}><TooltipTrigger asChild><Link href={href} aria-label={label} aria-current={activeDashboardLink(pathname, href) ? "page" : undefined} className={cn("dashboard-nav-link", activeDashboardLink(pathname, href) && "is-active", collapsed && "justify-center px-0", index === 4 && "mt-6")}><Icon data-shell-icon aria-hidden className="size-5 shrink-0" /><span data-shell-label className={collapsed ? "sr-only" : "truncate"}>{label}</span>{activeDashboardLink(pathname, href) && <span data-shell-indicator aria-hidden className="ml-auto size-1.5 shrink-0 rounded-full bg-primary" />}</Link></TooltipTrigger>{collapsed && <TooltipContent side="right">{label}</TooltipContent>}</Tooltip>)}</nav></TooltipProvider>
      <div className="mt-4 space-y-2 border-t pt-3"><Button variant="ghost" onClick={onToggle} className={cn("min-h-11 w-full gap-3", collapsed ? "px-0" : "justify-start")} aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"} aria-expanded={!collapsed}>{collapsed ? <PanelLeftOpen aria-hidden /> : <PanelLeftClose aria-hidden />}<span className={collapsed ? "sr-only" : "text-sm"}>Ciutkan sidebar</span></Button><LogoutButton user={user} iconOnly={collapsed} className={cn("min-h-11 w-full gap-3 border-transparent bg-transparent text-text-secondary hover:bg-destructive/5 hover:text-destructive", collapsed ? "px-0" : "justify-start")} /></div>
    </div>
  </aside>;
}
