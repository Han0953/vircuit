export const featuredBoards = ["uno", "nano", "esp32"] as const;
export type FeaturedBoard = typeof featuredBoards[number];
export type CinematicZone = "boards";
export type CinematicFrame = { zone: CinematicZone; progress: number; mobile: boolean };
type Vector = [number, number, number];
const clamp = (n: number) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (a: Vector, b: Vector, t: number): Vector => a.map((n, i) => lerp(n, b[i], t)) as Vector;
const smooth = (n: number) => n * n * (3 - 2 * n);
const boardPoses: Record<FeaturedBoard, { enter: Vector; focus: Vector; exit: Vector; rotation: Vector }> = {
  uno: { enter: [1.1, .25, -.7], focus: [0, 0, .2], exit: [-.8, -.15, -.6], rotation: [.12, -.35, -.08] },
  nano: { enter: [-.85, -.25, -.7], focus: [-.05, .06, .25], exit: [.55, .7, -.7], rotation: [-.08, .25, .06] },
  esp32: { enter: [.9, -.3, -.8], focus: [.05, 0, .2], exit: [-.65, .15, -.6], rotation: [.1, -.25, -.06] },
};

/** Absolute poses, never accumulated rotations. Safe when seeking backwards or restoring scroll. */
export function sampleCinematic({ progress, mobile }: CinematicFrame) {
  const p = clamp(progress);
  const index = Math.min(2, Math.floor(p * 3));
  const local = Math.min(1, p * 3 - index);
  const amplitude = mobile ? .5 : 1;
  const enter = clamp(local / .20);
  const leave = clamp((local - .82) / .18);
  const travel = smooth(enter) - smooth(leave);
  const board = featuredBoards[index];
  const drift = Math.sin(local * Math.PI * 2);
  const poses = boardPoses[board];
  const position = mix(mix(poses.enter, poses.focus, smooth(enter)), poses.exit, smooth(leave));
  position[1] += drift * .06;
  position[2] += drift * .08 * (mobile ? .65 : 1);
  const rotation = mix(mix(poses.rotation, [.06, .15, 0], smooth(enter)), [.1, -.2, -.05], smooth(leave));
  rotation[1] += drift * .12;
  rotation[2] += drift * .025;
  if (mobile) rotation.forEach((value, i) => { rotation[i] = value * .5; });
  position[0] *= amplitude;
  position[1] *= amplitude;
  const presence = smooth(clamp(local / .12)) * (1 - smooth(clamp((local - .9) / .1)));
  const camera = mix([.3, 7, 5.2], [.05, 6.2, 4.5], travel);
  camera[0] += drift * .18 * amplitude;
  camera[1] += mobile ? .6 : 0;
  camera[2] += drift * .1 + (mobile ? .6 : 0);
  const focus = smooth(clamp((local - .55) / .13)) * (1 - smooth(clamp((local - .72) / .1)));
  const target: Vector = [(.08 * drift + (board === "uno" ? -.25 * focus : 0)) * amplitude, .06 * focus, -.06 * drift + (board === "nano" ? .3 : -.2) * focus];
  return { board, index, local, position, rotation, presence, scale: .88 + travel * .12, camera, target, p };
}

export function createCinematicChannel() {
  let frame: CinematicFrame = { zone: "boards", progress: 0, mobile: false };
  const listeners = new Set<() => void>();
  return {
    read: () => frame,
    publish(next: CinematicFrame) { frame = next; listeners.forEach((listener) => listener()); },
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  };
}
export type CinematicChannel = ReturnType<typeof createCinematicChannel>;
