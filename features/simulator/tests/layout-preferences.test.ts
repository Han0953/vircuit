import { describe, expect, it } from "vitest";
import { defaultLayout, parseLayout } from "../ui/workspace/layout-preferences";
describe("layout preferences", () => {
  it("recovers malformed storage", () => { expect(parseLayout("{")).toEqual(defaultLayout); });
  it("clamps sizes and restores independent visibility", () => {
    const value = parseLayout(JSON.stringify({ left: { visible: false, size: 99 }, right: { visible: true, size: -5 }, bottom: { visible: false, size: 45 } }));
    expect(value).toEqual({ left: { visible: false, size: 32 }, right: { visible: true, size: 15 }, bottom: { visible: false, size: 45 } });
  });
});
