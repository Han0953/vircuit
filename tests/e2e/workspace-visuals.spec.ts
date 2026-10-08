import { test, expect, type Page } from "@playwright/test";
import { fixture } from "../../features/simulator/tests/fixtures";

async function expectWireAnchors(page: Page) {
  await expect.poll(() => page.evaluate(() => {
    const path = document.querySelector<SVGPathElement>('[data-id="w0"] .react-flow__edge-path');
    const pins = [document.querySelector('[data-id="board"] [data-handleid="D13"]'), document.querySelector('[data-id="r"] [data-handleid="1"]')];
    const matrix = path?.getScreenCTM();
    if (!path || !matrix || pins.some((pin) => !pin)) return Infinity;
    const points = [path.getPointAtLength(0), path.getPointAtLength(path.getTotalLength())];
    return Math.max(...points.map((point, i) => {
      const p = new DOMPoint(point.x, point.y).matrixTransform(matrix), box = pins[i]!.getBoundingClientRect();
      return Math.hypot(p.x - box.x - box.width / 2, p.y - box.y - box.height / 2);
    }));
  })).toBeLessThan(1);
}

test("SVG pins, rotation, wiring and old snapshot survive route and layout changes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/simulator");
  const project = fixture({ board: "uno", led: "led", r: "resistor", button: "button", pot: "pot" }, [["board.D13", "r.1"], ["r.2", "led.A"], ["led.K", "board.GND"]], "void setup(){pinMode(13,OUTPUT);}void loop(){digitalWrite(13,HIGH);delay(500);digitalWrite(13,LOW);delay(500);}");
  project.components.forEach((c, i) => { c.position = { x: i ? 730 + ((i - 1) % 2) * 200 : 0, y: i ? Math.floor((i - 1) / 2) * 300 : 0 }; });
  await page.getByRole("button", { name: "Buka menu proyek" }).click();
  await page.getByLabel("Impor JSON", { exact: true }).setInputFiles({ name: "v1.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(project)) });
  await expect(page.locator(".react-flow__node")).toHaveCount(5);
  await page.getByRole("button", { name: "Focus Mode", exact: true }).click();
  await page.locator(".react-flow__controls-fitview").click();
  await expectWireAnchors(page);
  await page.screenshot({ path: "test-results/wired-components.png" });
  const board = page.locator('[data-id="board"].react-flow__node');
  await expect(board.locator(".react-flow__handle")).toHaveCount(23);
  const pin = page.getByRole("button", { name: "Arduino Uno R3 · Pin D2", exact: true });
  await pin.focus(); await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Push Button · Pin 1", exact: true }).focus(); await page.keyboard.press("Enter");
  await expect(page.locator(".react-flow__edge")).toHaveCount(4);
  await page.getByRole("button", { name: "Focus Mode", exact: true }).click();
  await board.click({ position: { x: 100, y: 50 } });
  await page.getByRole("button", { name: "Putar komponen" }).click();
  await expect(board.locator(".react-flow__handle")).toHaveCount(23);
  await expect(page.locator(".react-flow__edge")).toHaveCount(4);
  await expectWireAnchors(page);
  await page.getByRole("separator", { name: "Ubah lebar Parts" }).focus(); await page.keyboard.press("ArrowRight");
  await expectWireAnchors(page);
  await page.getByRole("separator", { name: "Ubah tinggi panel bawah" }).focus(); await page.keyboard.press("ArrowUp");
  await expectWireAnchors(page);
  await page.locator(".react-flow__controls-zoomin").click();
  await expectWireAnchors(page);
  await expect.poll(() => page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => { const r = indexedDB.open("vircuit-projects", 1); r.onsuccess = () => resolve(r.result); });
    return new Promise<number>((resolve) => { const r = db.transaction("drafts").objectStore("drafts").get("guest"); r.onsuccess = () => { db.close(); resolve(r.result?.project.wires.length ?? 0); }; });
  })).toBe(4);
  await page.reload(); await expect(page.locator(".react-flow__edge")).toHaveCount(4);
  await expectWireAnchors(page);
  await page.getByRole("link", { name: "Code", exact: true }).click();
  await expect(page.locator(".monaco-editor")).toBeVisible();
  await page.goBack(); await expect(page.getByRole("region", { name: "Circuit Canvas" })).toBeVisible();
});

test("responsive workspaces and SVG gallery remain contained across themes", async ({ page }) => {
  test.setTimeout(90000);
  await page.goto("/simulator");
  await page.setViewportSize({ width: 1440, height: 1000 });
  const project = fixture({ board: "uno", esp: "esp32", bread: "breadboard-mini", led: "led", r: "resistor", button: "button", pot: "pot", sensor: "dht22" }, [], "void setup(){}void loop(){}");
  project.components.forEach((c, i) => { c.position = { x: (i % 4) * 700, y: Math.floor(i / 4) * 640 }; });
  await page.getByRole("button", { name: "Buka menu proyek" }).click();
  await page.getByLabel("Impor JSON", { exact: true }).setInputFiles({ name: "gallery.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(project)) });
  await expect(page.locator(".react-flow__node")).toHaveCount(8);
  for (const width of [1280, 1440, 1920, 768, 360, 390, 430]) {
    await page.setViewportSize({ width, height: width < 1024 ? 900 : 1000 });
    await page.locator(".react-flow__controls-fitview").click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/workspace-${width}.png` });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const theme of ["Terang", "Gelap", "Sistem"]) {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.getByRole("button", { name: /^Pilih tema:/ }).click(); await page.getByRole("menuitemradio", { name: theme }).click();
    await expect(page.getByRole("menu")).not.toBeVisible();
    await page.locator(".react-flow__controls-fitview").click();
    await page.screenshot({ path: `test-results/visual-${theme}.png` });
  }
  await page.getByRole("link", { name: "Code", exact: true }).click();
  await expect(page.locator(".monaco-editor")).toBeVisible();
  await page.screenshot({ path: "test-results/code-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/code-mobile.png" });
  await page.getByRole("button", { name: "Buka Cirra", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Asisten Cirra" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Asisten Cirra" })).not.toBeVisible();
});

test("full and half breadboards retain every logical hole without page overflow", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/simulator");
  const project = fixture({ full: "breadboard-full", half: "breadboard-half" }, [], "void setup(){}void loop(){}");
  project.components[1].position = { x: 600, y: 0 };
  await page.getByRole("button", { name: "Buka menu proyek" }).click();
  await page.getByLabel("Impor JSON", { exact: true }).setInputFiles({ name: "breadboards.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(project)) });
  await expect(page.locator('[data-id="full"].react-flow__node .react-flow__handle')).toHaveCount(882);
  await expect(page.locator('[data-id="half"].react-flow__node .react-flow__handle')).toHaveCount(420);
  await page.getByRole("button", { name: "Focus Mode", exact: true }).click();
  await page.locator(".react-flow__controls-fitview").click();
  await page.locator(".react-flow__controls-zoomin").click();
  await page.getByRole("button", { name: "Focus Mode", exact: true }).click();
  await expect(page.getByRole("separator", { name: "Ubah lebar Parts" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
