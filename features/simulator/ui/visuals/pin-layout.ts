import type { ComponentDefinition, PinDefinition } from "../../types/project";
import { normalizeRotation, rotatePoint } from "../../geometry/rotation";

export const visualPitch = 24;
export const pinHitSize = 20;
export type Anchor = { pin: PinDefinition; x: number; y: number; side: "top" | "bottom" | "left" | "right" };
export type Bounds = { x: number; y: number; width: number; height: number };
export type VisualLayout = { width: number; height: number; anchors: Anchor[]; interaction?: Bounds };

export function visualLayout(definition: ComponentDefinition): VisualLayout {
  const pins = definition.pins;
  const p = visualPitch;
  if (definition.groups) {
    const rows = Math.max(...pins.map((pin) => Number(pin.id.match(/\d+$/)?.[0])));
    const rails = pins.some((pin) => pin.id.startsWith("L+"));
    const offset = rails ? 86 : 30;
    return { width: rails ? 440 : 328, height: rows * p + 64, anchors: pins.map((pin) => {
      const row = Number(pin.id.match(/\d+$/)?.[0]);
      const column = "ABCDEFGHIJ".indexOf(pin.id[0]);
      const x = column >= 0 ? offset + column * p + (column >= 5 ? p * 2 : 0) : pin.id[0] === "L" ? (pin.id[1] === "+" ? 22 : 46) : (pin.id[1] === "+" ? 394 : 418);
      return { pin, x, y: 44 + (row - 1) * p, side: "top" };
    }) };
  }
  if (definition.key === "uno") {
    return { width: p * 27, height: p * 21, anchors: pins.map((pin, index) => index < 14
      ? { pin, x: p * (24 - index) + (index < 8 ? 0 : -p / 2), y: p, side: "top" }
      : pin.id.startsWith("A") ? { pin, x: p * (19 + index - 14), y: p * 20, side: "bottom" }
      : { pin, x: p * (11 + index - 20), y: p * 20, side: "bottom" }) };
  }
  if (definition.key === "esp32" || definition.key === "nano") {
    const nano = definition.key === "nano";
    const width = p * (nano ? 7 : 11), height = p * (nano ? 19 : 24);
    const left = nano ? ["D13", "3V3", "", "A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7", "5V", "", "GND"]
      : ["3V3", "", "GPIO36", "GPIO39", "GPIO34", "GPIO35", "GPIO32", "GPIO33", "GPIO25", "GPIO26", "GPIO27", "GPIO14", "GPIO12", "GND", "GPIO13", "", "", "", "5V"];
    const right = nano ? ["D12", "D11", "D10", "D9", "D8", "D7", "D6", "D5", "D4", "D3", "D2", "", "", "D0", "D1"]
      : ["", "GPIO23", "GPIO22", "", "", "GPIO21", "", "GPIO19", "GPIO18", "GPIO5", "GPIO17", "GPIO16", "GPIO4", "", "GPIO2", "GPIO15"];
    return { width, height, anchors: pins.map((pin) => {
      const onLeft = left.includes(pin.id);
      const row = (onLeft ? left : right).indexOf(pin.id);
      if (row < 0) throw new Error(`Pin visual belum dipetakan: ${definition.key}.${pin.id}`);
      return { pin, x: onLeft ? p : width - p, y: p * 2 + row * p, side: onLeft ? "left" : "right" };
    }) };
  }
  const sizes: Record<string, { width: number; height: number; interaction?: Bounds }> = {
    led: { width: p * 2, height: p * 3 },
    resistor: { width: p * 5, height: p * 2 },
    button: { width: p * 4, height: p * 3, interaction: { x: p, y: p / 2, width: p * 2, height: p * 2 } },
    pot: { width: p * 4, height: p * 5, interaction: { x: p / 2, y: p / 2, width: p * 3, height: p * 3 } },
    dht22: { width: p * 4, height: p * 7 },
    relay: { width: p * 7, height: p * 9 },
    fan: { width: p * 8, height: p * 8 },
  };
  const size = sizes[definition.key] ?? { width: p * 10, height: Math.max(p * 6, Math.ceil(pins.length / 2) * p + p * 2) };
  return { ...size, anchors: pins.map((pin, index) => {
    if (definition.key === "resistor" || definition.key === "button") return { pin, x: index ? size.width - p / 2 : p / 2, y: size.height / 2, side: index ? "right" : "left" };
    if (definition.key === "led") return { pin, x: p / 2 + index * p, y: p * 2.5, side: "bottom" };
    if (definition.key === "pot") return { pin, x: p * (index + 1), y: size.height - p / 2, side: "bottom" };
    if (definition.key === "dht22") return { pin, x: p / 2 + (index === 2 ? 3 : index) * p, y: size.height - p / 2, side: "bottom" };
    if (definition.key === "relay") return { pin, x: p * (1.5 + (index % 3) * 2), y: index < 3 ? p / 2 : size.height - p / 2, side: index < 3 ? "top" : "bottom" };
    if (definition.key === "fan") return { pin, x: p * (index ? 5.5 : 2.5), y: size.height - p / 2, side: "bottom" };
    return { pin, x: index % 2 ? size.width - p : p, y: p + Math.floor(index / 2) * p, side: index % 2 ? "right" : "left" };
  }) };
}

export function rotateLayout(layout: VisualLayout, degrees: number): VisualLayout {
  const quarter = normalizeRotation(degrees) / 90;
  const width = quarter % 2 ? layout.height : layout.width;
  const height = quarter % 2 ? layout.width : layout.height;
  const sides = ["top", "right", "bottom", "left"] as const;
  return { width, height, anchors: layout.anchors.map((anchor) => ({ ...anchor,
    ...rotatePoint(anchor, layout.width, layout.height, degrees),
    side: sides[(sides.indexOf(anchor.side) + quarter) % 4],
  })) };
}
