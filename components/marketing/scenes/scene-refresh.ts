import { ScrollTrigger } from "gsap/ScrollTrigger";

const requests = new Set<symbol>();
let frame = 0;
let task = 0;
let waiting = false;

function schedule() {
  if (!requests.size || frame || task) return;
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
      ScrollTrigger.refresh();
    }, 0);
  });
}

function settled() { waiting = false; schedule(); }

export function requestSceneRefresh() {
  const request = Symbol();
  requests.add(request);
  schedule();
  return () => {
    requests.delete(request);
    if (requests.size) return;
    cancelAnimationFrame(frame); window.clearTimeout(task);
    window.removeEventListener("home-scroll-settled", settled);
    frame = task = 0; waiting = false;
  };
}
