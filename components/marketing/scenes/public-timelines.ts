import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, validTreatment } from "./public-motion-config";
import { motionDefinition } from "./public-motion-manifest";

export function animatePublic(root: HTMLElement, route: string) {
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();
  let observer: IntersectionObserver | undefined;
  let frame = 0;
  const refresh = () => {
    if (document.documentElement.hasAttribute("data-home-moving")) window.addEventListener("home-scroll-settled", refresh, { once: true });
    else { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => ScrollTrigger.refresh()); }
  };
  media.add({ desktop: "(min-width:1024px)", reduce: "(prefers-reduced-motion:reduce)", all: "(min-width:0px)" }, (match) => {
    const reduced = !!match.conditions?.reduce;
    const desktop = !!match.conditions?.desktop;
    const groups = Array.from(root.querySelectorAll<HTMLElement>("[data-motion-group]"));
    groups.forEach((group) => {
      const definition = motionDefinition(route, group.dataset.motionGroup ?? "");
      group.dataset.motionMapped = String(definition?.treatment === group.dataset.motion);
      if (definition) group.dataset.motionDefinitionSection = definition.section;
    });
    const timelines = new Map<Element, gsap.core.Timeline>();
    const observed = new Set<HTMLElement>();
    const targets = () => Array.from(root.querySelectorAll<HTMLElement>("[data-motion-card], [data-motion-group]"))
      .filter((target) => !target.parentElement?.closest("[data-motion-card], [data-motion-group]"));
    root.dataset.motionReady = reduced ? "reduced" : "ready";
    root.dataset.motionOwner = route;
    const reveal = (target: HTMLElement, order = 0) => {
      if (target.dataset.revealed === "true") return;
      target.dataset.revealed = "true";
      const members = target.hasAttribute("data-motion-group") ? [target] : Array.from(target.querySelectorAll<HTMLElement>("[data-motion-group]"));
      const timeline = gsap.timeline({ delay: Math.floor(order / 3) * .95, defaults: { duration: motion.reveal, ease: motion.ease }, onComplete: () => { members.forEach((item) => { item.dataset.motionState = item.dataset.motion === "static" ? "static" : "complete"; }); observer?.unobserve(target); } });
      timelines.set(target, timeline);
      members.forEach((item, index) => {
        const definition = motionDefinition(route, item.dataset.motionGroup ?? "");
        item.dataset.motionMapped = String(definition?.treatment === item.dataset.motion);
        if (definition) item.dataset.motionDefinitionSection = definition.section;
        const treatment = item.dataset.motion;
        if (!validTreatment(treatment) || treatment === "static") { item.dataset.motionState = "static"; return; }
        item.dataset.motionState = "active";
        item.dataset.motionMode = members.length > 1 || item.querySelector("li, [data-motion-row], [data-part], [data-trace]") ? "sequence" : "individual";
        const hero = item.closest("[data-hero]");
        timeline.fromTo(item, { y: hero ? 4 : desktop ? motion.desktopDistance : motion.mobileDistance, opacity: hero ? 1 : .55 }, { y: 0, opacity: 1, clearProps: "transform,opacity" }, index * (desktop ? motion.desktopStagger : motion.stagger));
        const rows = item.querySelectorAll("li, [data-motion-row]");
        if (rows.length) timeline.fromTo(rows, { x: -4, opacity: .5 }, { x: 0, opacity: 1, duration: .25, stagger: motion.stagger, clearProps: "transform,opacity" }, index * motion.stagger + .1);
        if (treatment === "identity") timeline.fromTo(item.querySelectorAll("svg"), { scale: .96 }, { scale: 1, transformOrigin: "center", clearProps: "transform", duration: .25 }, index * motion.stagger);
        const storyOwned = item.hasAttribute("data-story") && matchMedia("(min-width:1024px) and (min-height:620px)").matches;
        if (treatment === "art" && !storyOwned) {
          const paths = Array.from(item.querySelectorAll<SVGPathElement>("[data-trace]"));
          paths.forEach((path) => { const length = path.getTotalLength(); timeline.fromTo(path, { strokeDasharray: length, strokeDashoffset: length }, { strokeDashoffset: 0, duration: .7, clearProps: "strokeDasharray,strokeDashoffset" }, .15); });
          timeline.fromTo(item.querySelectorAll("[data-part]"), { y: -8, opacity: .45 }, { y: 0, opacity: 1, stagger: .06, clearProps: "transform,opacity", duration: .5 }, .1);
          timeline.fromTo(item.querySelectorAll("[data-output]"), { opacity: .3 }, { opacity: 1, duration: .4, clearProps: "opacity" }, .5);
        }
      });
    };
    if (reduced) groups.forEach((group) => { group.dataset.motionState = group.dataset.motion === "static" ? "static" : "reduced"; });
    else {
      const context = gsap.context(() => {
        observer = new IntersectionObserver((entries) => {
          let visibleOrder = 0;
          gsap.context(() => entries.forEach((entry) => {
            if (entry.isIntersecting) reveal(entry.target as HTMLElement, visibleOrder++);
            else timelines.get(entry.target)?.progress(1);
          }), root);
        }, { threshold: .08 });
        targets().forEach((target) => {
          const box = target.getBoundingClientRect();
          if (box.bottom < 0) { reveal(target); timelines.get(target)?.progress(1); }
          else { observer?.observe(target); observed.add(target); }
        });
      }, root);
      const mutations = new MutationObserver(() => {
        let changed = false;
        observed.forEach((target) => { if (!root.contains(target)) { observer?.unobserve(target); timelines.get(target)?.revert(); timelines.delete(target); observed.delete(target); } });
        targets().forEach((target) => {
          if (!observed.has(target)) { observer?.observe(target); observed.add(target); changed = true; }
        });
        if (changed) refresh();
      });
      mutations.observe(root, { childList: true, subtree: true });
      const focus = (event: FocusEvent) => {
        let target = event.target instanceof Element ? event.target.closest("[data-motion-card], [data-motion-group]") : null;
        while (target && !timelines.has(target)) target = target.parentElement?.closest("[data-motion-card], [data-motion-group]") ?? null;
        if (target) timelines.get(target)?.progress(1);
      };
      root.addEventListener("focusin", focus);
      refresh();
      return () => {
        observer?.disconnect(); mutations.disconnect(); root.removeEventListener("focusin", focus);
        timelines.forEach((timeline) => timeline.revert()); context.revert();
        observed.forEach((target) => { delete target.dataset.revealed; });
      };
    }
  }, root);
  return () => {
    media.revert(); observer?.disconnect(); cancelAnimationFrame(frame);
    window.removeEventListener("home-scroll-settled", refresh);
    delete root.dataset.motionReady;
    delete root.dataset.motionOwner;
    root.querySelectorAll<HTMLElement>("[data-motion-state]").forEach((item) => { delete item.dataset.motionState; delete item.dataset.motionMode; });
  };
}
