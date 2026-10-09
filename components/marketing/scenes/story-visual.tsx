"use client";
import { useCallback, useContext, useEffect, useRef, useState, type ComponentType } from "react";
import { StoryContext } from "./story-context";
import { CircuitArtwork } from "./circuit-artwork";
import { sampleStory, type StoryChannel } from "./story-config";
import { WorldBoundary } from "./three/world-boundary";
import styles from "../homepage.module.css";

export function StoryVisual() {
  const channel = useContext(StoryContext);
  const ref = useRef<HTMLDivElement>(null);
  const [world, setWorld] = useState<{ Renderer: ComponentType<{ channel: StoryChannel; host: HTMLElement; ready: () => void; fail: () => void }>; host: HTMLElement } | null>(null);
  const failed = useRef(false);
  const ready = useCallback(() => { if (!failed.current && ref.current && !matchMedia("(prefers-reduced-motion: reduce)").matches) channel?.setWebgl(true); }, [channel]);
  const fail = useCallback(() => { failed.current = true; channel?.setWebgl(false); setWorld(null); }, [channel]);
  useEffect(() => {
    const host = ref.current; if (!host || !channel) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false; let loading = false;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void load();
    }, { rootMargin: "250px" });
    async function load() {
      if (disposed || loading || failed.current || media.matches || !host) return;
      if (!("WebGL2RenderingContext" in window)) { failed.current = true; return; }
      loading = true;
      try { const { default: Renderer } = await import("./three/learning-world"); if (!disposed && !media.matches && !failed.current) { setWorld({ Renderer, host }); observer.unobserve(host); } }
      catch { if (!disposed) fail(); }
      finally { loading = false; }
    }
    const preference = () => { if (media.matches) { channel.setWebgl(false); setWorld(null); } else { observer.unobserve(host); observer.observe(host); } };
    observer.observe(host); media.addEventListener("change", preference);
    return () => { disposed = true; observer.disconnect(); media.removeEventListener("change", preference); channel.setWebgl(false); };
  }, [channel, fail]);
  useEffect(() => {
    const root = ref.current;
    if (!channel || !root) return;
    const parts = root.querySelectorAll<SVGGElement>("[data-part]");
    const paths = root.querySelectorAll<SVGPathElement>("[data-wire]");
    const update = () => {
      const { progress, webgl } = channel.read();
      root.dataset.renderer = webgl ? "webgl" : "svg";
      if (webgl) return;
      const state = sampleStory(progress, window.innerWidth < 1024);
      parts.forEach((part, i) => {
        const type = (["uno", "resistor", "led", "breadboard-mini", "button", "pot"] as const)[i];
        const pose = state.objects[type];
        part.style.opacity = String(Math.max(.2, pose.scale));
        part.style.transformOrigin = "center"; part.style.transformBox = "fill-box";
        part.style.transform = `translateY(${(1 - pose.scale) * -25}px) rotate(${pose.rotation[2] * 40}deg)`;
      });
      paths.forEach((path) => { path.style.strokeDasharray = "1"; path.style.strokeDashoffset = String(1 - state.wire); path.setAttribute("pathLength", "1"); });
      root.querySelectorAll<SVGElement>("[data-led-halo]").forEach((led) => { led.style.opacity = String(state.led); });
      const button = root.querySelector<SVGElement>("[data-button-cap]");
      if (button) button.setAttribute("r", String(11 - state.press * 3));
      const knob = root.querySelector<SVGElement>("[data-pot-knob]");
      if (knob) knob.setAttribute("transform", `rotate(${state.knob * 60} 530 310)`);
    };
    update(); return channel.subscribe(update);
  }, [channel]);
  return <div ref={ref} className={styles.storyVisual + " component-art"} data-renderer="svg">
    <div className={styles.svgFallback} data-svg-fallback><CircuitArtwork />
      <svg viewBox="0 0 600 360" className={styles.storyExtras + " component-art"} aria-hidden="true">
        <g data-part="breadboard-mini"><rect x="360" y="224" width="110" height="104" rx="8" fill="var(--part-breadboard)" stroke="var(--part-metal)" /><path d="M414 230v90" stroke="var(--part-groove)" strokeWidth="7" />{Array.from({ length: 36 }, (_, i) => <rect key={i} x={370 + (i % 6) * 15} y={236 + Math.floor(i / 6) * 15} width="4" height="4" fill="var(--part-chip)" />)}</g>
        <g data-part="button"><rect x="480" y="235" width="33" height="35" rx="4" fill="var(--part-metal)" /><circle data-button-cap cx="496" cy="252" r="11" fill="var(--part-chip)" /></g>
        <g data-part="pot"><circle cx="530" cy="310" r="23" fill="var(--part-metal)" /><circle cx="530" cy="310" r="17" fill="var(--part-chip)" /><path data-pot-knob d="M530 310v-12" stroke="var(--part-silkscreen)" strokeWidth="3" /></g>
      </svg>
    </div>
    {world && channel && <div className={styles.webglLayer} aria-hidden="true"><WorldBoundary onFailure={fail}><world.Renderer channel={channel} host={world.host} ready={ready} fail={fail} /></WorldBoundary></div>}
  </div>;
}
