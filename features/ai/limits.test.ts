import { expect, it } from "vitest";
import { MemoryLimits } from "./limits";
const policy = { minuteLimit: 2, dayLimit: 3, concurrency: 1, timeoutMs: 1000 };
it("counts failures, blocks replay/concurrency/minute/day and isolates accounts", () => {
  const limits = new MemoryLimits(); const now = 100000;
  const first = limits.reserve("a", "1", policy, now);
  expect(() => limits.reserve("a", "1", policy, now)).toThrow("sudah dikirim");
  expect(() => limits.reserve("a", "2", policy, now)).toThrow("memproses");
  limits.reserve("b", "1", policy, now).finish();
  first.finish(); limits.reserve("a", "2", policy, now + 1).finish();
  expect(() => limits.reserve("a", "3", policy, now + 2)).toThrow("Batas");
  limits.reserve("a", "3", policy, now + 60001).finish();
  expect(() => limits.reserve("a", "4", policy, now + 120000)).toThrow("Batas");
  expect(() => limits.reserve("a", "5", policy, now + 86400001)).not.toThrow();
});
it("expires abandoned leases without permitting duplicate active requests", () => {
  const limits = new MemoryLimits(); limits.reserve("a", "1", policy, 100000);
  expect(() => limits.reserve("a", "2", policy, 111001)).not.toThrow();
});
