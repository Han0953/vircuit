import { test, expect, type Page } from "@playwright/test";
import { fixture } from "../../features/simulator/tests/fixtures";
import type { Project } from "../../features/simulator/types/project";
import { visualLayout, rotateLayout } from "../../features/simulator/ui/visuals/pin-layout";
import { getDefinition } from "../../features/simulator/catalog/registry";

async function load(page: Page, project: Project) {
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto("/simulator");
  await page.getByRole("button", { name: "Buka menu proyek" }).click();
  await page.getByLabel("Impor JSON", { exact: true }).setInputFiles({ name: "realism.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(project)) });
  await expect(page.locator(".react-flow__node")).toHaveCount(project.components.length);
}
async function saved(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => { const r = indexedDB.open("vircuit-projects", 1); r.onsuccess = () => resolve(r.result); });
    return new Promise<Project | undefined>((resolve) => { const r = db.transaction("drafts").objectStore("drafts").get("guest"); r.onsuccess = () => { db.close(); resolve(r.result?.project); }; });
  });
}
async function screenPoint(page: Page, point: { x: number; y: number }) {
  return page.getByTestId("circuit-canvas").evaluate((el, point) => {
    const rect = el.getBoundingClientRect(), viewport = el.querySelector(".react-flow__viewport")!;
    const m = new DOMMatrix(getComputedStyle(viewport).transform);
    return { x: rect.x + m.e + point.x * m.a, y: rect.y + m.f + point.y * m.d };
  }, point);
}

test("breadboard snap previews compatible holes, persists loose alignment and never creates wires", async ({ page }) => {
  const p = fixture({ bread: "breadboard-half", led: "led" }, [], "void setup(){}void loop(){}");
  p.components[0].position = { x: 20, y: 20 }; p.components[1].position = { x: 600, y: 100 }; p.components[1].rotation = 90;
  await load(page, p); await page.getByRole("button", { name: "Focus Mode", exact: true }).click();
  const led = page.locator('.react-flow__node[data-id="led"]');
  const target = visualLayout(getDefinition("breadboard-half")).anchors.find((a) => a.pin.id === "B4")!;
  const pin = rotateLayout(visualLayout(getDefinition("led")), 90).anchors[0];
  const destination = { x: 20 + target.x - pin.x, y: 20 + target.y - pin.y };
  const from = await screenPoint(page, { x: 648, y: 124 });
  const to = await screenPoint(page, { x: destination.x + 48, y: destination.y + 24 });
  await page.mouse.move(from.x, from.y); await page.mouse.down();
  await page.mouse.move(from.x - 2, from.y);
  await page.mouse.move(to.x, to.y, { steps: 12 });
  await expect(page.getByTestId("placement-preview")).toBeVisible();
  await expect(page.getByTestId("placement-preview")).toHaveCSS("left", `${destination.x}px`);
  await page.mouse.up();
  await expect(page.getByRole("status").filter({ hasText: "Kaki selaras" })).toBeVisible();
  await expect(page.locator(".react-flow__edge")).toHaveCount(0);
  await expect.poll(async () => (await saved(page))?.components.find((c) => c.id === "led")?.position).toEqual(destination);
  const a = await led.locator('[data-handleid="A"]').boundingBox();
  const b = await page.locator('[data-id="bread"] [data-handleid="B4"]').boundingBox();
  expect(Math.hypot(a!.x + a!.width / 2 - b!.x - b!.width / 2, a!.y + a!.height / 2 - b!.y - b!.height / 2)).toBeLessThan(1);
  await page.reload(); await expect(led).toBeVisible(); await expect(page.locator(".react-flow__edge")).toHaveCount(0);
  const bread = page.locator('.react-flow__node[data-id="bread"]');
  const box = await bread.boundingBox();
  await page.mouse.move(box!.x + 12, box!.y + 10); await page.mouse.down(); await page.mouse.move(box!.x + 62, box!.y + 40, { steps: 8 }); await page.mouse.up();
  await expect.poll(async () => (await saved(page))?.components.find((c) => c.id === "bread")?.position.x).not.toBe(20);
  expect((await saved(page))?.components.find((c) => c.id === "led")?.position).toEqual(destination);
  await page.screenshot({ path: "test-results/breadboard-alignment.png" });
});

