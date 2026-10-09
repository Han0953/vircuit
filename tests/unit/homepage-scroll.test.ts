import { describe, expect, it } from "vitest";
import { scrolledHeader, showBackToTop, smoothScrollEligible } from "@/components/marketing/scenes/scroll-policy";

describe("homepage scroll policy", () => {
  const desktop = { desktop: true, fine: true, coarse: false, reduced: false, touch: false, locked: false };
  it("only enables smoothing on eligible desktops", () => {
    expect(smoothScrollEligible(desktop)).toBe(true);
    for (const flag of ["coarse", "reduced", "touch", "locked"] as const) expect(smoothScrollEligible({ ...desktop, [flag]: true })).toBe(false);
    expect(smoothScrollEligible({ ...desktop, desktop: false })).toBe(false);
    expect(smoothScrollEligible({ ...desktop, fine: false })).toBe(false);
  });
  it("keeps discrete controls stable inside hysteresis bands", () => {
    expect(scrolledHeader(false, 80)).toBe(false);
    expect(scrolledHeader(true, 80)).toBe(true);
    expect(scrolledHeader(true, 48)).toBe(false);
    expect(showBackToTop(false, 850, 900)).toBe(false);
    expect(showBackToTop(true, 850, 900)).toBe(true);
    expect(showBackToTop(true, 800, 900)).toBe(false);
  });
});
