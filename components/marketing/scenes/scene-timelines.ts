import gsap from "gsap";
import type { SceneKind } from "./motion-scene";
import { sampleStory, storyNames, type StoryChannel } from "./story-config";
import { componentMotion, type HardwareType } from "./component-motion-registry";

function wires(root: HTMLElement) {
  const paths = gsap.utils.toArray<SVGPathElement>("[data-wire]", root);
  paths.forEach((path) => gsap.set(path, { strokeDasharray: path.getTotalLength(), strokeDashoffset: path.getTotalLength() }));
  return paths;
}

function hero(root: HTMLElement, fine: boolean, desktop: boolean) {
  const q = gsap.utils.selector(root);
  const assembly = q("[data-assembly]")[0] as HTMLElement;
  const intro = gsap.timeline({ defaults: { ease: "power2.out" }, scrollTrigger: { id: "home-hero", trigger: root, start: "top bottom", toggleActions: "play pause resume pause" } });
  intro.from(q("[data-grid]"), { opacity: 0, duration: .5 })
    .from(assembly, { rotationX: desktop ? 30 : 22, rotationY: desktop ? -24 : -18, y: desktop ? 35 : 22, duration: .9 }, 0)
    .from(q("[data-part]"), { y: -30, opacity: 0, stagger: .14, duration: .6 }, .1)
    .to(wires(root), { strokeDashoffset: 0, stagger: .18, duration: .55 }, .55)
    .from(q("[data-code]"), { y: 15, opacity: 0, duration: .5 }, .8)
    .from(q("[data-code-line]"), { opacity: .3, duration: .35 }, 1.35)
    .from(q("[data-led-halo]"), { scale: .2, opacity: 0, transformOrigin: "center", duration: .5 }, 1.45)
    .from(q("[data-output]"), { y: 8, opacity: 0, duration: .4 }, 1.65);
  if (!fine) return;
  const tiltX = gsap.quickTo(assembly, "rotationX", { duration: .5, ease: "power2.out" });
  const tiltY = gsap.quickTo(assembly, "rotationY", { duration: .5, ease: "power2.out" });
  const move = (event: PointerEvent) => {
    if (intro.isActive() || event.pointerType === "touch") return;
    const box = root.getBoundingClientRect();
    tiltX(12 - ((event.clientY - box.top) / box.height - .5) * 8);
    tiltY(-12 + ((event.clientX - box.left) / box.width - .5) * 8);
  };
  const reset = () => { tiltX(12); tiltY(-12); };
  root.addEventListener("pointermove", move);
  root.addEventListener("pointerleave", reset);
  return () => { root.removeEventListener("pointermove", move); root.removeEventListener("pointerleave", reset); };
}

function story(root: HTMLElement, desktop: boolean, tall: boolean, channel: StoryChannel | null) {
  const q = gsap.utils.selector(root);
  const grid = q("[data-story]")[0] as HTMLElement;
  const stage = q("[data-stage]")[0] as HTMLElement;
  const count = q("[data-stage-count]")[0] as HTMLElement;
  count.textContent = "01 / 04";
  const frames = q("[data-frame]");
  gsap.set(frames, { autoAlpha: 0 });
  gsap.set(frames[0], { autoAlpha: 1 });
  const progress = { value: 0 };
  const update = () => {
    const p = progress.value;
    const state = sampleStory(p);
    channel?.publish(p);
    const beat = Math.min(4, Math.floor(p * 4) + 1);
    count.textContent = `0${beat} / 04`;
    root.dataset.beat = String(beat); root.dataset.progress = p.toFixed(3); root.dataset.subscene = storyNames[state.segment];
    gsap.set(q("[data-progress]"), { scaleX: p });
    frames.forEach((frame, i) => gsap.set(frame, { autoAlpha: (i === 0 && p < .3) || (i === 1 && p >= .5 && p < .7) || (i === 2 && p >= .7) ? 1 : 0 }));
    const feedback = root.querySelector("[data-diagnostic-copy]");
    if (feedback) feedback.textContent = state.diagnostic ? "Contoh ilustratif: wiring D3, kode D5. Cocokkan pin sebelum evaluasi ulang." : "Pin sudah sesuai. Jalankan ulang dan periksa hasil evaluasi. Ilustrasi, bukan hasil akun.";
    const code = root.querySelector("[data-story-code]");
    if (code) code.textContent = p < .58 ? "digitalRead(2);" : p < .64 ? "digitalWrite(3, HIGH);" : "analogRead(A0);";
  };
  const timeline = gsap.timeline({ scrollTrigger: {
    id: "home-story", trigger: grid, start: () => tall ? `top top+=${(document.querySelector<HTMLElement>("[data-home-header]")?.offsetHeight ?? 0) + 16}` : "top 65%",
    end: () => `+=${Math.max(300, grid.offsetHeight - (tall ? stage.offsetHeight : 0))}`,
    scrub: .12, pin: desktop && tall ? stage : false, pinSpacing: false,
    onRefresh: (self) => { progress.value = self.progress; update(); },
  } });
  timeline.to(progress, { value: 1, ease: "none", duration: 1, onUpdate: update });
  update();
  return () => { count.textContent = "04 / 04"; channel?.publish(1); delete root.dataset.beat; delete root.dataset.progress; delete root.dataset.subscene; };
}

