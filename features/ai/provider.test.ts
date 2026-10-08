import { beforeEach, expect, it, vi } from "vitest";
import { requestSchema } from "./contracts";
import { modelCategory } from "./model-router";
const mocks = vi.hoisted(() => ({ generate: vi.fn() }));
vi.mock("@google/genai", () => ({ GoogleGenAI: class { models = { generateContent: mocks.generate }; }, ApiError: class extends Error { status = 503; } }));
import { generateCirra } from "./provider";
const options = () => ({ apiKey: "test-only", model: "gemini-3.1-flash-lite", mode: "tutor" as const, system: "test", data: "test", timeoutMs: 1000, maxOutputTokens: 400, signal: new AbortController().signal });
beforeEach(() => vi.resetAllMocks());
it("routes simple tutor FAST and circuit/complex work SMART without arbitrary model input", () => {
  const input = requestSchema.parse({ requestId: crypto.randomUUID(), mode: "tutor", message: "Apa fungsi resistor?" });
  expect(modelCategory(input, false)).toBe("FAST");
  expect(modelCategory(input, true)).toBe("SMART");
  expect(modelCategory({ ...input, mode: "debugger" }, false)).toBe("SMART");
  expect(modelCategory({ ...input, mode: "project-assistant" }, false)).toBe("SMART");
  expect(requestSchema.safeParse({ ...input, model: "arbitrary" }).success).toBe(false);
});
it("validates structured output and never returns raw provider errors", async () => {
  mocks.generate.mockResolvedValueOnce({ text: JSON.stringify({ mode: "tutor", answer: "Aku bantu kamu memahami resistor.", observations: [], suggestions: [], hints: [], references: [] }), usageMetadata: { totalTokenCount: 25 } });
  expect((await generateCirra(options())).result.answer).toContain("resistor");
  mocks.generate.mockResolvedValueOnce({ text: "not JSON" });
  await expect(generateCirra(options())).rejects.toThrow("jawaban yang valid");
  mocks.generate.mockRejectedValueOnce(new Error("SECRET test-only"));
  await expect(generateCirra(options())).rejects.toThrow("belum bisa terhubung");
});
it("does not call the provider for an already canceled request", async () => {
  const controller = new AbortController(); controller.abort();
  await expect(generateCirra({ ...options(), signal: controller.signal })).rejects.toThrow("dibatalkan");
  expect(mocks.generate).not.toHaveBeenCalled();
});
