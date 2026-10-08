import { beforeEach, expect, it, vi } from "vitest";
import type { CirraRequest } from "../contracts";
import { fixture } from "@/features/simulator/tests/fixtures";
import { createChatRequest } from "./chat-request";
import { clearCirraAccount, clearCirraSessions, ensureSession, updateSession, useCirraSession } from "./session-store";

beforeEach(clearCirraSessions);
function reply(input: CirraRequest, override = {}) {
  return Response.json({ requestId: input.requestId, result: { mode: input.mode, answer: "Jawaban", observations: [], suggestions: [], hints: [], references: [] }, modelCategory: "FAST", context: { sources: [], truncated: [], challengeActive: false, hintLevel: 1 }, ...override });
}
const state = (key: string) => useCirraSession.getState().sessions[key];

it("appends immediately, guards duplicate sends, validates whitespace and records mode", async () => {
  const key = ensureSession("a", "project"); updateSession(key, { draft: "hello" });
  let resolve!: (response: Response) => void;
  const fetcher = vi.fn<typeof fetch>().mockImplementation(() => new Promise((r) => { resolve = r; }));
  const request = createChatRequest("a", key, fetcher);
  expect(request.send("   ", "tutor", 1, () => ({}))).toBe(false);
  expect(request.send("hello", "debugger", 1, () => ({}))).toBe(true);
  expect(request.send("hello", "tutor", 1, () => ({}))).toBe(false);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(state(key)).toMatchObject({ draft: "", status: "pending" });
  expect(useCirraSession.getState().threads[key][0]).toMatchObject({ text: "hello", mode: "debugger" });
  const input = JSON.parse(String(fetcher.mock.calls[0][1]?.body)) as CirraRequest;
  resolve(reply(input));
  await vi.waitFor(() => expect(state(key).status).toBe("completed"));
  expect(useCirraSession.getState().threads[key][1].mode).toBe("debugger");
  request.dispose();
});

it("retries immutable context and mode without duplicating the user's bubble", async () => {
  const key = ensureSession("a", "project");
  const project = fixture({ board: "uno" }, [], "void setup(){}void loop(){}");
  const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({ error: "raw provider details" }, { status: 503 })).mockImplementationOnce(async (_, options) => reply(JSON.parse(String(options?.body)) as CirraRequest));
  const request = createChatRequest("a", key, fetcher);
  request.send("help", "debugger", 2, () => ({ project }));
  await vi.waitFor(() => expect(state(key).status).toBe("failed"));
  expect(state(key).error).not.toContain("provider");
  project.code.source = "changed"; updateSession(key, { mode: "tutor" });
  expect(request.retry()).toBe(true); expect(request.retry()).toBe(false);
  await vi.waitFor(() => expect(state(key).status).toBe("completed"));
  const input = JSON.parse(String(fetcher.mock.calls[1][1]?.body)) as CirraRequest;
  expect(input.mode).toBe("debugger"); expect(input.project?.code.source).toBe("void setup(){}void loop(){}");
  expect(useCirraSession.getState().threads[key].filter((message) => message.role === "user")).toHaveLength(1);
  request.dispose();
});

it.each(["cancel", "dispose", "logout"] as const)("%s rejects late responses and never writes another scope", async (action) => {
  const key = ensureSession("a", "project"), other = ensureSession("b", "lesson");
  let resolve!: (response: Response) => void;
  const fetcher = vi.fn<typeof fetch>().mockImplementation(() => new Promise((r) => { resolve = r; }));
  const request = createChatRequest("a", key, fetcher);
  request.send("help", "tutor", 1, () => ({}));
  const input = JSON.parse(String(fetcher.mock.calls[0][1]?.body)) as CirraRequest;
  if (action === "logout") clearCirraAccount("a"); else request[action]();
  resolve(reply(input)); await new Promise((r) => setTimeout(r, 0));
  expect(useCirraSession.getState().threads[key]?.filter((message) => message.role === "assistant") ?? []).toHaveLength(0);
  expect(useCirraSession.getState().threads[other]).toEqual([]);
  expect(state(key)?.status).not.toBe("pending");
  request.dispose();
});

it.each([401, 429, 504])("handles HTTP %i without leaking provider errors", async (status) => {
  const key = ensureSession("a", "project");
  const request = createChatRequest("a", key, vi.fn<typeof fetch>().mockResolvedValue(Response.json({ error: "secret internal model" }, { status })));
  request.send("help", "tutor", 1, () => ({}));
  await vi.waitFor(() => expect(state(key).requestId).toBeNull());
  expect(state(key).status).toBe(status === 401 ? "auth-expired" : status === 429 ? "rate-limited" : "failed");
  expect(state(key).error).not.toMatch(/secret|internal|model/);
  request.dispose();
});

it("rejects mismatched response identity and invalid contexts without losing drafts", async () => {
  const key = ensureSession("a", "project"); updateSession(key, { draft: "keep" });
  const fetcher = vi.fn<typeof fetch>().mockImplementation(async (_, options) => reply(JSON.parse(String(options?.body)) as CirraRequest, { requestId: crypto.randomUUID() }));
  const request = createChatRequest("a", key, fetcher);
  expect(request.send("help", "tutor", 1, () => ({ lessonId: "invalid spaces" }))).toBe(false);
  expect(state(key).draft).toBe("keep");
  request.send("help", "tutor", 1, () => ({}));
  await vi.waitFor(() => expect(state(key).status).toBe("failed"));
  expect(useCirraSession.getState().threads[key]).toHaveLength(1);
  request.dispose();
});
