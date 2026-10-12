import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { codeExamples } from "../runtime/templates";
import { exampleProject } from "../examples/projects";
import { SimulationEngine } from "../runtime/engine";
import { validateCircuit } from "../graph/circuit";
import { serializeProject, deserializeProject } from "../schemas/project-schema";
import { recoverDraft, flushDraft } from "@/features/projects/local/controller";
import { archivedDrafts, readDraft } from "@/features/projects/local/drafts";
import { usePersistence } from "@/features/projects/store";
import { useProject } from "../stores/project-store";
import { applyExample } from "../examples/apply-example";

describe("executable code and circuit examples", () => {
  it("has 12 unique stable examples", () => { expect(codeExamples).toHaveLength(12); expect(new Set(codeExamples.map((e) => e.id)).size).toBe(12); });
  it.each([false, true])("sample circuits react to program timing and sensor input on ESP32=%s", (esp32) => {
    for (const id of ["blink", "buzzer"] as const) {
      const engine = new SimulationEngine(exampleProject(id, esp32));
      const output = id === "blink" ? "led" : "buzzer";
      expect(engine.step().outputs[output]).toBe(1); expect(engine.step().outputs[output]).toBe(0);
    }
    for (const [id, sensor, property, low, high] of [["button", "button", "pressed", 0, 1], ["pot", "pot", "value", 0, 100], ["ldr", "ldr", "light", 100, 0], ["pir", "pir", "motion", 0, 1]] as const) {
      const engine = new SimulationEngine(exampleProject(id, esp32));
      engine.input(sensor, property, low); expect(engine.step().outputs.led).toBe(0);
      engine.input(sensor, property, high); engine.step(); expect(engine.step().outputs.led, id).toBe(1);
    }
    const relay = new SimulationEngine(exampleProject("dht", esp32));
    expect(relay.step().outputs.fan).toBe(0); relay.input("dht", "temperature", 35);
    relay.step(); expect(relay.step().outputs.fan).toBe(1);
    const traffic = new SimulationEngine(exampleProject("traffic", esp32));
    expect([traffic.step().outputs.led, traffic.step().outputs.green, traffic.step().outputs.yellow]).toEqual([1, 1, 1]);
  });
  for (const esp32 of [false, true]) for (const example of codeExamples) it(`${example.id} on ${esp32 ? "ESP32" : "Uno"}: valid snapshot and bounded runtime`, () => {
    const project = exampleProject(example.id, esp32);
    expect(validateCircuit(project).filter((p) => p.severity === "error")).toEqual([]);
    expect(deserializeProject(serializeProject(project))).toEqual(project);
    const engine = new SimulationEngine(project);
    let state = engine.step(); for (let i = 0; i < 5; i++) state = engine.step();
    if (example.id === "lcd") expect(state.displays.screen.lines[0].trim()).toBe("Input analog");
    if (example.id === "oled") expect(state.displays.screen.lines[2]).toContain("Suhu: 25");
    if (example.id === "serial") expect(state.serial).toContain("Hitungan: 0");
  });
  it("code-only preserves circuit and identity and supports Undo", async () => {
    await recoverDraft(`test:${crypto.randomUUID()}`);
    useProject.getState().edit(() => exampleProject("button"));
    const before = useProject.getState().project, id = usePersistence.getState().draft!.id;
    await applyExample("serial", false, false);
    expect(useProject.getState().project.components).toBe(before.components);
    expect(usePersistence.getState().draft!.id).toBe(id);
    useProject.getState().undo(); expect(useProject.getState().project).toEqual(before);
  });
  it("new example archives even a clean cloud draft and detaches cloud identity", async () => {
    const scope = `test:${crypto.randomUUID()}`; await recoverDraft(scope);
    useProject.getState().edit(() => exampleProject("pot"));
    const original = usePersistence.getState().draft!;
    usePersistence.setState({ draft: { ...original, cloud: { id: crypto.randomUUID(), owner: crypto.randomUUID(), revision: 1 }, savedLocalRevision: original.localRevision } });
    await flushDraft(); await applyExample("lcd", false, true);
    expect((await archivedDrafts(scope))[0].project).toEqual(original.project);
    expect(usePersistence.getState().draft!.cloud).toBeNull();
    expect(usePersistence.getState().draft!.id).not.toBe(original.id);
    expect((await readDraft(scope))!.project).toEqual(exampleProject("lcd"));
    const before = useProject.getState().project;
    usePersistence.setState({ handoffBusy: true });
    await expect(applyExample("blink", false, true)).rejects.toThrow(/Tunggu/);
    expect(useProject.getState().project).toBe(before);
    usePersistence.setState({ handoffBusy: false });
  });
});
