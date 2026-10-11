import { describe, expect, it } from "vitest";
import { dashboardMotionTokens } from "@/features/dashboard/motion/dashboard-motion-tokens";

describe("dashboard motion tokens", () => {
  it("defines safe durations for productive dashboard use", () => {
    expect(dashboardMotionTokens.duration.micro).toBeLessThan(0.2);
    expect(dashboardMotionTokens.duration.card).toBeLessThanOrEqual(0.4);
    expect(dashboardMotionTokens.duration.reveal).toBeLessThanOrEqual(0.5);
  });

  it("sets mobile distances smaller than desktop to prevent layout disorientation", () => {
    expect(dashboardMotionTokens.distance.mobileY).toBeLessThan(
      dashboardMotionTokens.distance.desktopY
    );
    expect(dashboardMotionTokens.distance.mobileX).toBeLessThan(
      dashboardMotionTokens.distance.desktopX
    );
  });

  it("provides smooth standard easing curve", () => {
    expect(dashboardMotionTokens.ease.standard).toBe("power2.out");
    expect(dashboardMotionTokens.ease.smooth).toBe("power3.out");
  });

  it("configures non-blocking stagger intervals", () => {
    expect(dashboardMotionTokens.stagger.fast).toBeLessThanOrEqual(0.04);
    expect(dashboardMotionTokens.stagger.normal).toBeLessThanOrEqual(0.06);
  });
});
