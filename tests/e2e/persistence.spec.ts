import { test, expect, type Page } from "@playwright/test";
import { fixture } from "../../features/simulator/tests/fixtures";
import type { Project } from "../../features/simulator/types/project";
const owner = "11111111-1111-4111-8111-111111111111";
const cloudId = "22222222-2222-4222-8222-222222222222";
const circuit = fixture({ board: "uno", r: "resistor", led: "led" }, [["board.D13", "r.1"], ["r.2", "led.A"], ["led.K", "board.GND"]], "void setup(){pinMode(13,OUTPUT);}void loop(){digitalWrite(13,HIGH);delay(500);digitalWrite(13,LOW);delay(500);}");
async function importCircuit(page: Page) {
  await page.getByRole("button", { name: "Buka menu proyek" }).click();
  await page.getByLabel("Impor JSON", { exact: true }).setInputFiles({ name: "draft.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(circuit)) });
  if (await page.getByRole("dialog").isVisible()) await page.keyboard.press("Escape");
  await expect(page.locator(".react-flow__node")).toHaveCount(3);
}
async function draft(page: Page, scope = "guest") {
  return page.evaluate(async (scope) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => { const r = indexedDB.open("vircuit-projects", 1); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(); });
    return new Promise<{ id: string; project: Project; localRevision: number; saveIntent: boolean } | null>((resolve) => { const r = db.transaction("drafts").objectStore("drafts").get(scope); r.onsuccess = () => { db.close(); resolve(r.result ?? null); }; });
  }, scope);
}
test.beforeEach(async ({ page }) => {
  await page.route("**/api/auth/session", (route) => route.fulfill({ json: { user: null } }));
});
test("real API rejects unauthenticated cloud access and cross-origin writes", async ({ request }) => {
  expect((await request.get("/api/projects")).status()).toBe(401);
  expect((await request.post("/api/projects", { headers: { Origin: "http://localhost:3002" }, data: {} })).status()).toBe(401);
  expect((await request.post("/api/projects", { headers: { Origin: "https://evil.test" }, data: {} })).status()).toBe(403);
});
test("guest snapshot survives refresh and canceled login; runtime ticks do not autosave", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto("/simulator");
  await importCircuit(page);
  await page.getByRole("link", { name: "Code", exact: true }).click();
  await expect(page.locator(".monaco-editor")).toBeVisible();
  const editedCode = circuit.code.source + "\n// Draft hasil edit Monaco\n";
  await page.evaluate((source) => {
    const editor = (window as unknown as { __vircuitEditor?: { setValue: (value: string) => void } }).__vircuitEditor;
    if (!editor) throw new Error("Editor belum siap"); editor.setValue(source);
  }, editedCode);
  await expect.poll(async () => (await draft(page))?.project.wires.length).toBe(3);
  await expect.poll(async () => (await draft(page))?.project.code.source).toBe(editedCode);
  const first = await draft(page);
  await page.reload(); await expect(page.locator(".react-flow__node")).toHaveCount(3);
  expect((await draft(page))?.id).toBe(first?.id);
  expect((await draft(page))?.project.code.source).toBe(editedCode);
  expect((await draft(page))?.project.components).toEqual(circuit.components);
  expect((await draft(page))?.project.wires).toEqual(circuit.wires);
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByTestId("output-led")).toHaveAttribute("data-value", "1");
  const revision = (await draft(page))?.localRevision;
  await page.waitForTimeout(1200);
  expect((await draft(page))?.localRevision).toBe(revision);
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await page.getByRole("button", { name: "Simpan proyek", exact: true }).click();
  await expect(page).toHaveURL(/\/masuk\?next=/);
  expect((await draft(page))?.saveIntent).toBe(true);
  await page.getByRole("link", { name: "Lanjutkan sebagai tamu", exact: true }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(3);
});
test("corrupted recovery does not overwrite the stored draft", async ({ page }) => {
  await page.goto("/simulator"); await expect(page.getByRole("button", { name: "Run", exact: true })).toBeVisible();
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => { const r = indexedDB.open("vircuit-projects", 1); r.onsuccess = () => resolve(r.result); });
    await new Promise<void>((resolve) => { const tx = db.transaction("drafts", "readwrite"); tx.objectStore("drafts").put({ scope: "guest", id: "corrupt", project: { schemaVersion: 99 } }); tx.oncomplete = () => { db.close(); resolve(); }; });
  });
  await page.reload(); await expect(page.getByRole("alert").filter({ hasText: "tidak ditimpa" })).toBeVisible();
  expect((await draft(page))?.id).toBe("corrupt");
  await expect(page.locator(".react-flow__node")).toHaveCount(0);
});