export function animateScene(kind: SceneKind, root: HTMLElement, conditions: Record<string, boolean>, channel: StoryChannel | null = null) {
  gsap.set(root, { attr: { "data-motion": kind } });
  if (kind === "hero") return hero(root, conditions.fine, conditions.desktop);
  if (kind === "story") return story(root, conditions.desktop, conditions.tall, channel);
  if (kind === "catalog") {
    root.querySelectorAll<HTMLElement>("[data-catalog-type]").forEach((item) => {
      const type = item.dataset.catalogType;
      if (!type || !(type in componentMotion)) return;
      const amplitude = conditions.desktop ? 1 : componentMotion[type as HardwareType].mobileAmplitude;
      const body = item.querySelector("[data-catalog-body]");
      const pins = item.querySelectorAll("[data-visual-pin]");
      const timeline = gsap.timeline({ scrollTrigger: { trigger: item, start: "top 90%", end: "bottom 35%", scrub: .15 } });
      timeline.fromTo(body, { y: 18 * amplitude, rotation: (type === "esp32" ? -8 : -3) * amplitude }, { y: 0, rotation: 0, duration: .6 }, 0)
        .fromTo(item.querySelector("[data-catalog-signal]"), { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: .8 }, .1)
        .fromTo(item.querySelector("[data-catalog-indicator]"), { opacity: .15 }, { opacity: 1, duration: .2 }, .7);
      if (type === "nano" || type === "esp32" || type?.startsWith("breadboard")) timeline.fromTo(pins.length ? pins : item.querySelectorAll("[data-catalog-body] path"), { opacity: .35 }, { opacity: 1, stagger: .005, duration: .3 }, .15);
      if (type === "fan") timeline.to(item.querySelectorAll('[data-catalog-body] path[d^="M96 83"]'), { rotation: "+=240", svgOrigin: "96 83", duration: 1, ease: "none" }, 0);
      if (type === "relay") timeline.to(item.querySelector('[data-catalog-body] path[d^="M74 134"]'), { rotation: -35, svgOrigin: "74 134", duration: .3 }, .4);
      if (type === "dht22") timeline.fromTo(item.querySelector("[data-catalog-indicator]"), { x: -100 }, { x: 0, duration: .8 }, .1);
    });
    return;
  }
  const q = gsap.utils.selector(root);
  const timeline = gsap.timeline({ defaults: { ease: "power2.out", duration: .5 }, scrollTrigger: {
    id: `home-${kind}`, trigger: root, start: "top 80%", toggleActions: "play pause resume pause",
  } });
  if (kind === "simulator") {
    timeline.from(q("[data-input]"), { scale: .92, transformOrigin: "center" })
      .from(q("[data-signal]"), { scaleX: 0, transformOrigin: "left", stagger: .2 }, .3)
      .from(q("[data-code-line]"), { opacity: .25 }, .6)
      .from(q("[data-demo-led]"), { opacity: .25, scale: .85 }, .9)
      .from(q("[data-serial]"), { opacity: 0, y: 8 }, 1.2);
  } else if (kind === "cirra") {
    timeline.from(q("[data-question]"), { x: 12, opacity: 0 })
      .from(q("[data-context]"), { opacity: 0, y: 8 }, .3)
      .from(q("[data-reply]"), { y: 12, opacity: 0 }, .65)
      .from(q("[data-next]"), { opacity: 0 }, 1);
  } else if (kind === "challenge") {
    timeline.from(q("[data-requirement]"), { x: -8, opacity: .2, stagger: .16 })
      .from(q("[data-attempt]"), { y: 8, opacity: 0 }, .45)
      .from(q("[data-correction]"), { y: 8, opacity: 0 }, 1)
      .from(q("[data-result]"), { y: 8, opacity: 0 }, 1.5);
  } else {
    timeline.to(wires(root), { strokeDashoffset: 0, stagger: .15, duration: 1 });
  }
}
