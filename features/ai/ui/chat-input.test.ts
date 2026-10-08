import { expect, it } from "vitest";
import { enterSubmits } from "./chat-input";
it("sends on desktop Enter while keeping Shift, composition and touch multiline", () => {
  const input = { key: "Enter", shift: false, composing: false, desktop: true, touch: false };
  expect(enterSubmits(input)).toBe(true);
  for (const override of [{ shift: true }, { composing: true }, { desktop: false }, { touch: true }, { key: "a" }]) expect(enterSubmits({ ...input, ...override })).toBe(false);
});
