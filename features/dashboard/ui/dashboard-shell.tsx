"use client";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cloudRequest } from "@/features/projects/cloud/request";
import { clearPrivateState } from "@/features/projects/local/controller";
import { PreferenceOwner, savePreferences, usePreferences, useReducedMotion } from "@/features/settings/preferences";
import { useAuthTransition } from "@/features/auth/motion/auth-transition";
import type { AuthEntry } from "@/features/auth/motion/transition-contract";
import { UserMenu, type DashboardIdentity } from "./user-menu";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardMobileDock } from "./dashboard-mobile-dock";
import { dashboardLinks, activeDashboardLink } from "../navigation";
import { useDashboardSwipe } from "../navigation/use-dashboard-swipe";
import "./dashboard.css";

gsap.registerPlugin(useGSAP);
const subscribeMount = () => () => {};
export function DashboardShell(props: { user: DashboardIdentity; children: ReactNode; initialSidebar?: "expanded" | "collapsed"; authEntry?: AuthEntry | null }) {
  return <PreferenceOwner.Provider value={props.user.id}><DashboardSurface {...props} /></PreferenceOwner.Provider>;
}
function DashboardSurface({ user, children, initialSidebar = "expanded", authEntry }: { user: DashboardIdentity; children: ReactNode; initialSidebar?: "expanded" | "collapsed"; authEntry?: AuthEntry | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const preferences = usePreferences(user.id);
  const reduced = useReducedMotion();
  const mounted = useSyncExternalStore(subscribeMount, () => true, () => false);
  const collapsed = (mounted ? preferences.dashboardSidebar : initialSidebar) === "collapsed";
  const transition = useAuthTransition();
  const { ready } = transition;
  const root = useRef<HTMLDivElement>(null);
  const main = useRef<HTMLElement>(null);
  const previousWidth = useRef(initialSidebar === "collapsed" ? 80 : 256);
  const previousPath = useRef(pathname);
  const lastIntro = useRef("");
  const [sessionError, setSessionError] = useState(false);
  const [preferenceError, setPreferenceError] = useState("");
  useDashboardSwipe(main);
  useEffect(() => { ready(authEntry, reduced); }, [ready, authEntry, reduced]);
  useEffect(() => {
    let alive = true;
    let leaving = false;
    async function check() {
      try {
        const value = await cloudRequest("/api/auth/session");
        if (!alive || leaving) return;
        if (!value || typeof value !== "object" || !("user" in value)) throw new Error("Invalid session");
        const current = value.user;
        if (!current || typeof current !== "object" || !("id" in current) || current.id !== user.id) {
          clearPrivateState(user.id); window.location.replace("/dashboard");
        } else { setSessionError(false); router.refresh(); }
      } catch { if (alive && !leaving) setSessionError(true); }
    }
    const channel = new BroadcastChannel("vircuit-auth");
    channel.onmessage = (event: MessageEvent<unknown>) => {
      const message = event.data;
      if (message && typeof message === "object" && "type" in message && message.type === "account-deleted" && "owner" in message && message.owner === user.id) {
        leaving = true; clearPrivateState(user.id); window.location.replace("/masuk?account=deleted");
      } else void check();
    };
    const focus = () => { void check(); };
    window.addEventListener("focus", focus);
    return () => { alive = false; channel.close(); window.removeEventListener("focus", focus); };
  }, [user.id, router]);
  useEffect(() => {
    document.documentElement.classList.add("no-scrollbar"); document.body.classList.add("no-scrollbar");
    return () => { document.documentElement.classList.remove("no-scrollbar"); document.body.classList.remove("no-scrollbar"); };
  }, []);
  useGSAP(() => {
    const width = collapsed ? 80 : 256;
    const oldWidth = previousWidth.current;
    previousWidth.current = width;
    if (reduced || oldWidth === width || window.innerWidth < 1024) return;
    const tl = gsap.timeline({ defaults: { duration: 0.24, ease: "power2.out", clearProps: "transform,opacity" } });
    tl.fromTo("[data-sidebar-surface]", { scaleX: oldWidth / width, transformOrigin: "left" }, { scaleX: 1 }, 0);
    tl.fromTo("[data-dashboard-column], [data-dashboard-header]", { x: oldWidth - width }, { x: 0 }, 0);
    if (!collapsed) tl.fromTo("[data-shell-label]", { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: 0.14, stagger: 0.015 }, 0.08);
  }, { scope: root, dependencies: [collapsed, reduced], revertOnUpdate: true });
  useGSAP(() => {
    if (!transition.intro || lastIntro.current === transition.intro || reduced) return;
    lastIntro.current = transition.intro;
    const tl = gsap.timeline({ defaults: { ease: "power2.out", duration: 0.24, clearProps: "opacity,transform" } });
    const groups = ["[data-dashboard-sidebar]", "[data-shell-brand]", "[data-shell-icon]", "[data-shell-label]:not(.sr-only)", "[data-shell-indicator]", "[data-dashboard-header]", "[data-dashboard-header] button", "[data-dashboard-dock]"];
    groups.forEach((selector, index) => {
      const elements = root.current?.querySelectorAll(selector);
      if (elements?.length) tl.fromTo(elements, { opacity: 0.7, y: index === 0 ? 0 : 5 }, { opacity: 1, y: 0, stagger: 0.025 }, index * 0.035);
    });
  }, { scope: root, dependencies: [transition.intro, reduced], revertOnUpdate: true });
  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    main.current?.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true });
  }, [pathname]);
  const pageLabel = dashboardLinks.find((item) => activeDashboardLink(pathname, item.href))?.label ?? "Dashboard";
  function toggleSidebar() {
    try { savePreferences(user.id, { ...preferences, dashboardSidebar: collapsed ? "expanded" : "collapsed" }); setPreferenceError(""); }
    catch { setPreferenceError("Preferensi belum dapat disimpan di browser ini."); }
  }
  return <div ref={root} data-dashboard-shell data-intro-pending={!!authEntry && !transition.intro} data-sidebar={collapsed ? "collapsed" : "expanded"} data-density={preferences.density} data-motion-preference={preferences.motion} data-reading={preferences.reading} className="dashboard-root min-h-dvh bg-background no-scrollbar" style={{ "--dashboard-sidebar-width": collapsed ? "80px" : "256px" } as CSSProperties}>
    <a href="#dashboard-main" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-60 focus:rounded-md focus:bg-primary focus:p-3 focus:text-primary-foreground">Lewati ke konten utama</a>
    <DashboardSidebar user={user} pathname={pathname} collapsed={collapsed} onToggle={toggleSidebar} />
    <header data-dashboard-header className="dashboard-header"><div className="min-w-0"><p className="text-xs text-text-tertiary">Ruang belajar Vircuit</p><h2 className="truncate text-sm font-semibold">{pageLabel}</h2></div><UserMenu user={user} /></header>
    <div data-dashboard-column className="dashboard-column min-w-0">
      <main ref={main} id="dashboard-main" tabIndex={-1} className="dashboard-main relative mx-auto max-w-7xl space-y-8 px-4 pt-24 outline-none sm:px-6 lg:px-8">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-44 opacity-25 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        {sessionError && <p role="alert" className="relative rounded-lg border border-destructive/30 p-3 text-sm">Sesi belum dapat diperiksa secara daring. <button className="underline" onClick={() => window.location.reload()}>Coba lagi</button></p>}
        {preferenceError && <p role="status" className="relative text-sm">{preferenceError}</p>}
        <div className="relative space-y-8">{children}</div>
      </main>
    </div>
    <DashboardMobileDock user={user} />
  </div>;
}
