import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { RequestError } from "@/lib/request-security";
import { practiceProject } from "@/features/learning/templates";
import { findLesson } from "@/features/learning/registry";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), owned: vi.fn(), provider: vi.fn() }));
vi.mock("@/features/projects/server/service", () => ({ authenticatedClient: mocks.auth }));
vi.mock("./provider", () => ({ generateCirra: mocks.provider }));
import { answerCirra } from "./service";
const owner = "11111111-1111-4111-8111-111111111111";
const input = () => ({ requestId: crypto.randomUUID(), mode: "tutor", message: "Kenapa resistor diperlukan untuk LED?", lessonId: "lesson.led-resistor" });
const request = (body: unknown, origin = "http://localhost", account = owner) => new Request("http://localhost/api/ai/cirra", { method: "POST", headers: { origin, "content-type": "application/json", "x-vircuit-account": account }, body: JSON.stringify(body) });
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv("GEMINI_API_KEY", "test-only"); vi.stubEnv("CIRRA_MODEL_FAST", "gemini-3.1-flash-lite"); vi.stubEnv("CIRRA_MODEL_SMART", "gemini-3.5-flash-lite"); vi.stubEnv("CIRRA_LIMIT_STORE", "memory"); vi.stubEnv("CIRRA_REQUESTS_PER_MINUTE", "60");
  mocks.auth.mockResolvedValue({ user: { id: owner }, client: { from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: mocks.owned }) }) }) }) } });
  mocks.provider.mockResolvedValue({ result: { mode: "tutor", answer: "Aku jelaskan: resistor membatasi arus untuk LED kamu.", observations: [], suggestions: [], hints: ["Periksa jalur resistor seri."], references: [] }, latency: 1, tokens: 10 });
});
afterEach(() => vi.unstubAllEnvs());
it("answers Tutor with authenticated, authored context and server model selection", async () => {
  const result = await answerCirra(request(input())); expect(result.result.answer).toContain("membatasi arus"); expect(result.modelCategory).toBe("FAST");
  expect(mocks.provider).toHaveBeenCalledWith(expect.objectContaining({ model: "gemini-3.1-flash-lite", system: expect.stringContaining("HINT-FIRST") }));
});
it("rejects unauthenticated, foreign project, external origin, forged result and arbitrary model before provider", async () => {
  mocks.auth.mockRejectedValueOnce(new RequestError("Masuk", 401)); await expect(answerCirra(request(input()))).rejects.toThrow("Masuk");
  await expect(answerCirra(request(input(), "https://evil.invalid"))).rejects.toThrow("Asal permintaan");
  await expect(answerCirra(request(input(), "http://localhost", crypto.randomUUID()))).rejects.toThrow("Session akun");
  for (const extra of [{ model: "custom" }, { passed: true }, { user_id: owner }]) await expect(answerCirra(request({ ...input(), ...extra }))).rejects.toThrow("belum valid");
  mocks.owned.mockResolvedValueOnce({ data: null }); await expect(answerCirra(request({ ...input(), projectId: crypto.randomUUID() }))).rejects.toThrow("bukan milikmu");
  expect(mocks.provider).not.toHaveBeenCalled();
});
it("Debugger sees actual D4 wiring/D5 program and deterministic failed challenge evidence", async () => {
  const project = practiceProject(findLesson("lesson.blink")!.lesson);
  project.wires[0].from.pinId = "D4";
  project.code.source = "void setup(){pinMode(5,OUTPUT);}void loop(){digitalWrite(5,HIGH);delay(100);}";
  mocks.provider.mockResolvedValueOnce({ result: { mode: "debugger", answer: "Aku lihat LED kamu terhubung ke D4, tetapi kode mengirim HIGH ke pin 5. Periksa kecocokan kedua pin ini.", observations: ["Wiring D4 berbeda dari kode D5."], suggestions: ["Periksa pin output yang ingin kamu pakai."], hints: [], references: ["component:led", "line:1"] }, latency: 1, tokens: 20 });
  const result = await answerCirra(request({ ...input(), mode: "debugger", lessonId: "lesson.blink", challengeId: "challenge.blink", project }));
  expect(result.modelCategory).toBe("SMART"); expect(result.result.answer).toContain("D4");
  const call = mocks.provider.mock.calls[0][0];
  expect(call.data).toContain("board.D4"); expect(call.data).toContain("digitalWrite(5,HIGH)"); expect(call.data).toContain('"passed":false');
  expect(call.system).toContain("Evaluator menentukan pass/fail");
});
it("Project Assistant uses actual support catalog and guidance-only steps", async () => {
  mocks.provider.mockResolvedValueOnce({ result: { mode: "project-assistant", answer: "Aku bantu kamu menyusun smart plant monitoring secara bertahap. Sensor kelembapan tanah belum tersedia di simulator ini.", observations: [], suggestions: ["Tentukan tujuan pengukuran.", "Pilih board dan sensor untuk rancangan konseptual.", "Rencanakan alur sensor → board → indikator.", "Uji bagian yang didukung simulator sebelum perangkat nyata."], hints: [], references: [], blueprint: { goal: "Smart plant monitoring", constraints: ["Sensor kelembapan tanah belum didukung."], components: [{ name: "Arduino Uno", catalogType: "uno", support: "partial" }, { name: "Sensor kelembapan tanah", catalogType: null, support: "not-available" }], circuitPlan: ["Rancang input sensor menuju board."], programStructure: ["Baca input dan tampilkan indikator."], testing: ["Uji bagian yang tersedia di simulator."] } }, latency: 1, tokens: 40 });
  const result = await answerCirra(request({ requestId: crypto.randomUUID(), mode: "project-assistant", message: "Aku mau bikin smart plant monitoring." }));
  expect(result.modelCategory).toBe("SMART"); expect(result.result.suggestions).toHaveLength(4);
  const call = mocks.provider.mock.calls[0][0]; expect(call.data).toContain('"type":"dht22"'); expect(call.data).toContain('"support":"partial"');
  expect(call.system).toContain("GUIDANCE ONLY"); expect(call.system).toContain("Tidak mengubah project otomatis");
  expect(result).not.toHaveProperty("actions");
});
it("rejects invalid mode, IDs and oversized payload without calling Gemini", async () => {
  for (const change of [{ mode: "admin" }, { challengeId: "challenge.missing", lessonId: "lesson.blink" }, { lessonId: "lesson.missing" }, { message: "x".repeat(2001) }]) await expect(answerCirra(request({ ...input(), ...change }))).rejects.toThrow();
  await expect(answerCirra(request({ ...input(), message: "x".repeat(180001) }))).rejects.toThrow();
  expect(mocks.provider).not.toHaveBeenCalled();
});
it("fails closed for production memory limiter and missing shared-store credentials", async () => {
  vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("CIRRA_LOCAL_PREVIEW", ""); vi.stubEnv("SUPABASE_SECRET_KEY", "");
  await expect(answerCirra(request(input()))).rejects.toThrow("belum dikonfigurasi");
  vi.stubEnv("CIRRA_LIMIT_STORE", "database"); await expect(answerCirra(request(input()))).rejects.toThrow("belum dikonfigurasi");
  expect(mocks.provider).not.toHaveBeenCalled();
});
