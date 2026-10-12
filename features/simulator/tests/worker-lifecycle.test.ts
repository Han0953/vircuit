import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useProject } from "../stores/project-store";
import { useSimulation } from "../stores/simulation-store";
import { resetSimulation, runSimulation, stopSimulation } from "../worker/bridge";
import type { WorkerRequest, WorkerResponse } from "../worker/protocol";
import { fixture } from "./fixtures";

class TestWorker {
  static instances: TestWorker[] = [];
  onmessage: ((event: MessageEvent<WorkerResponse>) => void) | null = null;
  onerror: (() => void) | null = null;
  messages: WorkerRequest[] = [];
  terminated = false;
  constructor() { TestWorker.instances.push(this); }
  postMessage(message: WorkerRequest) { this.messages.push(message); }
  terminate() { this.terminated = true; }
  state(time: number) { this.onmessage?.(new MessageEvent<WorkerResponse>("message", { data: { type: "STATE", outputs: { led: 1 }, serial: "on", time } })); }
}

describe("simulation worker lifecycle boundary", () => {
  beforeEach(() => {
    vi.useFakeTimers(); vi.stubGlobal("Worker", TestWorker); TestWorker.instances = [];
    resetSimulation();
    useProject.setState({ project: fixture({ board: "uno" }, [], "void setup(){}void loop(){delay(10);}") });
  });
  afterEach(() => { resetSimulation(); vi.unstubAllGlobals(); vi.useRealTimers(); });

  it("restart terminates the previous worker, ignores stale messages and stop releases timers", () => {
    runSimulation(); const first = TestWorker.instances[0]; first.state(10);
    expect(useSimulation.getState().time).toBe(10);
    runSimulation(); const second = TestWorker.instances[1];
    expect(first.terminated).toBe(true); expect(second.messages[0].type).toBe("RUN");
    first.state(999); expect(useSimulation.getState().time).toBe(0);
    first.onerror?.(); expect(useSimulation.getState().status).toBe("running");
    second.state(20); stopSimulation(); second.state(999);
    expect(second.terminated).toBe(true);
    expect(useSimulation.getState()).toMatchObject({ status: "stopped", time: 20 });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("reset clears runtime state and project edits stop an active simulation", () => {
    runSimulation(); TestWorker.instances[0].state(20);
    useProject.getState().edit((project) => ({ ...project, code: { ...project.code, source: "void setup(){}void loop(){delay(50);}" } }));
    expect(useSimulation.getState().status).toBe("stopped");
    resetSimulation(); expect(useSimulation.getState()).toMatchObject({ status: "idle", time: 0, serial: "", outputs: {}, problems: [] });
  });

  it("worker constructor and postMessage failures become diagnostics instead of uncaught crashes", () => {
    vi.stubGlobal("Worker", class { constructor() { throw new Error("worker unavailable"); } });
    expect(() => runSimulation()).not.toThrow();
    expect(useSimulation.getState()).toMatchObject({ status: "error", problems: [{ source: "runtime", severity: "error" }] });
    vi.stubGlobal("Worker", class extends TestWorker { postMessage() { throw new Error("clone failed"); } });
    expect(() => runSimulation()).not.toThrow();
    expect(TestWorker.instances[0].terminated).toBe(true);
    expect(useSimulation.getState().status).toBe("error");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("wiring errors prevent worker creation and watchdog terminates a stalled worker", () => {
    useProject.setState({ project: fixture({ board: "uno" }, [["board.5V", "board.GND"]], "void setup(){}void loop(){}") });
    runSimulation(); expect(TestWorker.instances).toHaveLength(0);
    expect(useSimulation.getState().status).toBe("error");
    useProject.setState({ project: fixture({ board: "uno" }, [], "void setup(){}void loop(){delay(10);}") });
    runSimulation(); vi.advanceTimersByTime(65000);
    expect(TestWorker.instances[0].terminated).toBe(true);
    expect(useSimulation.getState().problems[0].message).toMatch(/tidak merespons/);
  });
});
