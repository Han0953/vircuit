import { describe, expect, it } from "vitest";
import { safeDestination } from "./redirect";
import { loginSchema, registerSchema } from "./schema";
import { limitedJson, requireSameOrigin } from "../../lib/request-security";
describe("auth boundaries", () => {
  it("allowlists simulator redirects and preserves explicit Save intent only", () => {
    for (const path of ["//evil.test", "https://evil.test", "/\\evil.test", "/dashboard/evil", "/simulator?next=https://evil.test"]) expect(safeDestination(path)).toBe("/simulator");
    const target = `/simulator?save=1&draft=${crypto.randomUUID()}`;
    expect(safeDestination(target)).toBe(target);
    expect(safeDestination(undefined)).toBe("/dashboard");
    expect(safeDestination("/dashboard?next=https://evil.test")).toBe("/dashboard");
    expect(safeDestination("/dashboard/projects")).toBe("/dashboard/projects");
    const id = crypto.randomUUID();
    expect(safeDestination(`/simulator?project=${id}&owner=spoof`)).toBe(`/simulator?project=${id}`);
    expect(safeDestination(`/simulator?new=${id}`)).toBe(`/simulator?new=${id}`);
    expect(safeDestination("/simulator?project=invalid")).toBe("/simulator");
  });
  it("validates forms and rejects authority fields", () => {
    expect(registerSchema.safeParse({ email: "test@example.com", password: "short" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "test@example.com", password: "password", user_id: "spoof" }).success).toBe(false);
  });
  it("preserves known learning destinations and rejects external or ambiguous practice redirects", () => {
    expect(safeDestination("/dashboard/learn/dasar-iot/blink?next=https://evil.test")).toBe("/dashboard/learn/dasar-iot/blink");
    expect(safeDestination("/dashboard/learn/no-course/no-lesson")).toBe("/dashboard/learn");
    const intent = crypto.randomUUID();
    const target = `/simulator?lesson=lesson.blink&practice=${intent}`;
    expect(safeDestination(target)).toBe(target);
    expect(safeDestination(`${target}&new=${crypto.randomUUID()}`)).toBe("/simulator");
    expect(safeDestination("/simulator?lesson=lesson.blink&practice=bad")).toBe("/simulator");
  });
  it("rejects cross-origin mutation and oversized streams", async () => {
    const request = new Request("https://vircuit.test/api/projects", { method: "POST", headers: { origin: "https://evil.test", "Content-Type": "application/json" }, body: "{}" });
    expect(() => requireSameOrigin(request)).toThrow();
    await expect(limitedJson(new Request("https://vircuit.test", { method: "POST", body: "x".repeat(100) }), 20)).rejects.toThrow("Payload terlalu besar");
  });
});
