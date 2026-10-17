import gsap from "gsap";

/** Entry owns outer wrappers; playback/hover keep their existing inner targets. */
export function animateHeroIntro(figure: HTMLElement, startCircuit: () => void) {
  const section = figure.closest<HTMLElement>("[data-home-zone='hero']");
  if (!section) { startCircuit(); return; }
  const q = gsap.utils.selector(section);
  const visible = (element: Element) => element.getClientRects().length > 0;
  const navigation = Array.from(document.querySelectorAll<HTMLElement>("[data-home-header] [data-motion-group]"))
    .filter(element => element.dataset.motionGroup !== "nav.skip" && visible(element));
  const steps = q("[data-hero-step]").filter(visible);
  const controls = figure.querySelector("[data-hero-controls]");
  const grids = Array.from(figure.querySelectorAll("[data-grid]"));
  const targets = [...navigation, ...q("[data-hero-eyebrow-line],[data-hero-eyebrow],[data-hero-title-word],[data-hero-description],[data-hero-action],[data-hero-note]"), ...steps, ...grids, figure, ...(controls ? [controls] : [])];
  const mobile = matchMedia("(max-width: 1023px)").matches;
  const pace = mobile ? .84 : 1;
  let timeline!: gsap.core.Timeline;
  const context = gsap.context(() => {
    section.dataset.heroIntro = "playing";
    timeline = gsap.timeline({
      defaults: { ease: "power3.out" },
      onComplete: () => {
        gsap.set(targets, { clearProps: "transform,opacity,visibility" });
        gsap.set(navigation, { clearProps: "transition" });
        section.dataset.heroIntro = "complete";
      },
    });
    // Navigation's CSS hover transform must not trail the GSAP entry clock.
    gsap.set(navigation, { transition: "none" });
    timeline
      .fromTo(navigation, { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: .5 * pace, stagger: .045 * pace }, 0)
      .fromTo(q("[data-hero-eyebrow-line]"), { scaleX: 0, transformOrigin: "left" }, { scaleX: 1, duration: .6 * pace }, .10 * pace)
      .fromTo(q("[data-hero-eyebrow]"), { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: .6 * pace }, .14 * pace)
      .fromTo(q("[data-hero-title-word]"), { y: mobile ? 18 : 28, opacity: 0 }, { y: 0, opacity: 1, duration: .82 * pace, stagger: .065 * pace }, .25 * pace)
      .fromTo(q("[data-hero-description]"), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .68 * pace }, .65 * pace)
      .fromTo(q("[data-hero-action]"), { y: 14, scale: .97, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: .62 * pace, stagger: .11 * pace }, .85 * pace)
      .fromTo(q("[data-hero-note]"), { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: .55 * pace }, 1.08 * pace);
    if (steps.length) timeline.fromTo(steps, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: .5 * pace, stagger: .075 * pace }, 1.18 * pace);
    timeline
      .fromTo(grids, { opacity: 0 }, { opacity: 1, duration: .65 * pace }, .3 * pace)
      .fromTo(figure, { x: mobile ? 12 : 34, y: 18, scale: .95, rotation: 1.5, opacity: 0 }, { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, duration: .95 * pace }, .4 * pace)
      .call(startCircuit, [], .45 * pace);
    if (controls) timeline.fromTo(controls, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: .5 * pace }, 1.15 * pace);
  }, section);
  // Keep event replay/hit targets intact during hydration; keyboard users can
  // immediately reveal and use controls rather than tab through transparent UI.
  const focus = (event: FocusEvent) => {
    if (section.dataset.heroIntro !== "playing" || !(event.target instanceof Element)) return;
    if (event.target.closest("a,button") && event.target.closest("[data-home-header],[data-home-zone='hero']")) timeline.progress(1, false);
  };
  document.addEventListener("focusin", focus);
  return {
    finish() { timeline.progress(1, false); },
    pause() { timeline.pause(); },
    resume() { timeline.resume(); },
    dispose() { document.removeEventListener("focusin", focus); context.revert(); delete section.dataset.heroIntro; },
  };
}
