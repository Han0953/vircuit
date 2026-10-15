import { describe, expect, it } from "vitest";
import { activeDashboardLink, dashboardLinks, dashboardPath, demoHref, sidebarPreference, swipeDestination } from "./navigation";
import { preferencesSchema, defaultPreferences } from "@/features/settings/contracts";

describe("adaptive dashboard navigation", () => {
  const sample = { dx: -90, dy: 4, elapsed: 300, startX: 180, width: 390 };
  it("maps preview navigation without changing authenticated destinations", () => {
    for (const link of dashboardLinks) expect(dashboardPath(demoHref(link.href))).toBe(link.href);
    expect(dashboardPath("/dashboard/projects")).toBe("/dashboard/projects");
    expect(dashboardPath("/demolition")).toBe("/demolition");
  });
  it("keeps real destinations reachable and highlights nested learning", () => {
    expect(dashboardLinks.map((link) => link.href)).toEqual(["/dashboard", "/dashboard/learn", "/dashboard/cirra", "/dashboard/projects", "/dashboard/challenges", "/dashboard/progress", "/dashboard/pengaturan"]);
    expect(activeDashboardLink("/dashboard/cirra", "/dashboard/cirra")).toBe(true);
    expect(activeDashboardLink("/dashboard/learn/course/lesson", "/dashboard/learn")).toBe(true);
    expect(activeDashboardLink("/dashboard/projects", "/dashboard")).toBe(false);
  });
  it("moves between safe overview routes while skipping Cirra and More", () => {
    expect(swipeDestination("/dashboard", sample)).toBe("/dashboard/learn");
    expect(swipeDestination("/dashboard/learn", sample)).toBe("/dashboard/projects");
    expect(swipeDestination("/dashboard/projects", sample)).toBeNull();
    expect(swipeDestination("/dashboard/learn", { ...sample, dx: 90 })).toBe("/dashboard");
  });
  it("rejects native edge, vertical, small and unsafe-page gestures", () => {
    for (const pathname of ["/simulator", "/simulator/code", "/dashboard/pengaturan", "/dashboard/learn/course/lesson"]) expect(swipeDestination(pathname, sample)).toBeNull();
    for (const patch of [{ startX: 10 }, { startX: 380 }, { dy: 35 }, { dx: -20 }, { dx: -45, elapsed: 500 }]) expect(swipeDestination("/dashboard", { ...sample, ...patch })).toBeNull();
    expect(swipeDestination("/dashboard", { ...sample, dx: -45, elapsed: 70 })).toBe("/dashboard/learn");
  });
  it("restores only the verified owner's sidebar and upgrades existing preferences", () => {
    expect(sidebarPreference("user-one:collapsed", "user-one")).toBe("collapsed");
    expect(sidebarPreference("user-one:collapsed", "user-two")).toBe("expanded");
    const old = { ...defaultPreferences, snap: true, motion: "reduced" };
    delete (old as Partial<typeof old>).dashboardSidebar;
    expect(preferencesSchema.parse(old)).toMatchObject({ dashboardSidebar: "expanded", snap: true, motion: "reduced" });
  });
});
