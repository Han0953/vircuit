/** Warm the deferred renderer between interactions, without mounting a Canvas. */
export function prepareStoryWhenIdle(host: HTMLElement, prepare: () => void, allowed: () => boolean) {
  const hero = host.closest("[data-home-experience]")?.querySelector<HTMLElement>("[data-home-zone='hero']");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let timer = 0;
  let idle = 0;
  let disposed = false;
  const cancelPending = () => {
    window.clearTimeout(timer);
    if (idle) window.cancelIdleCallback(idle);
    timer = idle = 0;
  };
  const run = () => {
    idle = 0;
    if (disposed || document.hidden || reduced.matches || hero?.dataset.heroIntro === "playing" || !allowed()) return;
    cleanup();
    prepare();
  };
  const schedule = () => {
    cancelPending();
    if (disposed) return;
    // Wheel/touch input precedes the first scroll event. Do not start parsing
    // the renderer in that gap, or during the GSAP hero entrance.
    timer = window.setTimeout(() => {
      timer = 0;
      if ("requestIdleCallback" in window) idle = window.requestIdleCallback(run);
      else run();
    }, 180);
  };
  const intro = new MutationObserver(schedule);
  if (hero) intro.observe(hero, { attributes: true, attributeFilter: ["data-hero-intro"] });
  function cleanup() {
    disposed = true;
    cancelPending();
    intro.disconnect();
    for (const event of ["wheel", "scroll", "touchstart", "touchmove", "keydown"]) window.removeEventListener(event, schedule);
    document.removeEventListener("visibilitychange", schedule);
    reduced.removeEventListener("change", schedule);
  }
  for (const event of ["wheel", "scroll", "touchstart", "touchmove", "keydown"]) window.addEventListener(event, schedule, { passive: true });
  document.addEventListener("visibilitychange", schedule);
  reduced.addEventListener("change", schedule);
  schedule();
  return cleanup;
}
