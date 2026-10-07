import type { ComponentDefinition, PinDefinition, PinKind } from "../types/project";
const pin = (id: string, kind: PinKind = "passive"): PinDefinition => ({ id, label: id, kind });
const unoPins: PinDefinition[] = [
  ...Array.from({ length: 14 }, (_, n) => ({ ...pin(`D${n}`, "digital"), input: true, output: true, pwm: [3, 5, 6, 9, 10, 11].includes(n) })),
  ...Array.from({ length: 6 }, (_, n) => ({ ...pin(`A${n}`, "analog"), input: true, output: true, analog: true })),
  pin("5V", "power"), pin("3V3", "power"), pin("GND", "ground"),
];
const espPins: PinDefinition[] = [
  ...[2, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33, 34, 35, 36, 39].map((n) => ({ ...pin(`GPIO${n}`, n >= 32 ? "analog" : "digital"), input: true, output: n < 34, pwm: n < 34, analog: [32, 33, 34, 35, 36, 39].includes(n) })),
  pin("5V", "power"), pin("3V3", "power"), pin("GND", "ground"),
];
function definition(key: string, name: string, category: string, pins: PinDefinition[], defaults: Record<string, number> = {}): ComponentDefinition {
  return { key, name, category, pins, defaults, capabilities: category === "Boards" ? ["digital", "analog", "pwm", "serial"] : [key], support: "partial" };
}
function breadboard(key: string, name: string, rows: number, rails: boolean): ComponentDefinition {
  const groups: string[][] = [];
  for (let row = 1; row <= rows; row++) for (const letters of ["ABCDE", "FGHIJ"]) groups.push([...letters].map((letter) => `${letter}${row}`));
  if (rails) for (const side of ["L", "R"]) for (const polarity of ["+", "-"]) groups.push(Array.from({ length: rows }, (_, n) => `${side}${polarity}${n + 1}`));
  return { ...definition(key, name, "Breadboards", groups.flat().map((id) => pin(id))), groups };
}
export const catalog: ComponentDefinition[] = [
  definition("uno", "Arduino Uno R3", "Boards", unoPins),
  { ...definition("nano", "Arduino Nano (ATmega328P)", "Boards", [...unoPins, { ...pin("A6", "analog"), input: true, analog: true }, { ...pin("A7", "analog"), input: true, analog: true }]), support: "visual-only" },
  definition("esp32", "ESP32 DevKitC V4", "Boards", espPins),
  breadboard("breadboard-mini", "Mini Breadboard", 17, false), breadboard("breadboard-half", "Half-size Breadboard", 30, true), breadboard("breadboard-full", "Full-size Breadboard", 63, true),
  definition("led", "LED", "Basic", [pin("A"), pin("K")]),
  definition("resistor", "Resistor", "Basic", [pin("1"), pin("2")], { resistance: 220 }),
  definition("button", "Push Button", "Basic", [pin("1"), pin("2")], { pressed: 0 }),
  definition("pot", "Potentiometer", "Basic", [pin("VCC", "power"), pin("OUT", "analog"), pin("GND", "ground")], { value: 50 }),
  definition("dht22", "DHT22", "Sensors", [pin("VCC", "power"), pin("DATA", "data"), pin("GND", "ground")], { temperature: 25, humidity: 50 }),
  definition("relay", "Relay", "Actuators", [pin("VCC", "power"), pin("IN", "digital"), pin("GND", "ground"), pin("COM"), pin("NO"), pin("NC")]),
  definition("fan", "DC Motor / Fan", "Actuators", [pin("+"), pin("-")]),
];
export function getDefinition(type: string) {
  const result = catalog.find((definition) => definition.key === type);
  if (!result) throw new Error(`Komponen tidak didukung: ${type}`);
  return result;
}
