import { describe, expect, it } from "vitest";
import { parseAuthEntry, transitionTarget } from "./transition-contract";
import { recoveryProof, validRecoveryProof } from "../recovery";

describe("auth presentation and recovery boundaries", () => {
  it("refuses external transition targets and expired or invalid callback entries", () => {
    const entry = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", target: "/dashboard/learn", expires: 20_000 };
    expect(parseAuthEntry(encodeURIComponent(JSON.stringify(entry)), 10_000)).toEqual(entry);
    expect(parseAuthEntry(JSON.stringify(entry), 30_000)).toBeNull();
    expect(parseAuthEntry(JSON.stringify({ ...entry, target: "//evil.test" }), 10_000)).toBeNull();
    expect(parseAuthEntry("broken")).toBeNull();
    expect(transitionTarget("https://evil.test")).toBe("/dashboard");
    expect(transitionTarget("/dashboard-fake")).toBe("/dashboard");
    expect(transitionTarget("/demo")).toBe("/demo");
    for (const path of ["/demo-fake", "/demo?next=https://evil.test", "/demo/unknown"]) expect(transitionTarget(path)).toBe("/dashboard");
    expect(parseAuthEntry(JSON.stringify({ ...entry, target: "/demo" }), 10_000)?.target).toBe("/demo");
    expect(transitionTarget("/simulator?save=1&draft=test")).toBe("/simulator?save=1&draft=test");
  });
  it("binds password recovery to the session that completed callback", () => {
    expect(validRecoveryProof(recoveryProof("session-one"), "session-one")).toBe(true);
    expect(validRecoveryProof(recoveryProof("session-one"), "session-two")).toBe(false);
    expect(validRecoveryProof(undefined, "session-one")).toBe(false);
    expect(validRecoveryProof("invalid", "session-one")).toBe(false);
  });
});
