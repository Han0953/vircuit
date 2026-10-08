import { beforeEach, expect, it } from "vitest";
import { clearCirraAccount, clearCirraSessions, ensureSession, setMessages, updateSession, useCirraSession } from "./session-store";
beforeEach(clearCirraSessions);
it("bounds history and clears only the signing-out account", () => {
  setMessages("a:project:tutor", Array.from({ length: 20 }, (_, n) => ({ id: String(n), role: "user", text: "question" })));
  setMessages("b:project:tutor", [{ id: "1", role: "assistant", text: "other account" }]);
  expect(useCirraSession.getState().threads["a:project:tutor"]).toHaveLength(12);
  clearCirraAccount("a"); expect(Object.keys(useCirraSession.getState().threads)).toEqual(["b:project:tutor"]);
});

it("merges legacy modes once without losing IDs and isolates owners/scopes", () => {
  setMessages("a:project:tutor", [{ id: "1", role: "user", text: "concept" }]);
  setMessages("a:project:debugger", [{ id: "2", role: "assistant", text: "diagnostic" }]);
  const key = ensureSession("a", "project");
  expect(useCirraSession.getState().threads[key].map((message) => [message.id, message.mode])).toEqual([["1", "tutor"], ["2", "debugger"]]);
  updateSession(key, { draft: "unfinished", mode: "project-assistant", scroll: { top: 40, nearBottom: false } });
  ensureSession("a", "project", "tutor");
  expect(useCirraSession.getState().sessions[key]).toMatchObject({ draft: "unfinished", mode: "project-assistant", scroll: { top: 40 } });
  const other = ensureSession("b", "project"); const lesson = ensureSession("a", "lesson");
  expect(useCirraSession.getState().sessions[other].draft).toBe("");
  expect(useCirraSession.getState().threads[lesson]).toEqual([]);
  clearCirraAccount("a");
  expect(Object.keys(useCirraSession.getState().sessions)).toEqual([other]);
});

it("bounds draft-only scopes as well as messages", () => {
  for (let i = 0; i < 15; i++) updateSession(ensureSession("a", String(i)), { draft: String(i) });
  expect(Object.keys(useCirraSession.getState().sessions)).toHaveLength(10);
  expect(Object.keys(useCirraSession.getState().threads)).toHaveLength(10);
});
