import { expect, test, type Page } from "@playwright/test";
import { fixture } from "../../features/simulator/tests/fixtures";
import type { Project } from "../../features/simulator/types/project";

async function importProject(page: Page, project: Project) {
  await page.getByRole("button", { name: "Buka menu proyek" }).click();
  await page.getByLabel("Impor JSON", { exact: true }).setInputFiles({ name: "runtime.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(project)) });
  await page.keyboard.press("Escape");
  await expect(page.locator(".react-flow__node")).toHaveCount(project.components.length);
}

async function range(page: Page, label: RegExp, value: number) {
  await page.getByRole("slider", { name: label }).evaluate((el: HTMLInputElement, value) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(el, String(value));
    el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

test.beforeEach(async ({ page }) => { await page.setViewportSize({ width: 1440, height: 1000 }); });

test("worker executes integer PWM conversion and real LDR/PIR inputs drive a buzzer", async ({ page }) => {
  await page.goto("/simulator");
  await importProject(page, fixture({ board: "uno", led: "led", pot: "pot" }, [["board.D3", "led.A"], ["led.K", "board.GND"], ["pot.VCC", "board.5V"], ["pot.GND", "board.GND"], ["pot.OUT", "board.A0"]], "void setup(){pinMode(3,OUTPUT);Serial.begin(9600);}void loop(){int brightness=analogRead(A0)/4;analogWrite(3,brightness);Serial.println(brightness);delay(20);}"));
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await page.locator(".react-flow__node[data-id='pot']").click({ position: { x: 10, y: 10 } });
  await range(page, /^Posisi:/, 100);
  await expect(page.getByTestId("output-led")).toHaveAttribute("data-value", "1");
  await page.getByRole("tab", { name: "Serial Monitor", exact: true }).click();
  await expect(page.getByLabel("Output Serial Monitor")).toContainText("255");
  await page.getByRole("button", { name: "Stop", exact: true }).click();

  await importProject(page, fixture({ board: "uno", ldr: "ldr", pir: "pir", buzzer: "buzzer" }, [["ldr.VCC", "board.5V"], ["ldr.GND", "board.GND"], ["ldr.AO", "board.A0"], ["pir.VCC", "board.5V"], ["pir.GND", "board.GND"], ["pir.OUT", "board.D2"], ["buzzer.+", "board.D3"], ["buzzer.-", "board.GND"]], "void setup(){pinMode(2,INPUT);pinMode(3,OUTPUT);Serial.begin(9600);}void loop(){digitalWrite(3,digitalRead(2));Serial.println(analogRead(A0));delay(20);}"));
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await page.locator(".react-flow__controls-fitview").click();
  await page.getByTestId("circuit-canvas").getByRole("button", { name: "Gerakan PIR", exact: true }).click();
  await expect(page.getByTestId("output-buzzer")).toHaveAttribute("data-value", "1");
  await page.getByTestId("circuit-canvas").getByRole("button", { name: "Gerakan PIR", exact: true }).click();
  await expect(page.getByTestId("output-buzzer")).toHaveAttribute("data-value", "0");
  await page.locator(".react-flow__node[data-id='ldr']").click({ position: { x: 12, y: 12 } });
  await range(page, /^Cahaya %:/, 100);
  await expect(page.getByLabel("Output Serial Monitor")).toContainText("\n0\n");
});

test("syntax, unsupported API, infinite loop and short circuit report actual diagnostics", async ({ page }) => {
  await page.goto("/simulator");
  for (const [source, message] of [
    ["void setup(){pinMode(3 OUTPUT);}void loop(){}", /Diharapkan.*OUTPUT/],
    ["void setup(){tone(3,440);}void loop(){}", /API belum didukung: tone/],
    ["void setup(){}void loop(){while(1){}}", /budget instruksi terlampaui/],
  ] as const) {
    await importProject(page, fixture({ board: "uno" }, [], source));
    await page.getByRole("button", { name: "Run", exact: true }).click();
    await page.getByRole("tab", { name: "Problems", exact: true }).click();
    await expect(page.getByRole("tabpanel")).toContainText(message);
    await expect(page.getByRole("button", { name: "Run", exact: true })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Stop", exact: true })).toBeDisabled();
  }
  await importProject(page, fixture({ board: "uno" }, [["board.5V", "board.GND"]], "void setup(){}void loop(){delay(10);}"));
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await page.getByRole("tab", { name: "Problems", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText(/hubung singkat/);
});

test("repeated Run Stop Restart owns only one real worker and stopped output does not advance", async ({ page }) => {
  await page.addInitScript(() => {
    const NativeWorker = window.Worker;
    const stats = { created: 0, active: 0 };
    Object.assign(window, { __workerAudit: stats });
    window.Worker = class extends NativeWorker {
      private stopped = false;
      constructor(url: string | URL, options?: WorkerOptions) { super(url, options); stats.created++; stats.active++; }
      terminate() { if (!this.stopped) { this.stopped = true; stats.active--; } super.terminate(); }
    };
  });
  await page.goto("/simulator");
  await importProject(page, fixture({ board: "uno", led: "led" }, [["board.D3", "led.A"], ["led.K", "board.GND"]], 'void setup(){pinMode(3,OUTPUT);Serial.begin(9600);Serial.println("start");}void loop(){digitalWrite(3,HIGH);delay(100);digitalWrite(3,LOW);delay(100);}'));
  const stats = () => page.evaluate(() => (window as unknown as { __workerAudit: { active: number; created: number } }).__workerAudit);
  for (let run = 1; run <= 3; run++) {
    await page.getByRole("button", { name: "Run", exact: true }).click();
    await expect(page.getByTestId("output-led")).toHaveAttribute("data-value", "1");
    expect(await stats()).toEqual({ created: run, active: 1 });
    await page.getByRole("button", { name: "Stop", exact: true }).click();
    const stopped = await page.getByTestId("output-led").getAttribute("data-value");
    await page.waitForTimeout(250);
    await expect(page.getByTestId("output-led")).toHaveAttribute("data-value", stopped!);
    expect((await stats()).active).toBe(0);
  }
  await page.getByRole("tab", { name: "Serial Monitor", exact: true }).click();
  await expect(page.getByLabel("Output Serial Monitor")).toHaveText("start\n");
});
