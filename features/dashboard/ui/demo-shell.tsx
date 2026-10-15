"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircuitBoard } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { PreferenceOwner } from "@/features/settings/preferences";
import { useAuthTransition } from "@/features/auth/motion/auth-transition";
import type { AuthEntry } from "@/features/auth/motion/transition-contract";
import { useDashboardIntro } from "../motion/use-dashboard-intro";
import { activeDashboardLink, dashboardLinks, dashboardPath } from "../navigation";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardMobileDock } from "./dashboard-mobile-dock";
import { ThemePopover } from "./theme-popover";
import "./dashboard.css";

const visitor = { id: "public-demo", name: "Pengunjung", email: "" };

export function DemoShell({ children, authEntry }: { children: ReactNode; authEntry?: AuthEntry | null }) {
  const pathname = dashboardPath(usePathname());
  const root = useRef<HTMLDivElement>(null);
  const transition = useAuthTransition();
  const { ready } = transition;
  useDashboardIntro(root);
  useEffect(() => { ready(authEntry, window.matchMedia("(prefers-reduced-motion: reduce)").matches); }, [ready, authEntry, pathname]);
  const [collapsed, setCollapsed] = useState(false);
  const label = dashboardLinks.find((link) => activeDashboardLink(pathname, link.href))?.label ?? "Dashboard";
  return <PreferenceOwner.Provider value={null}>
    <div ref={root} data-dashboard-shell data-demo-shell data-login-intro={transition.intro || undefined} data-intro-pending={transition.waiting || (!!authEntry && transition.handledEntry !== authEntry.id)} data-sidebar={collapsed ? "collapsed" : "expanded"} className="dashboard-root min-h-dvh bg-background" style={{ "--dashboard-sidebar-width": collapsed ? "80px" : "256px" } as CSSProperties}>
      <noscript><style>{"[data-demo-shell] :is([data-dashboard-sidebar],[data-shell-brand],[data-shell-item],[data-dashboard-header],[data-dashboard-dock],[data-motion]){opacity:1!important}"}</style></noscript>
      <a href="#dashboard-main" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-60 focus:bg-surface focus:p-3">Lewati ke konten utama</a>
      <DashboardSidebar user={visitor} pathname={pathname} collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} demo />
      <header data-dashboard-header className="dashboard-header">
        <div data-dashboard-header-copy className="min-w-0"><p className="text-xs text-text-tertiary">Vircuit · Demo</p><h2 className="truncate text-sm font-semibold">{label}</h2></div>
        <div className="flex shrink-0 items-center gap-1.5"><Button asChild variant="outline" className="size-11 p-0 shadow-none sm:w-auto sm:px-3"><Link data-lab-link href="/simulator" aria-label="Buka Virtual Lab"><CircuitBoard aria-hidden className="size-4" /><span className="hidden sm:inline">Buka Lab</span></Link></Button><ThemePopover /><Button asChild size="sm"><Link href={`/masuk?next=${encodeURIComponent(pathname)}`}>Masuk</Link></Button></div>
      </header>
      <div className="dashboard-column min-w-0"><main id="dashboard-main" tabIndex={-1} className="dashboard-main relative mx-auto max-w-7xl px-4 pt-24 outline-none sm:px-6 lg:px-8"><div data-dashboard-page>{children}</div></main></div>
      <DashboardMobileDock user={visitor} demo />
    </div>
  </PreferenceOwner.Provider>;
}
