import { expect, test, type Page } from "@playwright/test";
import { fixture } from "../../features/simulator/tests/fixtures";
import type { Draft } from "../../features/projects/local/drafts";

const provider = "http://127.0.0.1:3031";
const owner = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const source = "void setup(){pinMode(13,OUTPUT);Serial.begin(9600);}void loop(){digitalWrite(13,HIGH);Serial.println(13);delay(500);digitalWrite(13,LOW);delay(500);}";
const circuit = { ...fixture({ board: "uno", r: "resistor", led: "led" }, [["board.D13", "r.1"], ["r.2", "led.A"], ["led.K", "board.GND"]], source), metadata: { name: "Cloud laboratory" }, viewport: { x: 15, y: 20, zoom: 1.2 } };
async function browserAuth(page: Page) {
  await page.route("https://*.supabase.co/auth/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const response = await route.fetch({ url: `${provider}${url.pathname}${url.search}` });
    await route.fulfill({ response });
  });
}
async function login(page: Page, next = "/simulator") {
  await page.goto(`/masuk?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email", { exact: true }).fill("dashboard@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  await expect(page).toHaveURL(new RegExp(next + "$"));
}
async function stored(page: Page, scope = `user:${owner}`): Promise<Draft | null> {
  return page.evaluate(async (scope) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("vircuit-projects", 1);
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise<Draft | null>((resolve, reject) => {
        const request = db.transaction("drafts").objectStore("drafts").get(scope);
        request.onsuccess = () => resolve(request.result ?? null); request.onerror = () => reject(request.error);
      });
    } finally { db.close(); }
  }, scope);
}
async function importCircuit(page: Page) {
  await page.getByRole("button", { name: "Buka menu proyek" }).click();
  await page.getByLabel("Impor JSON", { exact: true }).setInputFiles({ name: "project.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(circuit)) });
  if (await page.getByRole("dialog").isVisible()) await page.keyboard.press("Escape");
  await expect(page.locator(".react-flow__node")).toHaveCount(3);
}
async function editCode(page: Page, value: string) {
  if (!page.url().includes("/simulator/code")) await page.getByRole("link", { name: "Code", exact: true }).click();
  await expect(page.locator(".monaco-editor")).toBeVisible();
  await page.evaluate((value) => {
    const editor = (window as unknown as { __vircuitEditor?: { setValue: (value: string) => void } }).__vircuitEditor;
    if (!editor) throw new Error("Editor not ready"); editor.setValue(value);
  }, value);
}
test.beforeEach(async ({ page, request }) => {
  await request.post(`${provider}/__fixture/reset`, { data: { count: 0 } });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await browserAuth(page);
});

test("account autosave, offline replay, separate device, conflict, delete and relogin (local provider)", async ({ page, request, browser }) => {
  test.setTimeout(120000);
  await login(page);
  await expect(page.getByRole("button", { name: "Run", exact: true })).toBeVisible();
  await page.waitForTimeout(2000);
  expect((await (await request.get(`${provider}/__fixture/state`)).json()).saves).toBe(0);
  await importCircuit(page);
  await expect(page.getByText("Tersimpan di akun", { exact: true })).toBeVisible();
  const first = (await stored(page))!;
  expect(first.cloud?.revision).toBe(1);
  expect(first.project.wires).toEqual(circuit.wires);
  expect(first.project.components).toEqual(circuit.components);
  expect(first.project.settings).toEqual(circuit.settings);
  await page.reload(); await expect(page.locator(".react-flow__node")).toHaveCount(3);
  expect((await stored(page))?.id).toBe(first.id);
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByTestId("output-led")).toHaveAttribute("data-value", "1");
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await editCode(page, source);
  await page.context().setOffline(true);
  await editCode(page, source + "\n// offline first");
  await expect(page.getByRole("button", { name: "Coba simpan lagi", exact: true })).toBeVisible();
  const pending = (await stored(page))!.pending!;
  await editCode(page, source + "\n// offline latest");
  await expect.poll(async () => (await stored(page))?.project.code.source).toContain("offline latest");
  await page.context().setOffline(false);
  await expect(page.getByText("Tersimpan di akun", { exact: true })).toBeVisible();
  await expect.poll(async () => (await stored(page))?.savedLocalRevision === (await stored(page))?.localRevision).toBe(true);
  expect((await stored(page))?.pending).toBeNull();
  expect(pending.request.operationId).toBeTruthy();
  expect((await (await request.get(`${provider}/__fixture/state`)).json()).count).toBe(1);

  const device = await browser.newContext({ baseURL: "http://localhost:3002", viewport: { width: 390, height: 844 } });
  try {
    const other = await device.newPage(); await browserAuth(other); await login(other, "/dashboard/projects");
    await other.getByRole("link", { name: "Buka proyek Cloud laboratory", exact: true }).click();
    await expect(other).toHaveURL(/\/simulator$/);
    await expect.poll(async () => (await stored(other))?.project.code.source).toContain("offline latest");
    expect((await stored(other))?.project.wires).toEqual(circuit.wires);
    expect((await stored(other))?.project.components).toEqual(circuit.components);
    expect((await stored(other))?.project.viewport).toEqual((await stored(page))?.project.viewport);
    await editCode(other, source + "\n// other device");
    await expect.poll(async () => (await stored(other))?.savedLocalRevision === (await stored(other))?.localRevision).toBe(true);
    await editCode(page, source + "\n// local conflict");
    await expect(page.getByRole("alert").first()).toContainText("Revision berbeda");
    expect((await stored(page))?.project.code.source).toContain("local conflict");
    await page.getByRole("button", { name: "Selesaikan konflik" }).click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Buka versi cloud", exact: true }).click();
    await expect.poll(async () => (await stored(page))?.project.code.source).toContain("other device");
    await page.getByRole("button", { name: "Buka menu proyek" }).click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Hapus Cloud laboratory", exact: true }).click();
    await expect.poll(async () => (await stored(page))?.cloudPaused).toBe(true);
    if (await page.getByRole("dialog").isVisible()) await page.keyboard.press("Escape");
    await editCode(page, source + "\n// detached after delete");
    await page.waitForTimeout(2200);
    expect((await (await request.get(`${provider}/__fixture/state`)).json()).count).toBe(0);
    expect((await stored(page))?.cloud).toBeNull();
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Menu akun" }).click();
    await page.getByRole("menuitem", { name: "Keluar akun" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Keluar akun", exact: true }).click();
    await expect(page).toHaveURL(/\/masuk/);
    expect(await stored(page)).toBeNull();
    await login(page, "/dashboard/projects");
    await expect(page.getByRole("heading", { name: "Belum ada proyek tersimpan" })).toBeVisible();
  } finally { await device.close(); }
});

test("ordinary login offers migration, decline keeps guest, failure and retry preserve its identity", async ({ page }) => {
  test.setTimeout(60000);
  await page.goto("/simulator"); await importCircuit(page);
  await expect.poll(async () => (await stored(page, "guest"))?.project.components.length).toBe(3);
  const guest = (await stored(page, "guest"))!;
  await login(page);
  await expect(page.getByRole("heading", { name: "Simpan draft tamu ke akun?" })).toBeVisible();
  await page.getByRole("button", { name: "Nanti saja", exact: true }).click();
  expect((await stored(page, "guest"))?.id).toBe(guest.id);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Simpan draft tamu ke akun?" })).toBeVisible();
  let fail = true;
  await page.route("**/api/projects", (route) => fail && route.request().method() === "POST" ? route.fulfill({ status: 503, json: { error: "Cloud unavailable" } }) : route.continue());
  await page.getByRole("button", { name: "Simpan ke akun", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("Cloud unavailable");
  expect((await stored(page, "guest"))?.id).toBe(guest.id);
  const pending = (await stored(page))!.pending!;
  fail = false;
  await page.getByRole("dialog").getByRole("button", { name: "Coba lagi", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByText("Tersimpan di akun", { exact: true })).toBeVisible();
  expect(await stored(page, "guest")).toBeNull();
  expect((await stored(page))?.id).toBe(guest.id);
  expect((await stored(page))?.savedLocalRevision).toBe(pending.localRevision);
  await page.reload(); await expect(page.locator(".react-flow__node")).toHaveCount(3);
});
