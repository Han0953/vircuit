"use client";
import { createContext, useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { createCinematicChannel, sampleCinematic, type CinematicZone } from "./homepage-cinematic-config";
import { collectHomeTargets, homeMotion } from "./homepage-motion-manifest";
import type { CinematicWorldProps } from "./three/cinematic-world";
import { WorldBoundary } from "./three/world-boundary";
import styles from "../homepage.module.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);
export const StoryRendererPermission = createContext(true);
type Owner = CinematicZone | "story" | "none";

function setSlotRenderer(slot: HTMLElement | null, renderer: "svg" | "webgl", portal?: HTMLElement | null) {
  if (!slot) return;
  slot.dataset.renderer = renderer;
  const opacity = slot.dataset.presence ?? "1";
  const fallback = slot.querySelector<HTMLElement>("[data-cinematic-fallback]");
  if (fallback) fallback.style.opacity = renderer === "webgl" ? "0" : opacity;
  if (renderer === "webgl" && portal) portal.style.opacity = opacity;
}

export function HomepageExperience({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [channel] = useState(createCinematicChannel);
  const [owner, setOwner] = useState<Owner>("none");
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  const [Renderer, setRenderer] = useState<ComponentType<CinematicWorldProps> | null>(null);
  const failed = useRef(false);
  const currentSlot = useRef<HTMLElement | null>(null);
  const activeOwner = useRef<Owner>("none");
  const ready = useCallback(() => {
    if (!failed.current && activeOwner.current === "boards" && currentSlot.current?.dataset.cinematicSlot === "boards" && !document.hidden && !matchMedia("(prefers-reduced-motion: reduce)").matches) setSlotRenderer(currentSlot.current, "webgl", portal);
  }, [portal]);
  const fail = useCallback(() => {
    failed.current = true;
    root.current?.querySelectorAll<HTMLElement>("[data-cinematic-slot]").forEach((slot) => { slot.dataset.webglFailed = "true"; });
    setSlotRenderer(currentSlot.current, "svg");
    setRenderer(null);
  }, []);

  useEffect(() => {
    const element = document.createElement("div");
    element.className = `${styles.cinematicCanvas} component-art`;
    element.setAttribute("aria-hidden", "true");
    const frame = requestAnimationFrame(() => setPortal(element));
    return () => { cancelAnimationFrame(frame); element.remove(); };
  }, []);

  useGSAP(() => {
    const page = root.current;
    if (!page) return;
    const media = gsap.matchMedia();
    const targets = collectHomeTargets(page);
    targets.forEach(({ element, id, treatment }) => { element.dataset.homeTarget = id; element.dataset.homeTreatment = treatment; });
    page.dataset.motionTargets = String(targets.length);
    media.add({ all: "(min-width: 0px)", reduced: "(prefers-reduced-motion: reduce)", desktop: "(min-width: 1024px)", tall: "(min-height: 700px)" }, (context) => {
      const { reduced, desktop, tall } = context.conditions!;
      page.dataset.homeMotion = reduced ? "reduced" : "full";
      page.dataset.boardsSticky = !reduced && tall ? "true" : "false";
      page.dataset.webglPreferred = String(!reduced && "WebGL2RenderingContext" in window);
      let entrances: IntersectionObserver | undefined;
      const tones = Array.from(page.querySelectorAll<HTMLElement>("[data-home-zone]")).map((section) => {
        const tone = document.createElement("span");
        tone.className = styles.toneLayer; tone.setAttribute("data-home-tone", ""); tone.setAttribute("aria-hidden", "true"); section.prepend(tone);
        return { section, tone };
      });
      if (!reduced) {
        const entranceTargets = targets.filter(({ treatment }) => treatment !== "scene" && treatment !== "disclosure");
        const byElement = new Map(entranceTargets.map((target) => [target.element, target]));
        const revealParts = entranceTargets.flatMap(({ element, treatment }) => {
          const inner = treatment === "sequence" ? Array.from(element.querySelectorAll("h3,p,a,svg,span,strong")).filter((child) => !child.querySelector("h3,p,a,svg,span,strong")) : [];
          const parts = inner.length ? inner : [element];
          parts.forEach((part, index) => {
            part.setAttribute("data-home-reveal", "");
            (part as HTMLElement | SVGElement).style.setProperty("--home-reveal-delay", `${index * (desktop ? homeMotion.stagger : homeMotion.mobileStagger)}s`);
          });
          return parts;
        });
        page.style.setProperty("--home-reveal-duration", `${homeMotion.entrance}s`);
        page.style.setProperty("--home-reveal-travel", `${desktop ? homeMotion.desktopTravel : homeMotion.mobileTravel}px`);
        // One observer, not a ScrollTrigger for every paragraph. Fast jumps only animate
        // the actual destination; skipped content remains fully visible by default.
        entrances = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const target = byElement.get(entry.target as HTMLElement);
            if (target) target.element.dataset.homePlayed = "true";
            entrances?.unobserve(entry.target);
          }
        }, { rootMargin: "0px 0px -24px 0px" });
        entranceTargets.forEach(({ element }) => entrances?.observe(element));
        tones.forEach(({ section, tone }) => {
          gsap.fromTo(tone, { opacity: 0 }, { opacity: 1, ease: "none", scrollTrigger: { trigger: section, start: "top 95%", end: "top 25%", scrub: .15 } });
        });
        context.add(() => () => {
          revealParts.forEach((part) => { part.removeAttribute("data-home-reveal"); (part as HTMLElement | SVGElement).style.removeProperty("--home-reveal-delay"); });
          entranceTargets.forEach(({ element }) => { delete element.dataset.homePlayed; });
        });
      }
      const slots = Array.from(page.querySelectorAll<HTMLElement>("[data-cinematic-slot]"));
      const story = page.querySelector<HTMLElement>("[data-stage]");
      let disposed = false;
      let loading = false;
      let engaged = window.scrollY > 2;
      let raf = 0;
      let swap = 0;
      let loadTimeout = 0;
      const release = () => {
        setSlotRenderer(currentSlot.current, "svg");
      };
      const select = (next: Owner) => {
        if (next === activeOwner.current) return;
        const previous = activeOwner.current;
        activeOwner.current = next;
        cancelAnimationFrame(swap);
        if (previous !== "none" && previous !== "story" && next !== "none" && next !== "story") {
          release(); setOwner(next); return;
        }
        // A blank ownership commit disposes the old Canvas before another renderer mounts.
        release(); setOwner("none");
        swap = requestAnimationFrame(() => { if (!disposed) setOwner(next); });
      };
      const update = () => {
        raf = 0;
        if (disposed) return;
        const height = window.innerHeight;
        const header = document.querySelector<HTMLElement>("[data-home-header]")?.offsetHeight ?? 80;
        const storyBox = story?.getBoundingClientRect();
        let next: Owner = "none";
        let best = 0;
        // Batch geometry reads before dataset/style writes to avoid layout thrashing on scroll.
        const measurements = slots.map((slot) => {
          const box = slot.getBoundingClientRect();
          const zone = slot.dataset.cinematicSlot as CinematicZone;
          const container = zone === "boards" ? slot.closest<HTMLElement>("[data-board-showcase]")! : slot.closest<HTMLElement>("[data-home-zone]")!;
          const region = container.getBoundingClientRect();
          const stage = container.querySelector<HTMLElement>("[data-board-stage]");
          return { slot, box, zone, container, region, stageHeight: stage?.offsetHeight ?? box.height };
        });
        for (const { slot, box, zone, container, region, stageHeight } of measurements) {
          const visible = Math.max(0, Math.min(height, box.bottom) - Math.max(header, box.top));
          const progress = Math.max(0, Math.min(1, zone === "boards" && tall && !reduced
            ? (header + 16 - region.top) / Math.max(1, region.height - stageHeight)
            : (height * .8 - region.top) / Math.max(1, region.height + height * .4)));
          const pose = sampleCinematic({ zone, progress, mobile: !desktop });
          slot.dataset.progress = progress.toFixed(3);
          slot.dataset.activeBoard = pose.board;
          const opacity = String(zone === "boards" && tall && !reduced ? pose.presence : 1);
          slot.dataset.presence = opacity;
          const fallback = slot.querySelector<HTMLElement>("[data-cinematic-fallback]");
          if (fallback) fallback.style.opacity = slot.dataset.renderer === "webgl" ? "0" : opacity;
          if (slot.dataset.renderer === "webgl" && portal) portal.style.opacity = opacity;
          if (zone === "boards") {
            container.dataset.activeBoard = pose.board;
            const counter = container.querySelector("[data-board-counter]");
            const count = `0${pose.index + 1} — 03`;
            if (counter && counter.textContent !== count) counter.textContent = count;
            const name = container.querySelector("[data-board-name]");
            const label = reduced || !tall ? "Uno · Nano · ESP32" : ({ uno: "Arduino Uno R3", nano: "Arduino Nano · visual saja", esp32: "ESP32 · subset edukatif" })[pose.board];
            if (name && name.textContent !== label) name.textContent = label;
          }
          if (fallback && !reduced && visible > 0) fallback.style.transform = `translate(${pose.position[0] * 8}px, ${-pose.position[1] * 12}px) rotate(${pose.rotation[1] * 12}deg)`;
          if (visible > best && visible >= Math.min(160, box.height * .5)) { best = visible; next = zone; }
          if (zone === activeOwner.current) channel.publish({ zone, progress, mobile: !desktop });
        }
        if (storyBox && storyBox.top < height * .85 && storyBox.bottom > header + 16) next = "story";
        if (!engaged || reduced || document.hidden || !("WebGL2RenderingContext" in window)) next = "none";
        select(next);
        // Warm the module on approach, but mount only the single permitted Canvas.
        // No fixed delay or unbounded idle wait once the user reaches the board.
        if (engaged && !reduced && !document.hidden && "WebGL2RenderingContext" in window && !loading && !failed.current && measurements.some(({ region }) => region.top < height + 600 && region.bottom > 0)) {
          loading = true;
          loadTimeout = window.setTimeout(() => { if (!disposed) fail(); }, 15000);
          void import("./three/cinematic-world").then(({ default: World }) => { if (!disposed && !failed.current) setRenderer(() => World); }).catch(() => { if (!disposed) fail(); }).finally(() => clearTimeout(loadTimeout));
        }
      };
      const schedule = () => { if (!disposed && !raf) raf = requestAnimationFrame(update); };
      const scroll = () => { engaged = true; schedule(); };
      window.addEventListener("scroll", scroll, { passive: true });
      window.addEventListener("resize", schedule);
      document.addEventListener("visibilitychange", schedule);
      ScrollTrigger.addEventListener("refresh", schedule);
      const resize = new ResizeObserver(schedule); resize.observe(page);
      // Defer decorative 3D until the first paint; initial headline and CTA remain SSR content.
      const initial = requestAnimationFrame(() => { raf = requestAnimationFrame(update); });
      return () => {
        disposed = true; cancelAnimationFrame(initial); cancelAnimationFrame(raf); cancelAnimationFrame(swap);
        clearTimeout(loadTimeout);
        entrances?.disconnect();
        tones.forEach(({ tone }) => tone.remove());
        window.removeEventListener("scroll", scroll); window.removeEventListener("resize", schedule);
        document.removeEventListener("visibilitychange", schedule); ScrollTrigger.removeEventListener("refresh", schedule); resize.disconnect();
        release();
        activeOwner.current = "none";
        setOwner("none");
        slots.forEach((slot) => { const fallback = slot.querySelector<HTMLElement>("[data-cinematic-fallback]"); if (fallback) fallback.style.removeProperty("transform"); });
      };
    });
    return () => media.revert();
  }, { scope: root, dependencies: [channel, fail, portal], revertOnUpdate: true });

  const cinematic = owner !== "none" && owner !== "story";
  useLayoutEffect(() => {
    if (!portal || !root.current) return;
    setSlotRenderer(currentSlot.current, "svg");
    const slot = cinematic ? root.current.querySelector<HTMLElement>(`[data-cinematic-slot="${owner}"]`) : null;
    currentSlot.current = slot;
    if (!slot) { portal.remove(); return; }
    slot.appendChild(portal);
    channel.publish({ zone: owner as CinematicZone, progress: Number(slot.dataset.progress ?? 0), mobile: window.innerWidth < 1024 });
    return () => setSlotRenderer(slot, "svg");
  }, [channel, cinematic, owner, portal]);

  return <StoryRendererPermission value={owner === "story"}>
    <div ref={root} className={styles.home} data-home-experience data-canvas-owner={owner}>
      {children}
    </div>
    {cinematic && Renderer && portal && createPortal(<WorldBoundary onFailure={fail}><Renderer channel={channel} host={portal} ready={ready} fail={fail} /></WorldBoundary>, portal)}
  </StoryRendererPermission>;
}
