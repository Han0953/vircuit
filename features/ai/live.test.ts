// Opt-in only. Normal tests never contact Gemini or load real credentials.
import { loadEnvFile } from "node:process";
import { beforeAll, describe, expect, it } from "vitest";
import { cirraConfig } from "./config";
import { requestSchema } from "./contracts";
import { buildContext } from "./context";
import { buildPrompt, validateAnswer } from "./prompts";
import { generateCirra } from "./provider";
import { practiceProject } from "@/features/learning/templates";
import { findLesson } from "@/features/learning/registry";
import { fixture } from "@/features/simulator/tests/fixtures";
describe.skipIf(process.env.CIRRA_LIVE_SMOKE !== "1")("live Gemini (explicit opt-in)", () => {
  beforeAll(() => { loadEnvFile(".env.local"); });
  it.each(["FAST", "SMART"] as const)("validates %s model and structured Cirra response", async (category) => {
    const config = cirraConfig();
    expect(config.fast).toBe("gemini-3.1-flash-lite"); expect(config.smart).toBe("gemini-3.5-flash-lite");
    const project = practiceProject(findLesson("lesson.blink")!.lesson);
    project.wires[0].from.pinId = "D4";
    project.code.source = "void setup(){pinMode(5,OUTPUT);}void loop(){digitalWrite(5,HIGH);delay(100);}";
    const input = requestSchema.parse({ requestId: crypto.randomUUID(), mode: category === "FAST" ? "tutor" : "debugger", message: category === "FAST" ? "Kenapa LED membutuhkan resistor? Jelaskan singkat." : "LED terhubung D4, tetapi kode memakai pin 5. Bantu aku memeriksa ketidaksesuaian ini.", ...(category === "SMART" ? { project } : { lessonId: "lesson.led-resistor" }) });
    const built = buildContext(input); const prompt = buildPrompt(input, built);
    const response = await generateCirra({ apiKey: config.apiKey, model: category === "FAST" ? config.fast : config.smart, mode: input.mode, ...prompt, timeoutMs: config.timeoutMs, maxOutputTokens: config.maxOutputTokens, signal: new AbortController().signal });
    const result = validateAnswer(response.result, input, built);
    expect(result.answer.length).toBeGreaterThan(10);
    if (category === "SMART") expect([result.answer, ...result.observations, ...result.suggestions].join(" ")).toMatch(/D4|pin 4/);
    // Operational metadata only. Never print API key, prompt, project, or response body.
    console.info(JSON.stringify({ event: "cirra_live_smoke", category, status: "validated", latencyMs: response.latency, tokens: response.tokens }));
  }, 65000);
  it("validates SMART Assistant blueprint against actual component support", async () => {
    const config = cirraConfig();
    const input = requestSchema.parse({ requestId: crypto.randomUUID(), mode: "project-assistant", message: "Aku mau membuat smart plant monitoring sederhana. Beri rencana singkat, jujur tentang sensor yang belum tersedia." });
    const built = buildContext(input); const prompt = buildPrompt(input, built);
    const response = await generateCirra({ apiKey: config.apiKey, model: config.smart, mode: input.mode, ...prompt, timeoutMs: config.timeoutMs, maxOutputTokens: config.maxOutputTokens, signal: new AbortController().signal });
    const result = validateAnswer(response.result, input, built);
    expect(result.blueprint?.components.length).toBeGreaterThan(0);
    console.info(JSON.stringify({ event: "cirra_live_smoke", category: "SMART", mode: "project-assistant", status: "validated", latencyMs: response.latency, tokens: response.tokens }));
  }, 65000);
  it.each([
    { name: "ESP32 input-only pin", project: fixture({ board: "esp32", led: "led", r: "resistor" }, [["board.GPIO34", "r.1"], ["r.2", "led.A"], ["led.K", "board.GND"]], "void setup(){pinMode(34,OUTPUT);}void loop(){digitalWrite(34,HIGH);}"), question: "Kenapa output LED di GPIO34 gagal?", expected: /input|masukan|input-only/i },
    { name: "missing GND", project: fixture({ board: "uno", led: "led", r: "resistor" }, [["board.D4", "r.1"], ["r.2", "led.A"]], "void setup(){pinMode(4,OUTPUT);}void loop(){digitalWrite(4,HIGH);}"), question: "LED belum menyala. Periksa jalur baliknya.", expected: /GND|ground|katoda/i },
    { name: "disconnected DHT22", project: fixture({ board: "esp32", sensor: "dht22" }, [], "void setup(){}void loop(){delay(100);}"), question: "DHT22 tidak merespons. Apa yang perlu aku periksa?", expected: /belum terhubung|tidak terhubung|koneksi|VCC|DATA/i },
  ])("grounds live Debugger golden: $name", async ({ project, question, expected }) => {
    const config = cirraConfig();
    const input = requestSchema.parse({ requestId: crypto.randomUUID(), mode: "debugger", message: question, project });
    const built = buildContext(input); const prompt = buildPrompt(input, built);
    const response = await generateCirra({ apiKey: config.apiKey, model: config.smart, mode: input.mode, ...prompt, timeoutMs: config.timeoutMs, maxOutputTokens: config.maxOutputTokens, signal: new AbortController().signal });
    const result = validateAnswer(response.result, input, built);
    // Boolean evidence assertion avoids leaking provider text if a live golden fails.
    expect(expected.test([result.answer, ...result.observations, ...result.suggestions].join(" "))).toBe(true);
  }, 65000);
});