test("failed import backup restores the active draft and exposes an actionable error", async ({ page }) => {
  await page.goto("/simulator"); await importCircuit(page);
  await expect.poll(async () => (await draft(page))?.project.wires.length).toBe(3);
  const original = await draft(page);
  await page.getByRole("button", { name: "Buka menu proyek" }).click();
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (value: unknown, key?: IDBValidKey) {
      if (this.name === "drafts" && value && typeof value === "object" && "scope" in value && typeof value.scope === "string" && value.scope.startsWith("archive:")) {
        IDBObjectStore.prototype.put = put;
        throw new DOMException("Fixture: backup storage unavailable", "QuotaExceededError");
      }
      return put.call(this, value, key);
    };
  });
  const replacement = fixture({ board: "esp32" }, [], "void setup(){}void loop(){}");
  await page.getByLabel("Impor JSON", { exact: true }).setInputFiles({ name: "replacement.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(replacement)) });
  await expect(page.getByRole("alert").filter({ hasText: "Impor gagal" })).toBeVisible();
  await expect(page.locator(".react-flow__node")).toHaveCount(3);
  expect((await draft(page))?.id).toBe(original?.id);
  expect((await draft(page))?.project).toEqual(original?.project);
});
test("explicit guest migration, save retry, rename, load, delete and logout (mock cloud)", async ({ page }) => {
  let loggedIn = false; let revision = 0; let payload: Project | null = null; let failSave = false;
  const operations = new Map<string, number>(); let createCount = 0;
  await page.route("**/api/auth/session", (route) => route.fulfill({ json: { user: loggedIn ? { id: owner, email: "user@example.test" } : null } }));
  await page.route("**/api/auth/login", (route) => { loggedIn = true; return route.fulfill({ json: { next: route.request().postDataJSON().next } }); });
  await page.route("**/api/auth/logout", (route) => { loggedIn = false; return route.fulfill({ json: { ok: true } }); });
  await page.route("**/api/projects", async (route) => {
    if (route.request().method() === "GET") return route.fulfill({ json: payload ? [{ id: cloudId, title: payload.metadata.name, revision, updated_at: new Date().toISOString() }] : [] });
    if (failSave) return route.fulfill({ status: 503, json: { error: "Offline uji. Draft lokal tetap tersedia." } });
    const input = route.request().postDataJSON();
    if (!operations.has(input.operationId)) { if (!payload) createCount++; revision++; payload = input.payload; operations.set(input.operationId, revision); }
    return route.fulfill({ json: { id: cloudId, revision: operations.get(input.operationId) } });
  });
  await page.route(`**/api/projects/${cloudId}`, (route) => {
    if (route.request().method() === "DELETE") { payload = null; return route.fulfill({ json: { ok: true } }); }
    return route.fulfill({ json: { id: cloudId, revision, payload } });
  });
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto("/simulator"); await importCircuit(page);
  await page.getByRole("button", { name: "Simpan proyek", exact: true }).click();
  await page.getByLabel("Email", { exact: true }).fill("user@example.test"); await page.getByLabel("Kata sandi", { exact: true }).fill("testing-password");
  await page.getByRole("button", { name: "Masuk dengan email", exact: true }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(3); await expect(page.getByText("Tersimpan di akun", { exact: true })).toBeVisible();
  expect(createCount).toBe(1); expect(await draft(page)).toBeNull();
  failSave = true;
  await page.getByRole("button", { name: "Buka menu proyek" }).click();
  await page.getByLabel("Nama proyek aktif").fill("Rangkaian tersimpan"); await page.getByRole("button", { name: "Ganti nama", exact: true }).click();
  await expect(page.getByRole("alert").first()).toContainText("Offline uji");
  await page.keyboard.press("Escape"); failSave = false;
  await page.getByRole("button", { name: "Coba simpan lagi" }).click(); await expect(page.getByText("Tersimpan di akun", { exact: true })).toBeVisible();
  await page.reload(); await expect(page.locator(".react-flow__node")).toHaveCount(3);
  await page.getByRole("button", { name: "Buka menu proyek" }).click(); await page.getByRole("button", { name: "Buka", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Rangkaian tersimpan", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Buka menu proyek" }).click();
  page.once("dialog", (dialog) => dialog.accept()); await page.getByRole("button", { name: "Hapus Rangkaian tersimpan", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "Buka menu proyek" }).click();
  await expect(page.getByText("Belum ada proyek tersimpan.")).toBeVisible();
  await page.keyboard.press("Escape");
  page.once("dialog", (dialog) => dialog.accept()); await page.getByRole("button", { name: "Keluar akun" }).click();
  await expect(page.getByText("Tamu", { exact: true })).toBeVisible(); await expect(page.locator(".react-flow__node")).toHaveCount(0);
  expect(await draft(page, `user:${owner}`)).toBeNull();
});
test("mobile auth form labels, confirmation, and safe callback destination", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/auth/register", (route) => route.fulfill({ json: { confirmation: true } }));
  await page.goto("/daftar?next=https://evil.test");
  await page.getByLabel("Email", { exact: true }).fill("user@example.test"); await page.getByLabel("Kata sandi", { exact: true }).fill("testing-password");
  await page.getByRole("button", { name: "Daftar dengan email" }).click();
  await expect(page.getByRole("status")).toContainText("Periksa email");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.goto("/auth/callback?next=https://evil.test"); await expect(page).toHaveURL(/\/masuk\?error=callback&next=%2Fsimulator/);
});
