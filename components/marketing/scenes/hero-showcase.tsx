"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pause, Play } from "lucide-react";
import gsap from "gsap";
import { createHeroPlayback, type HeroPlaybackState } from "./hero-playback";
import { heroBoards, heroScenes, heroTiming } from "./hero-showcase-config";
import styles from "../homepage.module.css";

export function HeroShowcase({ scenes }: { scenes: ReactNode[] }) {
  const root = useRef<HTMLElement>(null);
  const playback = useRef<ReturnType<typeof createHeroPlayback> | null>(null);
  const [state, setState] = useState<HeroPlaybackState>({ index: 0, phase: "holding", paused: false, manualPaused: false, reduced: false });
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const panels = Array.from(element.querySelectorAll<HTMLElement>("[data-hero-scene]"));
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    let current = panels[0];
    let tilt: gsap.core.Tween | undefined;
    let box: DOMRect | undefined;
    const settle = () => {
      gsap.set(current.querySelectorAll("[data-hero-circuit],[data-hero-info],[data-hero-resistor],[data-hero-led],[data-hero-pin]"), { clearProps: "transform,opacity,visibility" });
      gsap.set(current.querySelectorAll("[data-hero-wire]"), { strokeDashoffset: 0, opacity: 1 });
      current.querySelector("[data-hero-lens]")?.setAttribute("fill", "var(--part-led-off)");
    };
    const controller = createHeroPlayback({
      activate(index) {
        tilt?.kill(); box = undefined;
        panels.forEach((panel, i) => { panel.hidden = i !== index; });
        current = panels[index];
        gsap.set(element.querySelectorAll("[data-hero-tilt]"), { clearProps: "transform" });
        settle();
      },
      enter(index, done, initial) {
        const scene = heroScenes[heroBoards[index]];
        const amplitude = innerWidth < 1024 ? .5 : 1;
        const circuit = current.querySelector("[data-hero-circuit]");
        const paths = Array.from(current.querySelectorAll<SVGPathElement>("[data-hero-wire]"));
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
          if (heroBoards[index] !== "nano") timeline.set(current.querySelector("[data-hero-lens]"), { attr: { fill: "var(--part-led-on)" } }, 1.45);
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
    const reduced = () => controller.reduce(reduce.matches);
    const visibility = () => controller.block("hidden", document.hidden);
    const observer = new IntersectionObserver(([entry]) => controller.block("offscreen", !entry.isIntersecting || entry.intersectionRatio < .25), { threshold: [0, .25] });
    observer.observe(element);
    const hover = () => { if (fine.matches) { box = element.getBoundingClientRect(); controller.block("hover", true); } };
    const resetTilt = () => { tilt?.kill(); tilt = gsap.to(current.querySelector("[data-hero-tilt]"), { x: 0, y: 0, rotationX: 0, rotationY: 0, duration: .4 }); };
    const leave = () => { controller.block("hover", false); resetTilt(); };
    const move = (event: PointerEvent) => {
      if (reduce.matches || !fine.matches || event.pointerType === "touch" || !box) return;
      const x = (event.clientX - box.left) / box.width - .5, y = (event.clientY - box.top) / box.height - .5;
      tilt?.kill();
      tilt = gsap.to(current.querySelector("[data-hero-tilt]"), { x: x * 8, y: y * 6, rotationY: x * 4, rotationX: -y * 4, duration: .5, overwrite: true });
    };
    const focus = () => controller.pause();
    const resize = () => { box = undefined; resetTilt(); };
    reduce.addEventListener("change", reduced);
    document.addEventListener("visibilitychange", visibility);
    element.addEventListener("pointerenter", hover);
    element.addEventListener("pointerleave", leave);
    element.addEventListener("pointermove", move);
    element.addEventListener("focusin", focus);
    window.addEventListener("resize", resize, { passive: true });
    visibility(); reduced(); controller.start();
    return () => {
      controller.dispose(); playback.current = null; observer.disconnect(); tilt?.kill();
      reduce.removeEventListener("change", reduced);
      document.removeEventListener("visibilitychange", visibility);
      element.removeEventListener("pointerenter", hover); element.removeEventListener("pointerleave", leave);
      element.removeEventListener("pointermove", move); element.removeEventListener("focusin", focus);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <figure ref={root} className={styles.heroFigure + " component-art"} data-hero-2d data-hero-active={heroBoards[state.index]} data-hero-paused={state.paused} aria-label="Kenali board dan hubungan pin, resistor, serta LED">
    {scenes}
    <figcaption className={styles.heroControls} data-hero-controls>
      <div className={styles.heroSelectors} role="group" aria-label="Pilih board ilustrasi">
        {heroBoards.map((board, index) => <button key={board} type="button" aria-pressed={state.index === index} onClick={() => { playback.current?.select(index); setAnnouncement(`${heroScenes[board].name}. ${heroScenes[board].status}.`); }}>
          <span aria-hidden="true" className={styles.heroSegment} />{board === "esp32" ? "ESP32" : board === "uno" ? "Uno" : "Nano"}
        </button>)}
      </div>
      <button type="button" className={styles.heroPlay} disabled={state.reduced} onClick={() => state.manualPaused ? playback.current?.play() : playback.current?.pause()} aria-label={state.manualPaused ? "Putar pergantian board" : "Jeda pergantian board"} title={state.reduced ? "Pergantian otomatis nonaktif: kurangi gerakan" : undefined}>
        {state.manualPaused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
      </button>
    </figcaption>
    <p className={styles.heroIllustrationNote}>Ilustrasi rangkaian · bukan simulasi langsung</p>
    <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
    <details className={styles.heroDescriptions}><summary>Dukungan ketiga board</summary><ul>{heroBoards.map((board) => <li key={board}><strong>{heroScenes[board].name}: {heroScenes[board].status}.</strong> {heroScenes[board].copy}</li>)}</ul></details>
  </figure>;
}
