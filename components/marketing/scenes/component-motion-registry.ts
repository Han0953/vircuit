export const primaryTypes = ["uno", "breadboard-mini", "led", "resistor", "button", "pot"] as const;
export const secondaryTypes = ["nano", "esp32", "breadboard-half", "breadboard-full", "dht22", "relay", "fan"] as const;
export type HardwareType = typeof primaryTypes[number] | typeof secondaryTypes[number];
type MotionDefinition = { label: string; behavior: string; renderer: "webgl" | "svg"; range: readonly [number, number]; mobileAmplitude: number; fallback: "svg"; reduced: "assembled" };
const entry = (label: string, behavior: string, renderer: MotionDefinition["renderer"], range: readonly [number, number]): MotionDefinition => ({ label, behavior, renderer, range, mobileAmplitude: .5, fallback: "svg", reduced: "assembled" });
export const componentMotion: Record<HardwareType, MotionDefinition> = {
  uno: entry("Arduino Uno", "board assembly / pin focus", "webgl", [0, 1]),
  "breadboard-mini": entry("Mini breadboard", "alignment / wire reveal", "webgl", [.15, 1]),
  led: entry("LED", "placement / output brightness", "webgl", [.18, 1]),
  resistor: entry("Resistor", "rotation / series placement", "webgl", [.20, 1]),
  button: entry("Push button", "press / release", "webgl", [.22, 1]),
  pot: entry("Potentiometer", "knob rotation / signal", "webgl", [.24, 1]),
  nano: entry("Arduino Nano", "pin row reveal", "svg", [0, 1]),
  esp32: entry("ESP32 DevKitC", "module tilt / detail reveal", "svg", [0, 1]),
  "breadboard-half": entry("Half breadboard", "rail trace", "svg", [0, 1]),
  "breadboard-full": entry("Full breadboard", "strip sweep", "svg", [0, 1]),
  dht22: entry("DHT22", "data signal", "svg", [0, 1]),
  relay: entry("Relay", "contact switching", "svg", [0, 1]),
  fan: entry("Motor / fan", "controlled blade rotation", "svg", [0, 1]),
};
