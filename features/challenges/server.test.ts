import { beforeEach, describe, expect, it, vi } from "vitest";
import { practiceProject } from "@/features/learning/templates";
import { findLesson } from "@/features/learning/registry";
import { RequestError } from "@/lib/request-security";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), writer: vi.fn(), rpc: vi.fn(), owned: vi.fn() }));
vi.mock("@/features/projects/server/service", () => ({ authenticatedClient: mocks.auth }));
vi.mock("@/lib/supabase/writer", () => ({ progressWriter: mocks.writer }));
import { submitChallenge } from "./server";
import { recordLearningEvent } from "@/features/progress/server";
const owner = "11111111-1111-4111-8111-111111111111";
const input = () => ({ challengeId: "challenge.blink", version: 1, operationId: crypto.randomUUID(), project: practiceProject(findLesson("lesson.blink")!.lesson), bindings: {}, projectId: null });
const request = (body: unknown, account = owner, origin = "http://localhost") => new Request("http://localhost/api/challenges/submit", { method: "POST", headers: { "Content-Type": "application/json", Origin: origin, "X-Vircuit-Account": account }, body: JSON.stringify(body) });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: owner }, client: { from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: mocks.owned }) }) }) }) } });
  mocks.writer.mockReturnValue({ rpc: mocks.rpc });
  mocks.rpc.mockImplementation(async (_name, args) => ({ data: { id: crypto.randomUUID(), user_id: owner, passed: args.p_passed, fingerprint: args.p_fingerprint }, error: null }));
});
describe("server verified challenge boundary", () => {
  it("re-evaluates a real snapshot and writes only its own verdict", async () => {
    const result = await submitChallenge(request(input()));
    expect(result.verified).toBe(true); expect(result.result.passed).toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith("record_challenge_attempt", expect.objectContaining({ p_user_id: owner, p_passed: true }));
    const failed = input(); failed.project.code.source = "void setup(){}void loop(){delay(100);}";
    expect((await submitChallenge(request(failed))).result.passed).toBe(false);
  });
  it("rejects forged results/custom rules/owner and cross-account requests", async () => {
    for (const extra of [{ passed: true }, { rules: [] }, { user_id: owner }]) await expect(submitChallenge(request({ ...input(), ...extra }))).rejects.toThrow("Submission tidak valid");
    await expect(submitChallenge(request(input(), crypto.randomUUID()))).rejects.toThrow("Session akun berubah");
    await expect(submitChallenge(request(input(), owner, "https://evil.invalid"))).rejects.toThrow("Asal permintaan");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("rejects anonymous user and foreign cloud project before execution", async () => {
    mocks.auth.mockRejectedValueOnce(new RequestError("Masuk", 401));
    await expect(submitChallenge(request(input()))).rejects.toThrow("Masuk");
    mocks.owned.mockResolvedValueOnce({ data: null, error: null });
    await expect(submitChallenge(request({ ...input(), projectId: crypto.randomUUID() }))).rejects.toThrow("bukan milikmu");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("keeps a configuration blocker explicit and disallows manual challenge completion", async () => {
    mocks.writer.mockImplementationOnce(() => { throw new RequestError("Belum dikonfigurasi", 503); });
    await expect(submitChallenge(request(input()))).rejects.toThrow("Belum dikonfigurasi");
    await expect(recordLearningEvent(request({ lessonId: "lesson.blink", action: "complete" }))).rejects.toThrow("memerlukan tantangan");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
