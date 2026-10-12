import gsap from "gsap";
import { requestSceneRefresh } from "../scenes/scene-refresh";

// Called inside the existing GSAP matchMedia/context. That owner also reverts
// these timelines, including breakpoint changes and client route navigation.
export function addBackgroundMotion(timeline: gsap.core.Timeline, backdrop: Element | null, desktop: boolean) {
  if (!backdrop) return;
  const paths = backdrop.querySelectorAll("[data-bg-path]");
  const nodes = backdrop.querySelector("[data-bg-nodes]");
  if (paths.length) timeline.fromTo(paths, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1, ease: "none", stagger: .08 }, 0);
  if (nodes) timeline.fromTo(nodes, { opacity: .2 }, { opacity: 1, duration: .7, ease: "none" }, .3);
  // Avoid compositing an entire tall section's illumination on small screens.
  if (desktop) timeline.fromTo(backdrop.querySelector("[data-bg-drift]"), { y: -20 }, { y: 20, duration: 1.5, ease: "none" }, 0);
  timeline.fromTo(backdrop.querySelector("[data-bg-sweep]"), { xPercent: desktop ? -70 : -16, opacity: 0 }, { xPercent: desktop ? 70 : 16, opacity: .65, duration: 1.5, ease: "none" }, 0);
}

export function animateMarketingBackgrounds(root: HTMLElement, desktop: boolean) {
  const context = gsap.context(() => {}, root);
  let disposed = false;
  let cancelRefresh: (() => void) | undefined;
  const observer = new IntersectionObserver((entries) => {
    if (disposed) return;
    context.add(() => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const backdrop = entry.target as HTMLElement;
        observer.unobserve(backdrop);
        addBackgroundMotion(gsap.timeline({ scrollTrigger: {
          id: `background:${backdrop.dataset.marketingBackground}`,
          trigger: backdrop.parentElement!, start: "top 95%", end: "bottom 15%", scrub: .35,
        } }), backdrop, desktop);
      }
    });
    if (entries.some((entry) => entry.isIntersecting)) {
      cancelRefresh?.();
      cancelRefresh = requestSceneRefresh();
    }
  }, { rootMargin: "300px" });
  root.querySelectorAll<HTMLElement>("[data-marketing-background][data-bg-motion='scroll']").forEach((backdrop) => observer.observe(backdrop));
  return () => { disposed = true; observer.disconnect(); cancelRefresh?.(); context.revert(); };
}
