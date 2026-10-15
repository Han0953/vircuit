"use client";
import type { RefObject } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/features/settings/preferences";
import { useAuthTransition } from "@/features/auth/motion/auth-transition";
import { dashboardIntroTiming, headerDuration, headerItemStagger, sidebarEntryDuration, sidebarItemsStart, sidebarItemDuration, sidebarItemStagger, mobileHeaderDuration } from "./intro-timing";

gsap.registerPlugin(useGSAP);
// One animation owner shared by the authenticated dashboard and public preview.
export function useDashboardIntro(root: RefObject<HTMLDivElement | null>) {
  const transition = useAuthTransition();
  const reduced = useReducedMotion();
  useGSAP(() => {
    if (!transition.intro || reduced) return;
    const mobile = window.innerWidth < 1024;
    if (mobile) {
      // Mobile has no sliding sidebar. Read top-to-bottom: compact header,
      // capsule surface, then individual navigation items and page content.
      const headerItems = root.current?.querySelectorAll("[data-dashboard-header-copy] > *, [data-dashboard-header] button, [data-dashboard-header] a");
      const dockItems = root.current?.querySelectorAll("[data-dock-index]");
      const tl = gsap.timeline({ paused: true, defaults: { ease: "power2.out", clearProps: "opacity,transform" } });
      gsap.set("[data-dashboard-header]", { opacity: 1 });
      if (headerItems?.length) {
        gsap.set(headerItems, { opacity: 0, y: 6 });
        tl.to(headerItems, { opacity: 1, y: 0, duration: mobileHeaderDuration, stagger: 0.055 }, 0);
      }
      gsap.set("[data-dashboard-dock]", { opacity: 0, y: 10 });
      tl.to("[data-dashboard-dock]", { opacity: 1, y: 0, duration: 0.34 }, 0.12);
      if (dockItems?.length) {
        gsap.set(dockItems, { opacity: 0, y: 5 });
        tl.to(dockItems, { opacity: 1, y: 0, duration: 0.38, stagger: 0.06 }, 0.24);
      }
      gsap.set("[data-dock-pill]", { opacity: 0 });
      tl.to("[data-dock-pill]", { opacity: 1, duration: 0.25, clearProps: "opacity" }, 0.24);
      tl.seek(Math.max(0, (performance.now() - transition.introStartedAt) / 1000), true).play();
      return;
    }
    const items = root.current?.querySelectorAll(mobile ? "[data-dock-index]" : "[data-dashboard-sidebar] nav [data-shell-item], [data-sidebar-logout]");
    const brand = mobile ? [] : root.current?.querySelectorAll("[data-shell-brand] [data-shell-item]");
    const headerItems = root.current?.querySelectorAll("[data-dashboard-header-copy] > *, [data-dashboard-header] button, [data-dashboard-header] a");
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
}
