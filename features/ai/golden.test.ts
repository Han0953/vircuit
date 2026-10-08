import { expect, it } from "vitest";
import { fixture } from "@/features/simulator/tests/fixtures";
import { requestSchema } from "./contracts";
import { buildContext } from "./context";
import { buildPrompt } from "./prompts";
it("grounds invalid ESP32 output pins in board capabilities and actual program", () => {
  const project = fixture({ board: "esp32", led: "led", r: "resistor" }, [["board.GPIO34", "r.1"], ["r.2", "led.A"], ["led.K", "board.GND"]], "void setup(){pinMode(34,OUTPUT);}void loop(){digitalWrite(34,HIGH);}");
  const input = requestSchema.parse({ requestId: crypto.randomUUID(), mode: "debugger", message: "Kenapa output gagal?", project });
  const built = buildContext(input);
  expect(built.context.project!.board!.pins.find((p) => p.id === "GPIO34")!.output).toBe(false);
  expect(buildPrompt(input, built).data).toContain("digitalWrite(34,HIGH)");
});
it("exposes missing ground without inventing a connected return path", () => {
  const project = fixture({ board: "uno", led: "led", r: "resistor" }, [["board.D4", "r.1"], ["r.2", "led.A"]], "void setup(){pinMode(4,OUTPUT);}void loop(){digitalWrite(4,HIGH);}");
  const input = requestSchema.parse({ requestId: crypto.randomUUID(), mode: "debugger", message: "LED tidak menyala", project });
  const built = buildContext(input); expect(built.context.circuit!.connections.flatMap((w) => [w.from, w.to])).not.toContain("board.GND");
  expect(built.context.project!.components.some((c) => c.id === "led")).toBe(true);
});
it("includes disconnected DHT22 diagnostic and real pin definitions", () => {
  const project = fixture({ board: "esp32", sensor: "dht22" }, [], "void setup(){}void loop(){delay(100);}");
  const input = requestSchema.parse({ requestId: crypto.randomUUID(), mode: "debugger", message: "Sensor tidak merespons", project });
  const built = buildContext(input);
  expect(built.context.diagnostics.some((p) => p.id === "floating-sensor")).toBe(true);
  expect(built.context.circuit!.connections).toEqual([]);
});
