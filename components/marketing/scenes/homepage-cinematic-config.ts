export const featuredBoards = ["uno", "nano", "esp32"] as const;
export type FeaturedBoard = typeof featuredBoards[number];
export type CinematicZone = "boards";
export type CinematicFrame = { zone: CinematicZone; progress: number; mobile: boolean };
type Vector = [number, number, number];
const clamp = (n: number) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (a: Vector, b: Vector, t: number): Vector => a.map((n, i) => lerp(n, b[i], t)) as Vector;

/** Absolute poses, never accumulated rotations. Safe when seeking backwards or restoring scroll. */
export function sampleCinematic({ progress, mobile }: CinematicFrame) {
  const p = clamp(progress);
  const index = Math.min(2, Math.floor(p * 3));
  const local = Math.min(1, p * 3 - index);
  const amplitude = mobile ? .5 : 1;
  const enter = clamp(local / .28);
  const leave = clamp((local - .76) / .24);
  const smooth = (n: number) => n * n * (3 - 2 * n);
  const travel = smooth(enter) - smooth(leave);
  const board = featuredBoards[index];
  const drift = Math.sin(local * Math.PI * 2);
  const position: Vector = [lerp(1.4, .08, smooth(enter)) - leave * .95 + drift * .22, .1 + drift * .18 + (board === "nano" ? leave : -leave) * .35, -.9 + travel * 1.15 + drift * .12];
  const rotation: Vector = [.05 + drift * .065, (-.38 + smooth(enter) * .5 - leave * .25 + drift * .16) * (mobile ? .6 : 1), -.05 + drift * .045];
  position[0] *= amplitude;
  position[1] *= amplitude;
  const presence = smooth(clamp(local / .12)) * (1 - smooth(clamp((local - .9) / .1)));
  const camera = mix([0, 7, 5.2], [.25 * amplitude, 6.3, 4.4], travel);
  camera[0] += drift * .25 * amplitude;
  camera[2] += drift * .15;
  return { board, index, local, position, rotation, presence, scale: .88 + travel * .12, camera, target: [.08 * drift * amplitude, 0, -.06 * drift] as Vector, p };
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