test("four-way rotation is undoable, wire endpoints survive and worker stays running", async ({ page }) => {
  const p = fixture({ board: "uno", r: "resistor", led: "led" }, [["board.D13", "r.1"], ["r.2", "led.A"], ["led.K", "board.GND"]], "void setup(){pinMode(13,OUTPUT);}void loop(){digitalWrite(13,HIGH);delay(250);digitalWrite(13,LOW);delay(250);}");
  p.components[1].position = { x: 730, y: 50 }; p.components[2].position = { x: 730, y: 160 };
  await load(page, p); await page.locator(".react-flow__controls-fitview").click();
  await page.getByRole("button", { name: "Run", exact: true }).click();
  const node = page.locator('.react-flow__node[data-id="r"]'); await node.click();
  for (const rotation of [90, 180, 270, 0]) {
    await page.getByRole("button", { name: "Putar komponen", exact: true }).click();
    await expect.poll(async () => (await saved(page))?.components.find((c) => c.id === "r")?.rotation).toBe(rotation);
    await expect(page.getByRole("button", { name: "Stop", exact: true })).toBeEnabled();
    await expect(page.locator(".react-flow__edge")).toHaveCount(3);
    await page.screenshot({ path: `test-results/rotation-${rotation}.png` });
  }
  await expect(page.getByTestId("output-led")).toHaveAttribute("data-value", "1");
  await page.screenshot({ path: "test-results/led-active.png" });
  await page.getByRole("button", { name: "Putar ke kiri", exact: true }).click();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect.poll(async () => (await saved(page))?.components.find((c) => c.id === "r")?.rotation).toBe(0);
  expect((await saved(page))?.wires).toEqual(p.wires);
  const body = node.getByTestId("component-body");
  expect(await body.evaluate((el) => ({ background: getComputedStyle(el).backgroundColor, padding: getComputedStyle(el).padding, width: el.clientWidth, height: el.clientHeight }))).toEqual({ background: "rgba(0, 0, 0, 0)", padding: "0px", width: 120, height: 48 });
  await page.reload(); await expect(node).toBeVisible(); expect((await saved(page))?.components.find((c) => c.id === "r")?.rotation).toBe(0);
});

test("all existing component visuals remain crisp, card-free and theme compatible", async ({ page }) => {
  const p = fixture({ board: "uno", nano: "nano", esp: "esp32", bread: "breadboard-mini", led: "led", r: "resistor", button: "button", pot: "pot", sensor: "dht22", relay: "relay", fan: "fan" }, [], "void setup(){}void loop(){}");
  const positions = [[0, 0], [710, 0], [930, 0], [1240, 0], [710, 620], [850, 620], [1070, 620], [1250, 620], [710, 790], [930, 790], [1200, 790]];
  p.components.forEach((c, i) => { c.position = { x: positions[i][0], y: positions[i][1] }; });
  await load(page, p); await page.setViewportSize({ width: 1920, height: 1300 });
  await page.getByRole("button", { name: "Focus Mode", exact: true }).click();
  for (const theme of ["Terang", "Gelap", "Sistem"]) {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.getByRole("button", { name: /^Pilih tema:/ }).click(); await page.getByRole("menuitemradio", { name: theme, exact: true }).click();
    await expect(page.getByRole("menu")).not.toBeVisible();
    await page.locator(".react-flow__controls-fitview").click();
    await expect(page.getByTestId("component-body")).toHaveCount(11);
    expect(await page.getByTestId("component-body").evaluateAll((nodes) => nodes.every((el) => getComputedStyle(el).backgroundColor === "rgba(0, 0, 0, 0)" && getComputedStyle(el).padding === "0px"))).toBe(true);
    await page.screenshot({ path: `test-results/catalog-${theme}.png` });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".react-flow__controls-fitview").click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/catalog-mobile.png" });
});

