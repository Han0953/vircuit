import { expect, test, type Page } from "@playwright/test";
import { fixture } from "../../features/simulator/tests/fixtures";
import { getDefinition } from "../../features/simulator/catalog/registry";
import { deserializeProject } from "../../features/simulator/schemas/project-schema";

async function selectionCircuit(page: Page) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/simulator");
  const project = fixture({ a: "led", b: "resistor", c: "button" }, [["a.A", "b.1"], ["b.2", "c.1"]], 'void setup(){Serial.begin(9600);}void loop(){Serial.println("keep");delay(10);}');
  project.components.forEach((component) => { component.position.y = 80; });
  project.metadata.name = "Rangkaian aman";
  await page.getByRole("button", { name: "Buka menu proyek" }).click();
  await page.getByLabel("Impor JSON", { exact: true }).setInputFiles({ name: "selection.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(project)) });
  await page.keyboard.press("Escape");
  await expect(page.locator(".react-flow__node")).toHaveCount(3);
}

async function clickWire(page: Page, id: string, control = false) {
  const point = await page.locator(`.react-flow__edge[data-id='${id}'] .react-flow__edge-path`).evaluate((element) => {
    const path = element as SVGPathElement; const p = path.getPointAtLength(path.getTotalLength() / 2);
    const point = new DOMPoint(p.x, p.y).matrixTransform(path.getScreenCTM()!); return { x: point.x, y: point.y };
  });
  if (control) await page.keyboard.down("Control");
  await page.mouse.click(point.x, point.y);
  if (control) await page.keyboard.up("Control");
}

test("visual Parts library filters and adds with click and drag", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/simulator");
  const parts = page.getByRole("complementary", { name: "Parts", exact: true });
  await expect(parts.locator('[data-component-type="uno"] svg')).toBeVisible();
  await parts.getByRole("button", { name: "Basic", exact: true }).click();
  await expect(parts.getByRole("button", { name: "LED", exact: true }).locator("svg")).toBeVisible();
  await parts.getByRole("button", { name: "LED", exact: true }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(1);
  await expect(parts.locator('[data-component-type="led"]')).toHaveAttribute("data-selected", "true");
  await parts.getByRole("button", { name: "Resistor", exact: true }).dragTo(page.getByTestId("circuit-canvas"), { targetPosition: { x: 150, y: 100 } });
  await expect(page.locator(".react-flow__node")).toHaveCount(2);
  await parts.getByLabel("Cari komponen").fill("dht22");
  await expect(parts.locator("[data-component-type]")).toHaveCount(1);
  await expect(parts.getByRole("button", { name: "DHT22", exact: true })).toBeVisible();
  await parts.getByLabel("Cari komponen").fill("no-such-component");
  await expect(parts.getByText("Tidak ada komponen yang cocok.")).toBeVisible();
  await parts.getByRole("button", { name: "Bersihkan pencarian" }).click();
  await expect(parts.getByRole("button", { name: "LED", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/workspace-library-desktop.png" });
});

test("mobile dark library keeps SVG previews and accessible category controls", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.addInitScript(() => localStorage.setItem("vircuit-theme", "dark"));
  await page.goto("/simulator");
  await page.getByRole("button", { name: "Parts", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Sensors", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "DHT22", exact: true }).locator("svg")).toBeVisible();
  await dialog.getByRole("button", { name: "DHT22", exact: true }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/workspace-library-mobile.png" });
});

test("multi-select nodes and wires delete atomically and Undo/Redo remain coherent", async ({ page }) => {
  await selectionCircuit(page);
  const node = (id: string) => page.locator(`.react-flow__node[data-id='${id}']`);
  await node("a").click({ position: { x: 24, y: 24 } });
  await node("b").click({ modifiers: ["Control"], position: { x: 40, y: 24 } });
  await expect(page.locator(".react-flow__node.selected")).toHaveCount(2);
  await page.getByRole("button", { name: "Batalkan pilihan", exact: true }).click();
  await clickWire(page, "w0"); await clickWire(page, "w1", true);
  await expect(page.locator(".react-flow__edge.selected")).toHaveCount(2);
  await node("b").click({ modifiers: ["Shift"], position: { x: 40, y: 24 } });
  await expect(page.locator(".react-flow__edge.selected")).toHaveCount(2);
  await expect(page.locator(".react-flow__node.selected")).toHaveCount(1);
  await page.keyboard.press("Delete");
  await expect(page.locator(".react-flow__node")).toHaveCount(2);
  await expect(page.locator(".react-flow__edge")).toHaveCount(0);
  await page.keyboard.press("Control+z");
  await expect(page.locator(".react-flow__node")).toHaveCount(3);
  await expect(page.locator(".react-flow__edge")).toHaveCount(2);
  await page.keyboard.press("Control+Shift+z");
  await expect(page.locator(".react-flow__node")).toHaveCount(2);
  await page.keyboard.press("Control+z");
  await page.getByRole("button", { name: "Pilih area", exact: true }).click();
  const pane = (await page.locator(".react-flow__pane").boundingBox())!;
  await page.mouse.move(pane.x + 8, pane.y + 8); await page.mouse.down();
  await page.mouse.move(pane.x + Math.min(700, pane.width - 8), pane.y + 200, { steps: 12 }); await page.mouse.up();
  await expect(page.locator(".react-flow__node.selected")).toHaveCount(3);
  await page.getByTestId("circuit-canvas").focus(); await page.keyboard.press("Control+a");
  await expect(page.locator(".react-flow__edge.selected")).toHaveCount(2);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Hapus yang dipilih", exact: true })).toBeDisabled();
});

test("clear circuit confirms, preserves code and draft, and text fields keep Ctrl+A", async ({ page }) => {
  await selectionCircuit(page);
  await page.getByRole("button", { name: "Hapus seluruh rangkaian", exact: true }).click();
  await page.getByRole("button", { name: "Batal", exact: true }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(3);
  await page.getByLabel("Cari komponen").fill("hello");
  await page.keyboard.press("Control+a"); await page.keyboard.press("Backspace");
  await expect(page.locator(".react-flow__node")).toHaveCount(3);
  await expect(page.locator(".react-flow__node.selected")).toHaveCount(0);
  await page.getByRole("button", { name: "Hapus seluruh rangkaian", exact: true }).click();
  await page.getByRole("button", { name: "Hapus rangkaian", exact: true }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(0);
  await page.getByTestId("circuit-canvas").focus(); await page.keyboard.press("Control+z");
  await expect(page.locator(".react-flow__node")).toHaveCount(3);
  await page.keyboard.press("Control+Shift+z");
  await expect(page.locator(".react-flow__node")).toHaveCount(0);
  await page.waitForTimeout(1500); await page.reload();
  await expect(page.locator(".react-flow__node")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Rangkaian aman");
  await page.getByRole("link", { name: "Code", exact: true }).click();
  await expect(page.locator(".monaco-editor")).toBeVisible();
  await expect(page.locator(".monaco-editor")).toContainText("keep");
  await page.locator(".monaco-editor textarea").first().focus();
  await page.keyboard.press("Control+a"); await page.keyboard.type("// New source");
  await page.getByRole("link", { name: "Circuit", exact: true }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(0);
});

test("seven new components reuse actual visuals, expose pins, and survive export and draft recovery", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/simulator");
  const parts = page.getByRole("complementary", { name: "Parts", exact: true });
  for (const type of ["ldr", "hcsr04", "pir", "buzzer", "servo", "lcd16x2", "oled"]) {
    const definition = getDefinition(type);
    await parts.getByLabel("Cari komponen").fill(type);
    const tile = parts.getByRole("button", { name: definition.name, exact: true });
    await expect(tile.locator(`[data-hardware='${type}']`)).toHaveCount(1);
    await expect(tile).toContainText(definition.support === "visual-only" ? "Visual saja" : "Subset edukatif");
    await tile.click();
    const node = page.locator(".react-flow__node").filter({ has: page.locator(`[data-hardware='${type}']`) });
    await expect(node.locator(".react-flow__handle")).toHaveCount(definition.pins.length);
  }
  await expect(page.locator(".react-flow__node")).toHaveCount(7);
  await page.getByRole("button", { name: "Buka menu proyek" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Ekspor JSON", exact: true }).click();
  const stream = await (await downloadPromise).createReadStream();
  if (!stream) throw new Error("Ekspor tidak menghasilkan file.");
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    if (typeof chunk === "string") chunks.push(Buffer.from(chunk));
    else if (chunk instanceof Uint8Array) chunks.push(chunk);
  }
  const exported = deserializeProject(Buffer.concat(chunks).toString());
  expect(exported.schemaVersion).toBe(1);
  expect(new Set(exported.components.map((c) => c.type)).size).toBe(7);
  for (const component of exported.components) expect(component.properties).toEqual(getDefinition(component.type).defaults);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1500); await page.reload();
  await expect(page.locator(".react-flow__node")).toHaveCount(7);
  await parts.getByLabel("Cari komponen").fill("");
  await parts.getByRole("button", { name: "Displays", exact: true }).click();
  await expect(parts.locator("[data-component-type]")).toHaveCount(2);
  await page.screenshot({ path: "test-results/workspace-new-components.png" });
});

test("new component gallery stays readable in both themes and Properties edits keep selection intact", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/simulator");
  const project = fixture({ ldr: "ldr", hcsr04: "hcsr04", pir: "pir", buzzer: "buzzer", servo: "servo", lcd: "lcd16x2", oled: "oled" }, [], "void setup(){}void loop(){delay(10);}");
  const positions = [[40, 20], [260, 20], [680, 20], [40, 300], [260, 300], [40, 570], [680, 570]];
  project.components.forEach((component, i) => { component.position = { x: positions[i][0], y: positions[i][1] }; });
  await page.getByRole("button", { name: "Buka menu proyek" }).click();
  await page.getByLabel("Impor JSON", { exact: true }).setInputFiles({ name: "gallery.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(project)) });
  await page.keyboard.press("Escape");
  await expect(page.locator(".react-flow__node")).toHaveCount(7);
  await page.getByRole("button", { name: "Focus Mode", exact: true }).click();
  for (const theme of ["Terang", "Gelap", "Terang"]) {
    await page.getByRole("button", { name: /^Pilih tema:/ }).click();
    await page.getByRole("menuitemradio", { name: theme, exact: true }).click();
    await expect(page.getByRole("menu")).not.toBeVisible();
    await page.locator(".react-flow__controls-fitview").click();
    await page.waitForTimeout(250);
    for (const type of ["ldr", "hcsr04", "pir", "buzzer", "servo", "lcd16x2", "oled"]) await expect(page.locator(`.react-flow__node [data-hardware='${type}']`)).toBeVisible();
    await expect(page.locator("[data-hardware='ldr'] circle").first()).toHaveCSS("fill", "rgb(219, 201, 157)");
    await page.screenshot({ animations: "disabled", path: `playwright-report/workspace-gallery-${theme}.png` });
  }
  await page.getByRole("button", { name: "Focus Mode", exact: true }).click();
  await page.locator(".react-flow__controls-fitview").click();
  await page.locator(".react-flow__node[data-id='servo']").click({ position: { x: 10, y: 10 } });
  await page.getByRole("complementary", { name: "Properties", exact: true }).getByLabel("Nama", { exact: true }).focus();
  await page.keyboard.press("Control+a"); await page.keyboard.type("Servo latihan");
  await expect(page.locator(".react-flow__node")).toHaveCount(7);
  await expect(page.locator(".react-flow__node.selected")).toHaveCount(1);
  await expect(page.getByLabel("Sudut pratinjau (°)", { exact: true })).toHaveValue("90");
});

test.describe("touch workspace", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 360, height: 800 } });
  test("mobile sheets scroll, selection actions work by touch, and themes remain readable", async ({ page }) => {
    await page.goto("/simulator");
    await page.getByRole("button", { name: "Parts", exact: true }).tap();
    const sheet = page.getByRole("dialog");
    await sheet.getByRole("button", { name: "Actuators", exact: true }).tap();
    const servo = sheet.getByRole("button", { name: "Servo Motor", exact: true });
    await servo.scrollIntoViewIfNeeded(); await servo.tap();
    await sheet.getByRole("button", { name: "Buzzer aktif", exact: true }).tap();
    await sheet.getByRole("button", { name: "Tutup", exact: true }).tap();
    await expect(page.locator(".react-flow__node")).toHaveCount(2);
    await page.getByRole("button", { name: "Pilih semua", exact: true }).tap();
    await expect(page.locator(".react-flow__node.selected")).toHaveCount(2);
    await page.getByRole("button", { name: "Hapus yang dipilih", exact: true }).tap();
    await expect(page.locator(".react-flow__node")).toHaveCount(0);
    await page.getByRole("button", { name: "Properties", exact: true }).tap();
    await sheet.getByRole("button", { name: "Undo", exact: true }).tap();
    await expect(page.locator(".react-flow__node")).toHaveCount(2);
    await sheet.getByRole("button", { name: "Tutup", exact: true }).tap();
    await page.waitForTimeout(1500);
    for (const [theme, width] of [["light", 360], ["dark", 390], ["system", 430]] as const) {
      await page.evaluate((theme) => localStorage.setItem("vircuit-theme", theme), theme);
      await page.setViewportSize({ width, height: 800 });
      await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
      await page.reload();
      await expect(page.locator("html")).toHaveClass(theme === "light" ? /light/ : /dark/);
      await expect(page.locator(".react-flow__node")).toHaveCount(2);
      await page.getByRole("button", { name: "Parts", exact: true }).tap();
      await sheet.getByRole("button", { name: "Displays", exact: true }).tap();
      await expect(sheet.getByRole("button", { name: "LCD 16×2 (I2C)", exact: true }).locator("svg")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `playwright-report/workspace-${theme}-${width}.png` });
      await sheet.getByRole("button", { name: "Tutup", exact: true }).tap();
    }
  });
});
