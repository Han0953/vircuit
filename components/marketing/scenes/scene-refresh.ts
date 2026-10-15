import { ScrollTrigger } from "gsap/ScrollTrigger";

const requests = new Set<symbol>();
let frame = 0;
let task = 0;
let waiting = false;
let scrolling = false;
let scrollTimer = 0;
let watchingScroll = false;

function stopScrollWatch() {
  window.removeEventListener("scroll", nativeScroll);
  window.clearTimeout(scrollTimer);
  scrollTimer = 0; scrolling = false; watchingScroll = false;
}

function nativeScroll() {
  // Lazy scenes can request a full geometry refresh during native touch
  // scrolling. Coalesce those reads until the gesture/momentum is quiet.
  scrolling = true;
  cancelAnimationFrame(frame); window.clearTimeout(task);
  frame = task = 0;
  window.clearTimeout(scrollTimer);
  scrollTimer = window.setTimeout(() => { scrolling = false; scrollTimer = 0; schedule(); }, 120);
}

function schedule() {
  if (!requests.size || frame || task || scrolling) return;
  if (document.documentElement.hasAttribute("data-home-moving")) {
    if (!waiting) window.addEventListener("home-scroll-settled", settled, { once: true });
    waiting = true;
    return;
  }
  // Let the pending interaction paint before measuring every scroll scene.
  frame = requestAnimationFrame(() => {
    frame = 0;
    task = window.setTimeout(() => {
      task = 0;
      if (document.documentElement.hasAttribute("data-home-moving")) { schedule(); return; }
      requests.clear();
      stopScrollWatch();
      ScrollTrigger.refresh();
    }, 0);
  });
}

function settled() { waiting = false; schedule(); }

export function requestSceneRefresh() {
  const request = Symbol();
  requests.add(request);
  if (!watchingScroll) {
    watchingScroll = true;
    window.addEventListener("scroll", nativeScroll, { passive: true });
  }
  schedule();
  return () => {
    requests.delete(request);
    if (requests.size) return;
    cancelAnimationFrame(frame); window.clearTimeout(task);
    window.removeEventListener("home-scroll-settled", settled);
    stopScrollWatch();
    frame = task = 0; waiting = false;
  };
}
