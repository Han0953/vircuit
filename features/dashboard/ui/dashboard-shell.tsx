"use client";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cloudRequest } from "@/features/projects/cloud/request";
import { clearPrivateState } from "@/features/projects/local/controller";
import { PreferenceOwner, readPreferences, savePreferences, usePreferences, useReducedMotion } from "@/features/settings/preferences";
import { useAuthTransition } from "@/features/auth/motion/auth-transition";
import type { AuthEntry } from "@/features/auth/motion/transition-contract";
import { UserMenu, type DashboardIdentity } from "./user-menu";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardMobileDock } from "./dashboard-mobile-dock";
import { dashboardLinks, activeDashboardLink } from "../navigation";
import { useDashboardSwipe } from "../navigation/use-dashboard-swipe";
import { dashboardIntroTiming, headerDuration, headerItemStagger, sidebarEntryDuration, sidebarItemsStart, sidebarItemDuration, sidebarItemStagger } from "../motion/intro-timing";
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
  const pageMotionPath = useRef(pathname);
  const [sessionError, setSessionError] = useState(false);
  const [preferenceError, setPreferenceError] = useState("");
  useDashboardSwipe(main);
  useEffect(() => {
    if (!mounted) return;
    // The verified shell can enter while its independent data streams finish.
    // Resolve the real client preference before consuming a one-time entry;
    // useReducedMotion's conservative SSR snapshot is not a user preference.
    const { motion } = readPreferences(user.id);
    ready(authEntry, motion === "reduced" || (motion === "system" && window.matchMedia("(prefers-reduced-motion: reduce)").matches));
  }, [ready, authEntry, reduced, mounted, pathname, user.id]);
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
    if (reduced || window.innerWidth < 1024) { gsap.set(root.current, { "--dashboard-sidebar-width": `${width}px` }); return; }
    if (oldWidth === width) return;
    gsap.fromTo(root.current, { "--dashboard-sidebar-width": `${oldWidth}px` }, { "--dashboard-sidebar-width": `${width}px`, duration: 0.6, ease: "power3.inOut", overwrite: "auto" });
    gsap.fromTo("[data-shell-icon]", { x: collapsed ? -6 : 6 }, { x: 0, duration: 0.6, ease: "power3.inOut", clearProps: "transform", overwrite: "auto" });
    gsap.fromTo("[data-shell-brand] .brand-logo-icon", { x: collapsed ? -9.5 : 9.5 }, { x: 0, duration: 0.6, ease: "power3.inOut", clearProps: "transform", overwrite: "auto" });
    if (!collapsed) {
      // CSS owns label opacity/width; GSAP only owns its horizontal movement.
      gsap.set("[data-shell-label]", { x: -8 });
      gsap.to("[data-shell-label]", { x: 0, duration: 0.4, stagger: 0.025, delay: 0.18, clearProps: "transform", overwrite: "auto" });
    }
  }, { scope: root, dependencies: [collapsed, reduced], revertOnUpdate: true });
  useGSAP(() => {
    if (!transition.intro || reduced) return;
    const mobile = window.innerWidth < 1024;
    const items = root.current?.querySelectorAll(mobile ? "[data-dock-index]" : "[data-dashboard-sidebar] nav [data-shell-item], [data-sidebar-logout]");
    const brand = mobile ? [] : root.current?.querySelectorAll("[data-shell-brand] [data-shell-item]");
    const headerItems = root.current?.querySelectorAll("[data-dashboard-header-copy] > *, [data-dashboard-header] button");
    const { headerStart } = dashboardIntroTiming(items?.length ?? 10);
    gsap.set("[data-dashboard-sidebar]", { xPercent: -100, opacity: 1 });
    gsap.set("[data-shell-brand]", { opacity: 1 });
    if (items?.length) gsap.set(items, { opacity: 0, x: -6 });
    if (brand?.length) gsap.set(brand, { opacity: 0, x: -6 });
    gsap.set("[data-dashboard-header]", { opacity: 0 });
    if (headerItems?.length) gsap.set(headerItems, { opacity: 0, y: -12 });
    gsap.set("[data-dashboard-dock]", { opacity: 1 });
    gsap.set("[data-sidebar-pill], [data-dock-pill]", { opacity: 0 });
    const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out", clearProps: "opacity,transform" } });
    tl.to("[data-dashboard-sidebar]", { xPercent: 0, duration: sidebarEntryDuration, ease: "power2.inOut" }, 0);
    if (brand?.length) tl.to(brand, { opacity: 1, x: 0, duration: 0.72, stagger: 0.075 }, sidebarItemsStart);
    // The mobile dock is already in place; only the desktop sidebar needs to
    // finish its slide before its contents begin.
    const menuStart = (mobile ? 0.12 : sidebarItemsStart) + (brand?.length ?? 0) * sidebarItemStagger;
    if (items?.length) tl.to(items, { opacity: 1, x: 0, duration: sidebarItemDuration, stagger: sidebarItemStagger }, menuStart);
    tl.to("[data-sidebar-pill], [data-dock-pill]", { opacity: 1, duration: 0.3, clearProps: "opacity" }, menuStart);
    tl.to("[data-dashboard-header]", { opacity: 1, duration: 0.62, clearProps: "opacity" }, headerStart);
    if (headerItems?.length) tl.to(headerItems, { opacity: 1, y: 0, duration: headerDuration, stagger: headerItemStagger }, headerStart);
    // GSAP cleanup reverts its styles. Rebinding resumes the original clock
    // instead of skipping a cleaned-up timeline or replaying a completed one.
    tl.seek(Math.max(0, (performance.now() - transition.introStartedAt) / 1000), true).play();
  }, { scope: root, dependencies: [transition.intro, transition.introStartedAt, reduced], revertOnUpdate: true });
  useGSAP((context, contextSafe) => {
    if (pageMotionPath.current === pathname) return;
    pageMotionPath.current = pathname;
    if (reduced || transition.waiting) return;
    const page = root.current?.querySelector<HTMLElement>("[data-dashboard-page]");
    if (!page) return;
    let revealed = false;
    const reveal = contextSafe?.(() => {
      if (revealed || !page.querySelector("h1")) return false;
      revealed = true;
      gsap.fromTo(page, { opacity: 0.72, y: 6 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", clearProps: "opacity,transform" });
      return true;
    });
    if (reveal?.()) return;
    const observer = new MutationObserver(() => { if (reveal?.()) observer.disconnect(); });
    observer.observe(page, { subtree: true, childList: true });
    return () => observer.disconnect();
  }, { scope: root, dependencies: [pathname, reduced], revertOnUpdate: true });
  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    main.current?.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true });
  }, [pathname]);
  const pageLabel = dashboardLinks.find((item) => activeDashboardLink(pathname, item.href))?.label ?? "Dashboard";
  function toggleSidebar() {
    if (root.current) previousWidth.current = parseFloat(getComputedStyle(root.current).getPropertyValue("--dashboard-sidebar-width"));
    try { savePreferences(user.id, { ...preferences, dashboardSidebar: collapsed ? "expanded" : "collapsed" }); setPreferenceError(""); }
    catch { setPreferenceError("Preferensi belum dapat disimpan di browser ini."); }
  }
  return <div ref={root} data-dashboard-shell data-login-intro={transition.intro || undefined} data-intro-pending={transition.waiting || (!!authEntry && transition.handledEntry !== authEntry.id)} data-sidebar={collapsed ? "collapsed" : "expanded"} data-density={preferences.density} data-motion-preference={preferences.motion} data-reading={preferences.reading} className="dashboard-root min-h-dvh bg-background no-scrollbar" style={{ "--dashboard-sidebar-width": collapsed ? "80px" : "256px" } as CSSProperties}>
    <noscript><style>{".dashboard-root[data-intro-pending=true] :is([data-dashboard-sidebar],[data-shell-brand],[data-shell-item],[data-dashboard-header],[data-dashboard-dock],[data-motion]){opacity:1!important}"}</style></noscript>
    <a href="#dashboard-main" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-60 focus:rounded-md focus:bg-primary focus:p-3 focus:text-primary-foreground">Lewati ke konten utama</a>
    <DashboardSidebar user={user} pathname={pathname} collapsed={collapsed} onToggle={toggleSidebar} />
    <header data-dashboard-header className="dashboard-header"><div data-dashboard-header-copy className="min-w-0"><p className="text-xs text-text-tertiary">Ruang belajar Vircuit</p><h2 className="truncate text-sm font-semibold">{pageLabel}</h2></div><UserMenu user={user} /></header>
    <div data-dashboard-column className="dashboard-column min-w-0">
      <main ref={main} id="dashboard-main" tabIndex={-1} className="dashboard-main relative mx-auto max-w-7xl space-y-8 px-4 pt-24 outline-none sm:px-6 lg:px-8">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-44 opacity-25 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        {sessionError && <p role="alert" className="relative rounded-lg border border-destructive/30 p-3 text-sm">Sesi belum dapat diperiksa secara daring. <button className="underline" onClick={() => window.location.reload()}>Coba lagi</button></p>}
        {preferenceError && <p role="status" className="relative text-sm">{preferenceError}</p>}
        <div data-dashboard-page className="relative space-y-8">{children}</div>
      </main>
    </div>
    <DashboardMobileDock user={user} />
  </div>;
}
