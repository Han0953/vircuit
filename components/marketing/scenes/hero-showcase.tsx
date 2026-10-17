"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Pause, Play } from "lucide-react";
import gsap from "gsap";
import { createHeroPlayback, type HeroPlaybackState } from "./hero-playback";
import { heroBoards, heroScenes, heroTiming } from "./hero-showcase-config";
import { animateHeroIntro } from "./hero-intro";
import styles from "../homepage.module.css";

export function HeroShowcase({ scenes }: { scenes: ReactNode[] }) {
  const root = useRef<HTMLElement>(null);
  const playback = useRef<ReturnType<typeof createHeroPlayback> | null>(null);
  const [state, setState] = useState<HeroPlaybackState>({ index: 0, phase: "holding", paused: false, manualPaused: false, reduced: false });
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const panels = Array.from(element.querySelectorAll<HTMLElement>("[data-hero-scene]"));
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    let intro: ReturnType<typeof animateHeroIntro>;
    let started = false;
    let current = panels[0];
    let tilt: gsap.core.Tween | undefined;
    let box: DOMRect | undefined;
    let pointer: { x: number; y: number } | undefined;
    const applyTilt = () => {
      if (!pointer || reduce.matches || !fine.matches) return;
      box ??= element.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const x = gsap.utils.clamp(-.5, .5, (pointer.x - box.left) / box.width - .5);
      const y = gsap.utils.clamp(-.5, .5, (pointer.y - box.top) / box.height - .5);
      const amplitude = innerWidth < 1024 ? .65 : 1;
      element.dataset.heroHovered = "true";
      tilt?.kill();
      tilt = gsap.to(current.querySelector("[data-hero-tilt]"), {
        x: x * 16 * amplitude, y: y * 12 * amplitude, z: 10,
        rotationY: x * 18 * amplitude, rotationX: -y * 14 * amplitude,
        rotationZ: x * 2 * amplitude, scale: 1.015, duration: .45,
        ease: "power2.out", overwrite: true,
      });
    };
    const resetTilt = () => {
      tilt?.kill();
      if (reduce.matches || document.hidden) gsap.set(current.querySelector("[data-hero-tilt]"), { clearProps: "transform" });
      else tilt = gsap.to(current.querySelector("[data-hero-tilt]"), {
        x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0, scale: 1,
        duration: .55, ease: "power2.out", overwrite: true,
      });
    };
    const leave = () => {
      if (!pointer && !box && !tilt) return;
      pointer = undefined; box = undefined;
      delete element.dataset.heroHovered;
      resetTilt();
    };
    const move = (event: PointerEvent) => {
      if (reduce.matches || !fine.matches || event.pointerType === "touch") return;
      pointer = { x: event.clientX, y: event.clientY };
      applyTilt();
    };
    const settle = () => {
      gsap.set(current.querySelectorAll("[data-hero-circuit],[data-hero-info],[data-hero-resistor],[data-hero-led],[data-hero-pin]"), { clearProps: "transform,opacity,visibility" });
      gsap.set(current.querySelectorAll("[data-hero-wire]"), { strokeDashoffset: 0, opacity: 1 });
      current.querySelector("[data-hero-lens]")?.setAttribute("fill", "var(--part-led-on)");
    };
    const controller = createHeroPlayback({
      activate(index) {
        tilt?.kill();
        panels.forEach((panel, i) => { panel.hidden = i !== index; });
        current = panels[index];
        gsap.set(element.querySelectorAll("[data-hero-tilt]"), { clearProps: "transform" });
        settle();
        // Keep following a stationary pointer when autoplay changes the board.
        applyTilt();
      },
      enter(index, done, initial) {
        const scene = heroScenes[heroBoards[index]];
        const amplitude = innerWidth < 1024 ? .5 : 1;
        const circuit = current.querySelector("[data-hero-circuit]");
        const paths = Array.from(current.querySelectorAll<SVGPathElement>("[data-hero-wire]"));
        current.querySelector("[data-hero-lens]")?.setAttribute("fill", "var(--part-led-off)");
        let timeline!: gsap.core.Timeline;
        {
          paths.forEach((path) => gsap.set(path, { strokeDasharray: path.getTotalLength(), strokeDashoffset: path.getTotalLength(), opacity: 1 }));
          timeline = gsap.timeline({ onComplete: done, defaults: { ease: "power2.out" } })
            .fromTo(circuit, { x: scene.entry[0] * amplitude, y: scene.entry[1] * amplitude, opacity: initial ? 1 : 0 }, { x: 0, y: 0, opacity: 1, duration: .55 }, 0)
            .fromTo(current.querySelectorAll("[data-hero-pin]"), { opacity: .2 }, { opacity: 1, duration: .25 }, .35)
            .to(paths, { strokeDashoffset: 0, duration: .4, stagger: .25, ease: "none" }, .55)
            .fromTo(current.querySelector("[data-hero-resistor]"), { opacity: 0 }, { opacity: 1, duration: .25 }, .65)
            .fromTo(current.querySelector("[data-hero-led]"), { opacity: 0 }, { opacity: 1, duration: .25 }, .85)
            .fromTo(current.querySelectorAll("[data-hero-info]"), { y: 8, opacity: initial ? 1 : 0 }, { y: 0, opacity: 1, duration: .3, stagger: .05 }, 1.05);
          timeline.set(current.querySelector("[data-hero-lens]"), { attr: { fill: "var(--part-led-on)" } }, 1.45);
          timeline.to({}, { duration: heroTiming.enter - 1.45 }, 1.45);
        }
        return timeline;
      },
      exit(index, done) {
        const scene = heroScenes[heroBoards[index]];
        const amplitude = innerWidth < 1024 ? .5 : 1;
        let timeline!: gsap.core.Timeline;
        {
          timeline = gsap.timeline({ onComplete: done })
            .to(current.querySelectorAll("[data-hero-wire],[data-hero-info]"), { opacity: 0, duration: .18 }, 0)
            .to(current.querySelector("[data-hero-circuit]"), { x: scene.exit[0] * amplitude, y: scene.exit[1] * amplitude, opacity: 0, duration: .32, ease: "power2.in" }, .18);
        }
        return timeline;
      },
      settle,
      changed(next) { element.dataset.heroPhase = next.phase; setState(next); },
    });
    playback.current = controller;
    const startCircuit = () => { if (!started) { started = true; controller.start(); } };
    const reduced = () => {
      if (reduce.matches) {
        leave();
        gsap.set(element.querySelectorAll("[data-hero-tilt]"), { clearProps: "transform" });
      }
      controller.reduce(reduce.matches);
      if (reduce.matches) { intro?.finish(); startCircuit(); element.closest<HTMLElement>("[data-home-zone='hero']")?.setAttribute("data-hero-intro", "reduced"); }
    };
    const visibility = () => {
      controller.block("hidden", document.hidden);
      if (document.hidden) { intro?.pause(); leave(); } else intro?.resume();
    };
    const observer = new IntersectionObserver(([entry]) => {
      const offscreen = !entry.isIntersecting || entry.intersectionRatio < .25;
      controller.block("offscreen", offscreen);
      if (offscreen) {
        const section = element.closest<HTMLElement>("[data-home-zone='hero']")?.getBoundingClientRect();
        if (section && (section.bottom <= 0 || section.top >= innerHeight)) intro?.finish();
        leave();
      }
    }, { threshold: [0, .25] });
    observer.observe(element);
    const scroll = () => { box = undefined; };
    const pointerMode = () => { if (!fine.matches) leave(); };
    reduce.addEventListener("change", reduced);
    fine.addEventListener("change", pointerMode);
    document.addEventListener("visibilitychange", visibility);
    element.addEventListener("pointerenter", move);
    element.addEventListener("pointerleave", leave);
    element.addEventListener("pointercancel", leave);
    element.addEventListener("pointermove", move);
    window.addEventListener("resize", leave, { passive: true });
    window.addEventListener("scroll", scroll, { passive: true });
    reduced();
    if (!reduce.matches) intro = animateHeroIntro(element, startCircuit);
    visibility();
    return () => {
      intro?.dispose();
      controller.dispose(); playback.current = null; observer.disconnect(); tilt?.kill();
      reduce.removeEventListener("change", reduced);
      fine.removeEventListener("change", pointerMode);
      document.removeEventListener("visibilitychange", visibility);
      element.removeEventListener("pointerenter", move); element.removeEventListener("pointerleave", leave);
      element.removeEventListener("pointercancel", leave);
      element.removeEventListener("pointermove", move);
      window.removeEventListener("resize", leave);
      window.removeEventListener("scroll", scroll);
    };
  }, []);

  return <figure ref={root} className={styles.heroFigure + " component-art"} data-hero-2d data-hero-active={heroBoards[state.index]} data-hero-paused={state.paused} aria-label="Kenali board dan hubungan pin, resistor, serta LED">
    {scenes}
    <figcaption className="sr-only">
      Ilustrasi board, pin, resistor, dan LED; bukan simulasi langsung. Arduino Uno R3 dan ESP32 DevKit mendukung subset simulasi edukatif. Arduino Nano hanya visual.
    </figcaption>
    <div className={styles.heroControls} data-hero-controls>
      <div className={styles.heroIndicators} aria-hidden="true">
        {heroBoards.map((board, index) => <span key={board} data-active={state.index === index} />)}
      </div>
      <button type="button" className={styles.heroPlay} disabled={state.reduced} onClick={() => state.manualPaused ? playback.current?.play() : playback.current?.pause()} aria-label={state.manualPaused ? "Putar pergantian board" : "Jeda pergantian board"} title={state.reduced ? "Pergantian otomatis nonaktif: kurangi gerakan" : undefined}>
        {state.manualPaused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
      </button>
    </div>
  </figure>;
}
