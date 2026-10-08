import { expect, it } from "vitest";
import { fixture } from "../tests/fixtures";
import { runtimeProjectChanged } from "./project-changes";

it("keeps the worker alive for visual move, rotation, label, color and viewport changes", () => {
  const p = fixture({ board: "uno", led: "led" }, [["board.D13", "led.A"]], "void setup(){}void loop(){}");
  const next = structuredClone(p);
  next.components[0].position = { x: 900, y: -40 }; next.components[1].rotation = 270;
  next.components[0].label = "Different label"; next.wires[0].color = "red"; next.viewport.zoom = 2;
  expect(runtimeProjectChanged(p, next)).toBe(false);
  next.wires[0].from.pinId = "D12"; expect(runtimeProjectChanged(p, next)).toBe(true);
});

it("restarts for code, properties, endpoint, board, added and deleted component changes", () => {
  const p = fixture({ board: "uno", led: "led", pot: "pot" }, [["board.D13", "led.A"]], "void setup(){}void loop(){}");
  const edits = [
    (n: typeof p) => { n.code.source += " "; },
    (n: typeof p) => { n.components[2].properties.value = 20; },
    (n: typeof p) => { n.components[1].type = "button"; },
    (n: typeof p) => { n.components.pop(); },
    (n: typeof p) => { n.wires.pop(); },
    (n: typeof p) => { n.settings.boardId = null; },
  ];
  for (const edit of edits) { const next = structuredClone(p); edit(next); expect(runtimeProjectChanged(p, next)).toBe(true); }
});
