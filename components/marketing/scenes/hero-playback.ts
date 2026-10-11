import { heroTiming } from "./hero-showcase-config";

export type HeroPhase = "entering" | "holding" | "exiting";
export type HeroPlaybackState = { index: number; phase: HeroPhase; paused: boolean; manualPaused: boolean; reduced: boolean };
type Animation = { pause: () => unknown; resume: () => unknown; kill: () => unknown };
type Presentation = {
  activate: (index: number) => void;
  enter: (index: number, done: () => void, initial: boolean) => Animation;
  exit: (index: number, done: () => void) => Animation;
  settle: () => void;
  changed: (state: HeroPlaybackState) => void;
};

export function createHeroPlayback(view: Presentation) {
  let index = 0, target = 0, phase: HeroPhase = "holding";
  let userPaused = false, reduced = false, disposed = false, generation = 0;
  let remaining = heroTiming.hold, deadline = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let animation: Animation | undefined;
  const blockers = new Set<string>();
  const paused = () => userPaused || reduced || blockers.size > 0;
  const animationBlocked = () => blockers.has("hidden") || blockers.has("offscreen");
  const publish = () => view.changed({ index, phase, paused: paused(), manualPaused: userPaused || reduced, reduced });
  const clear = () => { if (timer !== undefined) { remaining = Math.max(0, deadline - Date.now()); clearTimeout(timer); timer = undefined; } };
  const cancel = () => { generation++; animation?.kill(); animation = undefined; clear(); };
  const schedule = () => {
    if (disposed || paused() || phase !== "holding" || timer !== undefined) return;
    deadline = Date.now() + remaining;
    timer = setTimeout(() => { timer = undefined; target = (index + 1) % 3; leave(); }, remaining);
  };
  const enter = (initial = false) => {
    index = target; view.activate(index); phase = "entering"; publish();
    const token = generation;
    if (reduced) { view.settle(); hold(); return; }
    animation = view.enter(index, () => { if (!disposed && token === generation) { animation = undefined; hold(); } }, initial);
    if (animationBlocked()) animation.pause();
  };
  const hold = () => { phase = "holding"; remaining = heroTiming.hold; publish(); schedule(); };
  const leave = () => {
    cancel(); phase = "exiting"; publish();
    const token = generation;
    if (reduced) { enter(); return; }
    animation = view.exit(index, () => { if (!disposed && token === generation) { animation = undefined; enter(); } });
    if (animationBlocked()) animation.pause();
  };
  return {
    start() { if (!disposed) enter(true); },
    play() { if (!disposed && !reduced) { userPaused = false; publish(); schedule(); } },
    pause() { userPaused = true; clear(); publish(); },
    block(reason: string, blocked: boolean) {
      if (disposed) return;
      if (blocked) blockers.add(reason); else blockers.delete(reason);
      if (blockers.size) clear();
      if (animationBlocked()) animation?.pause(); else animation?.resume();
      schedule();
      publish();
    },
    reduce(value: boolean) {
      if (disposed || reduced === value) return;
      reduced = value; cancel();
      if (phase === "exiting") { index = target; view.activate(index); }
      view.settle(); phase = "holding"; remaining = heroTiming.hold; publish(); schedule();
    },
    dispose() { disposed = true; cancel(); blockers.clear(); },
  };
}
