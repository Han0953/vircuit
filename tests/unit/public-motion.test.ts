import { describe, expect, it } from "vitest";
import { marketingScrollRoute, motion, validTreatment, publicRoutes, featureIds, cycleIds } from "@/components/marketing/scenes/public-motion-config";
import { projectCatalog } from "@/components/marketing/project-catalog";
import { motionDefinition, publicMotionManifest } from "@/components/marketing/scenes/public-motion-manifest";
describe("public motion contracts", () => {
  it("limits scroll ownership to the five marketing routes", () => {
    for (const route of ["/", ...publicRoutes]) expect(marketingScrollRoute(route)).toBe(true);
    for (const route of ["/masuk", "/daftar", "/dashboard", "/simulator", "/simulator/code", "/fitur/unknown"]) expect(marketingScrollRoute(route)).toBe(false);
  });
  it("keeps content treatments distinct from static exceptions", () => {
    for (const treatment of ["text", "identity", "details", "actions", "art", "control", "static"]) expect(validTreatment(treatment)).toBe(true);
    expect(validTreatment("opacity-only-section")).toBe(false);
    expect(validTreatment(undefined)).toBe(false);
  });
  it("preserves all catalog identities and bounded motion defaults", () => {
    expect(new Set(featureIds).size).toBe(10);
    expect(new Set(cycleIds).size).toBe(8);
    expect(new Set(projectCatalog.map((project) => project.slug)).size).toBe(9);
    expect(motion.mobileDistance).toBeLessThan(motion.desktopDistance);
    expect(motion.reveal).toBeLessThanOrEqual(.4);
  });
  it("maps each real catalog item to internal choreography", () => {
    for (const id of featureIds) for (const [suffix, treatment] of [["identity", "identity"], ["title", "text"], ["description", "text"], ["details", "details"]]) {
      expect(motionDefinition("/fitur", `${id}.${suffix}`)?.treatment).toBe(treatment);
    }
    for (const { slug } of projectCatalog) for (const [suffix, treatment] of [["identity", "identity"], ["title", "text"], ["description", "text"], ["concepts", "details"], ["art", "art"], ["action", "actions"]]) {
      expect(motionDefinition("/jelajahi", `project.${slug}.${suffix}`)?.treatment).toBe(treatment);
    }
    for (const stage of cycleIds) expect(motionDefinition("/belajar", `cycle.${stage}.outcome`)?.treatment).toBe("details");
  });
  it("has a visible reduced state for every rule and only a copyright exception", () => {
    const entries = Object.values(publicMotionManifest).flat();
    expect(entries.every((entry) => entry.reduced === "visible")).toBe(true);
    expect(entries.filter((entry) => entry.treatment === "static").map((entry) => entry.section)).toEqual(["footer"]);
    expect(motionDefinition("/fitur", "unknown.uncovered")).toBeUndefined();
    expect(motionDefinition("controls", "nav./")?.trigger).toBe("interaction");
  });
});
