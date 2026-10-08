import { beforeEach, expect, it } from "vitest";
import { clearCirraAccount, setMessages, useCirraSession } from "./session-store";
beforeEach(() => useCirraSession.setState({ threads: {}, launch: null }));
it("bounds history and clears only the signing-out account", () => {
  setMessages("a:project:tutor", Array.from({ length: 20 }, (_, n) => ({ id: String(n), role: "user", text: "question" })));
  setMessages("b:project:tutor", [{ id: "1", role: "assistant", text: "other account" }]);
  expect(useCirraSession.getState().threads["a:project:tutor"]).toHaveLength(12);
  clearCirraAccount("a"); expect(Object.keys(useCirraSession.getState().threads)).toEqual(["b:project:tutor"]);
});