test("DHT22 properties drive live relay/fan visuals without editing the persisted sensor defaults", async ({ page }) => {
  const p = fixture({ board: "esp32", sensor: "dht22", relay: "relay", fan: "fan" }, [["sensor.VCC", "board.3V3"], ["sensor.GND", "board.GND"], ["sensor.DATA", "board.GPIO4"], ["relay.VCC", "board.5V"], ["relay.GND", "board.GND"], ["relay.IN", "board.GPIO23"], ["relay.COM", "board.5V"], ["relay.NO", "fan.+"], ["fan.-", "board.GND"]], 'void setup(){pinMode(23,OUTPUT);}void loop(){if(DHT.temperature(4)>30){digitalWrite(23,HIGH);}else{digitalWrite(23,LOW);}delay(50);}');
  p.components.forEach((c, i) => { c.position = { x: i * 320, y: 0 }; });
  await load(page, p); await page.locator(".react-flow__controls-fitview").click();
  const sensor = page.locator('.react-flow__node[data-id="sensor"]'); await sensor.click();
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByTestId("output-fan")).toHaveAttribute("data-value", "0");
  const slider = page.getByLabel(/^Suhu °C:/);
  await slider.focus(); await page.keyboard.press("End");
  await expect(sensor.locator("svg")).toContainText("80 °C");
  await expect(page.getByTestId("output-fan")).toHaveAttribute("data-value", "1");
  await expect(page.getByTestId("output-relay")).toHaveAttribute("data-value", "1");
  await expect.poll(async () => (await saved(page))?.components.find((c) => c.id === "sensor")?.properties.temperature).toBe(25);
  await page.screenshot({ path: "test-results/sensor-active.png" });
  await page.getByRole("button", { name: "Reset simulasi", exact: true }).click();
  await expect(sensor.locator("svg")).toContainText("25 °C");
  await expect(page.getByTestId("output-fan")).toHaveAttribute("data-value", "0");
});

test("wire reconnect and delete keep logical identity and are undoable", async ({ page }) => {
  const p = fixture({ board: "uno", r: "resistor" }, [["board.D13", "r.1"]], "void setup(){}void loop(){}");
  p.components[1].position = { x: 730, y: 80 };
  await load(page, p); await page.getByRole("button", { name: "Focus Mode", exact: true }).click(); await page.locator(".react-flow__controls-fitview").click();
  const edge = page.locator('.react-flow__edge[data-id="w0"]');
  await edge.dispatchEvent("click");
  const updater = edge.locator(".react-flow__edgeupdater-target"), target = page.locator('[data-id="r"] [data-handleid="2"]');
  await expect(updater).toBeVisible();
  const from = await updater.boundingBox(), to = await target.boundingBox();
  await page.mouse.move(from!.x + from!.width / 2, from!.y + from!.height / 2); await page.mouse.down();
  await page.mouse.move(to!.x + to!.width / 2, to!.y + to!.height / 2, { steps: 10 }); await page.mouse.up();
  await expect.poll(async () => (await saved(page))?.wires[0]).toEqual({ ...p.wires[0], to: { componentId: "r", pinId: "2" } });
  await expect(edge).toBeVisible();
  await edge.dispatchEvent("click"); await page.getByTestId("circuit-canvas").click({ position: { x: 10, y: 10 } });
  await edge.dispatchEvent("click"); await edge.focus(); await page.keyboard.press("Delete");
  await expect(page.locator(".react-flow__edge")).toHaveCount(0);
  await expect(page.getByTestId("circuit-canvas")).toBeFocused();
  await page.keyboard.press("Control+z");
  await expect(page.locator(".react-flow__edge")).toHaveCount(1);
});

test.describe("touch canvas", () => {
  test.use({ hasTouch: true, isMobile: true });
  test("mobile tap-to-tap wiring keeps the compact visual pin identities", async ({ page }) => {
    const p = fixture({ board: "uno", r: "resistor" }, [], "void setup(){}void loop(){}");
    p.components[1].position = { x: 730, y: 80 };
    await load(page, p); await page.setViewportSize({ width: 390, height: 844 });
    await page.locator(".react-flow__controls-fitview").click();
    for (const selector of ['[data-id="board"] [data-handleid="D13"]', '[data-id="r"] [data-handleid="1"]']) {
      const box = await page.locator(selector).boundingBox(); await page.touchscreen.tap(box!.x + box!.width / 2, box!.y + box!.height / 2);
    }
    await expect(page.locator(".react-flow__edge")).toHaveCount(1);
    await expect.poll(async () => (await saved(page))?.wires[0]?.from).toEqual({ componentId: "board", pinId: "D13" });
    await page.getByRole("button", { name: "Properties", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Properties", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: "test-results/realism-touch-mobile.png" });
  });
});
