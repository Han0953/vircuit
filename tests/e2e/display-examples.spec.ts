import { expect, test, type Page } from "@playwright/test";
import { exampleProject } from "../../features/simulator/examples/projects";

async function storedDraft(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => { const request = indexedDB.open("vircuit-projects", 1); request.onsuccess = () => resolve(request.result); });
    return new Promise<{ id: string; project: { code: { source: string }; components: { type: string }[] } }>((resolve) => { const request = db.transaction("drafts").objectStore("drafts").get("guest"); request.onsuccess = () => { db.close(); resolve(request.result); }; });
  });
}
async function range(page: Page, label: RegExp, value: number) {
  await page.getByRole("slider", { name: label }).evaluate((el: HTMLInputElement, value) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(el, String(value));
    el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}
test("gallery opens LCD as a new draft, archives active circuit and displays real analog data", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto("/simulator");
  const parts = page.getByRole("complementary", { name: "Parts", exact: true });
  await parts.getByRole("button", { name: "Basic", exact: true }).click(); await parts.getByRole("button", { name: "LED", exact: true }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(1);
  await page.getByRole("button", { name: "Contoh rangkaian", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("img")).toHaveCount(12);
  await dialog.getByRole("button", { name: "Pilih LCD · pembacaan analog", exact: true }).click();
  await page.screenshot({ path: "playwright-report/examples-gallery-desktop.png" });
  await dialog.getByRole("button", { name: "Buka sebagai draft baru" }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(3);
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByTestId("display-screen")).toContainText("Input analog");
  await expect(page.getByTestId("display-screen")).toContainText("512");
  await page.locator(".react-flow__node[data-id='pot']").click({ position: { x: 10, y: 10 } }); await range(page, /^Posisi:/, 100);
  await expect(page.getByTestId("display-screen")).toContainText("1023");
  await expect(page.locator(".react-flow__node[data-id='screen'] [data-display-output]")).toContainText("1023");
  await page.screenshot({ path: "playwright-report/lcd-live-data.png" });
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await page.getByRole("button", { name: "Buka menu proyek" }).click();
  await expect(page.getByRole("region", { name: "Arsip draft lokal" })).toBeVisible();
  await page.keyboard.press("Escape"); await page.reload();
  await expect(page.locator(".react-flow__node")).toHaveCount(3);
  await expect(page.getByTestId("display-screen")).toContainText("belum diinisialisasi");
});

test("ESP32 OLED receives DHT data, reset clears the screen and bad I2C wiring reports a diagnostic", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto("/simulator");
  await page.getByRole("button", { name: "Contoh rangkaian", exact: true }).click();
  await page.getByLabel("Board contoh", { exact: true }).click(); await page.getByRole("menuitemradio", { name: "ESP32 DevKitC V4", exact: true }).click();
  await page.getByRole("button", { name: "Pilih OLED · suhu & kelembapan", exact: true }).click();
  await page.getByRole("button", { name: "Buka sebagai draft baru" }).click(); await expect(page.locator(".react-flow__node")).toHaveCount(3);
  await page.getByRole("button", { name: "Run", exact: true }).click(); await expect(page.getByTestId("display-screen")).toContainText("Suhu: 25");
  await page.locator(".react-flow__controls-fitview").click();
  await page.locator(".react-flow__node[data-id='dht']").click({ position: { x: 12, y: 12 } }); await range(page, /^Suhu °C:/, 35);
  await expect(page.getByTestId("display-screen")).toContainText("Suhu: 35");
  await page.screenshot({ path: "playwright-report/oled-live-data.png" });
  await page.getByRole("button", { name: "Reset simulasi" }).click(); await expect(page.getByTestId("display-screen")).toContainText("belum diinisialisasi");
  const invalid = exampleProject("lcd"); invalid.wires = invalid.wires.filter((w) => w.from.componentId !== "screen" || w.from.pinId !== "SDA");
  await page.getByRole("button", { name: "Buka menu proyek" }).click();
  await page.getByLabel("Impor JSON", { exact: true }).setInputFiles({ name: "bad-i2c.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(invalid)) });
  await page.keyboard.press("Escape"); await page.getByRole("button", { name: "Run", exact: true }).click();
  await page.getByRole("tab", { name: "Problems", exact: true }).click(); await expect(page.getByRole("tabpanel")).toContainText("SDA → A4");
});

test("code picker is keyboard accessible, confirmation can cancel and code-only examples retain circuit identity", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto("/simulator");
  await page.getByRole("button", { name: "Contoh rangkaian", exact: true }).click(); await page.getByRole("button", { name: "Buka sebagai draft baru" }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(3); const before = await storedDraft(page);
  await page.getByRole("link", { name: "Code", exact: true }).click(); await expect(page.locator(".monaco-editor")).toBeVisible();
  const picker = page.getByLabel("Contoh program", { exact: true }); await picker.focus(); await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitemradio")).toHaveCount(12);
  await expect(page.getByRole("menu")).toHaveCSS("opacity", "1");
  await page.screenshot({ path: "playwright-report/examples-program-dropdown.png" });
  await page.getByRole("menuitemradio", { name: "Serial · penghitung", exact: true }).click();
  await page.getByRole("button", { name: "Ganti kode dengan contoh", exact: true }).click(); await page.getByRole("button", { name: "Batal", exact: true }).click();
  await expect(page.locator(".monaco-editor")).not.toContainText("Hitungan:");
  await page.getByRole("button", { name: "Pratinjau rangkaian", exact: true }).click();
  await page.getByRole("checkbox", { name: "Gunakan rangkaian contoh juga" }).uncheck();
  await expect(page.getByLabel("Board contoh", { exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Gunakan kode saja" }).click(); await expect(page.locator(".monaco-editor")).toContainText("Hitungan:");
  await expect(page).toHaveURL(/\/simulator\/code$/); await page.waitForTimeout(900);
  const after = await storedDraft(page); expect(after.id).toBe(before.id); expect(after.project.components).toEqual(before.project.components);
  await page.getByRole("link", { name: "Circuit", exact: true }).click();
  await expect(page).toHaveURL(/\/simulator$/); await expect(page.getByTestId("circuit-canvas")).toBeVisible();
  await page.getByTestId("circuit-canvas").focus(); await expect(page.getByTestId("circuit-canvas")).toBeFocused(); await page.keyboard.press("Control+z");
  await page.getByRole("link", { name: "Code", exact: true }).click(); await expect(page.locator(".monaco-editor")).not.toContainText("Hitungan:");
});

test("mobile gallery and custom dropdown stay inside 360–430px in light dark and system themes", async ({ page }) => {
  for (const [theme, width] of [["light", 360], ["dark", 390], ["system", 430]] as const) {
    await page.setViewportSize({ width, height: 900 }); await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.addInitScript((theme) => localStorage.setItem("vircuit-theme", theme), theme); await page.goto("/simulator");
    await page.getByRole("button", { name: "Tindakan workspace", exact: true }).click();
    await page.getByRole("button", { name: "Contoh rangkaian", exact: true }).click();
    const dialog = page.getByRole("dialog"); await expect(dialog.getByRole("img")).toHaveCount(12);
    await page.getByLabel("Board contoh", { exact: true }).click();
    await expect(page.getByRole("menu")).toBeVisible(); await page.keyboard.press("Escape"); await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Pilih OLED · suhu & kelembapan", exact: true }).scrollIntoViewIfNeeded();
    await dialog.getByRole("button", { name: "Pilih OLED · suhu & kelembapan", exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const box = (await dialog.boundingBox())!; expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `playwright-report/examples-${theme}-${width}.png` }); await page.keyboard.press("Escape");
  }
});
