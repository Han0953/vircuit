import { componentMotion, primaryTypes } from "./component-motion-registry";
export type PrimaryType = typeof primaryTypes[number];
export type Vector = [number, number, number];
export const storySegments = [0, .15, .30, .50, .70, .90, 1] as const;
export const storyNames = ["Discover", "Explore", "Build", "Code / Run", "Debug / Evaluate", "Resolve"] as const;
export const clamp = (value: number) => Math.max(0, Math.min(1, value));
export const range = (p: number, from: number, to: number) => clamp((p - from) / (to - from));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const assembled: Record<PrimaryType, Vector> = {
  uno: [-2.15, 0, 0], "breadboard-mini": [1.25, -.1, 0], led: [.7, .28, -.72],
  resistor: [1.1, .3, .15], button: [1.7, .34, .85], pot: [3, .35, .2],
};
export function sampleStory(raw: number, mobile = false) {
  const p = Number.isFinite(raw) ? clamp(raw) : 0;
  const build = range(p, .30, .45);
  const objects = Object.fromEntries(primaryTypes.map((type, i) => {
    const arrival = range(p, componentMotion[type].range[0], type === "uno" ? .14 : .30);
    const final = assembled[type];
    const spread = type === "uno" ? 0 : (1 - build) * (i % 2 ? -.45 : .45);
    const amplitude = mobile ? componentMotion[type].mobileAmplitude : 1;
    return [type, { position: [final[0] + spread, final[1] + (1 - arrival) * 2 * amplitude + (type === "uno" ? 0 : (1 - build) * .65), final[2]], rotation: [0, (1 - arrival) * .5 * amplitude, type === "uno" ? (1 - arrival) * -.12 : (1 - build) * .25], scale: mix(.01, 1, arrival) }];
  })) as Record<PrimaryType, { position: Vector; rotation: Vector; scale: number }>;
  const diagnostic = p >= .70 && p < .83;
  return { p, objects, build, wire: range(p, .45, .50), diagnostic,
    led: diagnostic ? .03 : p >= .50 ? mix(.2, 1, range(p, .52, .68)) : 0,
    press: Math.sin(range(p, .50, .62) * Math.PI), knob: mix(-1.8, 1.8, range(p, .55, .70)),
    camera: [mix(.6, .15, range(p, 0, .5)), mix(mobile ? 8.5 : 7.5, mobile ? 7.8 : 6.4, build), mix(mobile ? 10.8 : 8.8, mobile ? 10 : 8, build)] as Vector,
    target: [mix(-1, .2, range(p, 0, .35)), mobile ? -.5 : 0, 0] as Vector,
    segment: Math.min(5, storySegments.filter((edge) => p >= edge).length - 1),
  };
}
export type StoryChannel = ReturnType<typeof createStoryChannel>;
export function createStoryChannel() {
  let progress = 1;
  let webgl = false;
  const listeners = new Set<() => void>();
  return {
    read: () => ({ progress, webgl }),
    publish(value: number) { progress = clamp(value); listeners.forEach((listener) => listener()); },
    setWebgl(value: boolean) { webgl = value; listeners.forEach((listener) => listener()); },
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  };
}
