import { test, expect, type Page } from "@playwright/test";
import { fixture } from "../../features/simulator/tests/fixtures";
import type { Project } from "../../features/simulator/types/project";
async function load(page: Page, project: Project) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/simulator");
  await page.getByRole("button", { name: "Buka menu proyek" }).click();
  await page.getByLabel("Impor JSON", { exact: true }).setInputFiles({ name: "test.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(project)) });
  if (await page.getByRole("dialog").isVisible()) await page.keyboard.press("Escape");
  await expect(page.locator(".react-flow__node")).toHaveCount(project.components.length);
}
test("Blink runs in worker, stops, and survives panel layout changes", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", (e) => errors.push(e.message));
  await load(page, fixture({ board: "uno", r: "resistor", led: "led" }, [["board.D13", "r.1"], ["r.2", "led.A"], ["led.K", "board.GND"]], 'void setup(){pinMode(13,OUTPUT);Serial.begin(9600);}void loop(){digitalWrite(13,HIGH);Serial.println("on");delay(500);digitalWrite(13,LOW);delay(500);}'));
  await page.getByRole("button", { name: "Run", exact: true }).click();
  const output = page.getByTestId("output-led");
  await expect(output).toHaveAttribute("data-value", "1");
  await expect(output).toHaveAttribute("data-value", "0");
  await page.getByRole("link", { name: "Code", exact: true }).click();
  await expect(page).toHaveURL(/\/simulator\/code$/);
  await expect(page.locator(".monaco-editor")).toBeVisible();
  await expect(page.getByRole("button", { name: "Stop", exact: true })).toBeEnabled();
  await page.getByRole("link", { name: "Circuit", exact: true }).click();
  await expect(page.getByRole("button", { name: "Stop", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Focus Mode", exact: true }).click();
  await expect(output).toHaveAttribute("data-value", "1");
  await page.getByRole("button", { name: "Focus Mode", exact: true }).click();
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  const stopped = await output.getAttribute("data-value");
  await page.waitForTimeout(650);
  expect(await output.getAttribute("data-value")).toBe(stopped);
  await page.getByRole("tab", { name: "Serial Monitor", exact: true }).click();
  await expect(page.getByLabel("Output Serial Monitor")).toContainText("on");
  expect(errors).toEqual([]);
});
test("button controls LED and runtime diagnostics are real", async ({ page }) => {
  await load(page, fixture({ board: "uno", led: "led", button: "button" }, [["board.D3", "led.A"], ["led.K", "board.GND"], ["button.1", "board.D2"], ["button.2", "board.GND"]], 'void setup(){pinMode(3,OUTPUT);pinMode(2,INPUT_PULLUP);}void loop(){digitalWrite(3,digitalRead(2)==LOW);delay(10);}'));
  await page.getByRole("button", { name: "Focus Mode", exact: true }).click();
  await page.locator(".react-flow__controls-fitview").click();
  await page.getByRole("button", { name: "Run", exact: true }).click();
  const button = page.getByRole("button", { name: "Tekan Push Button" });
  await button.focus(); await page.keyboard.down("Space");
  await expect(page.getByTestId("output-led")).toHaveAttribute("data-value", "1");
  await page.keyboard.up("Space");
  await expect(page.getByTestId("output-led")).toHaveAttribute("data-value", "0");
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await page.getByRole("button", { name: "Focus Mode", exact: true }).click();
  await page.getByRole("link", { name: "Code", exact: true }).click();
  await expect(page.locator(".monaco-editor")).toBeVisible();
  await page.evaluate(() => {
    const editor = (window as unknown as { __vircuitEditor?: { setValue: (val: string) => void } }).__vircuitEditor;
    if (editor) {
      editor.setValue('void setup(){fetch("x");}void loop(){}');
    }
  });
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await page.getByRole("tab", { name: "Problems", exact: true }).click();
  await expect(page.getByText("API belum didukung: fetch", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Code", exact: true }).click();
  await expect(page.locator(".monaco-editor .squiggly-error")).toBeVisible();
});

test("potentiometer slider updates analog reading and PWM output", async ({ page }) => {
  await load(page, fixture({ board: "uno", led: "led", pot: "pot" }, [
    ["board.D3", "led.A"], ["led.K", "board.GND"],
    ["pot.VCC", "board.5V"], ["pot.GND", "board.GND"], ["pot.OUT", "board.A0"],
  ], 'void setup(){pinMode(3,OUTPUT);Serial.begin(9600);}void loop(){int val=analogRead(A0);if(val>511){analogWrite(3,255);}else{analogWrite(3,0);}Serial.println(val);delay(50);}'));
  await page.getByRole("button", { name: "Run", exact: true }).click();
  const output = page.getByTestId("output-led");
  await expect(output).toHaveAttribute("data-value", "1");
  const slider = page.locator('input[type="range"]');
  await slider.evaluate((el: HTMLInputElement) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    setter?.call(el, "10");
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(output).toHaveAttribute("data-value", "0");
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(slider).toHaveValue("50");
  await expect(output).toHaveAttribute("data-value", "1");
  await page.getByRole("button", { name: "Reset simulasi", exact: true }).click();
  await expect(output).toHaveAttribute("data-value", "0");
});
