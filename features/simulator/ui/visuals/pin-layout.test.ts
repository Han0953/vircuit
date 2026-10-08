import { describe, expect, it } from "vitest";
import { catalog } from "../../catalog/registry";
import { rotateLayout, visualLayout } from "./pin-layout";

describe("visual pin contract", () => {
  for (const definition of catalog) it(`${definition.key}: every logical pin has one distinct anchor at every rotation`, () => {
    const base = visualLayout(definition);
    for (const rotation of [0, 45, 90, 180, 270, 359]) {
      const layout = rotateLayout(base, rotation);
      expect(layout.anchors.map((a) => a.pin.id)).toEqual(definition.pins.map((pin) => pin.id));
      expect(new Set(layout.anchors.map((a) => `${a.x},${a.y}`)).size).toBe(definition.pins.length);
      for (const anchor of layout.anchors) {
        expect(anchor.x).toBeGreaterThanOrEqual(0); expect(anchor.x).toBeLessThanOrEqual(layout.width);
        expect(anchor.y).toBeGreaterThanOrEqual(0); expect(anchor.y).toBeLessThanOrEqual(layout.height);
      }
    }
  });
  it("breadboard strip spacing keeps the central electrical gap and separate rail columns", () => {
    const board = visualLayout(catalog.find((d) => d.key === "breadboard-half")!);
    const x = (id: string) => board.anchors.find((a) => a.pin.id === id)!.x;
    expect(x("F1") - x("E1")).toBeGreaterThan(x("B1") - x("A1"));
    expect(x("L+1")).toBeLessThan(x("A1")); expect(x("R-1")).toBeGreaterThan(x("J1"));
  });
  it("board adapters place supported pins on the reference header rows without inventing pins", () => {
    const nano = visualLayout(catalog.find((d) => d.key === "nano")!);
    expect(nano.anchors.find((p) => p.pin.id === "D13")).toMatchObject({ x: 24, y: 48, side: "left" });
    expect(nano.anchors.find((p) => p.pin.id === "D0")).toMatchObject({ x: 144, y: 360, side: "right" });
    const esp = visualLayout(catalog.find((d) => d.key === "esp32")!);
    expect(esp.anchors.find((p) => p.pin.id === "5V")).toMatchObject({ x: 24, y: 480, side: "left" });
    expect(esp.anchors.find((p) => p.pin.id === "GPIO23")).toMatchObject({ x: 240, y: 72, side: "right" });
    expect(esp.anchors.some((p) => p.pin.id === "EN")).toBe(false);
  });
});
