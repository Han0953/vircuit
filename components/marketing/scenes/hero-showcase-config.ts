export const heroBoards = ["uno", "nano", "esp32"] as const;
export type HeroBoard = typeof heroBoards[number];
// Activation to next activation: entrance + hold + exit = exactly five seconds.
export const heroTiming = { enter: 1.75, hold: 2750, exit: .5 };
export const heroScenes = {
  uno: { name: "Arduino Uno R3", status: "Simulasi edukatif", pin: "D3", frame: { x: 44, y: 84, width: 396, height: 308 }, routeY: 130, entry: [-20, 16], exit: [-22, -8] },
  nano: { name: "Arduino Nano", status: "Visual saja", pin: "D3", frame: { x: 150, y: 52, width: 126, height: 342 }, routeY: 170, entry: [0, 24], exit: [8, -24] },
  esp32: { name: "ESP32 DevKit", status: "Subset edukatif", pin: "GPIO23", frame: { x: 116, y: 48, width: 158.4, height: 345.6 }, routeY: 150, entry: [22, 20], exit: [-18, -8] },
} as const;

export function stageAnchor(frame: { x: number; y: number; width: number; height: number }, layout: { width: number; height: number }, anchor: { x: number; y: number }) {
  return { x: frame.x + anchor.x * frame.width / layout.width, y: frame.y + anchor.y * frame.height / layout.height };
}
