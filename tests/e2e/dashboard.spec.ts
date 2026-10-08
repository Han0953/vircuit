import { test, expect, type Page } from "@playwright/test";
import { fixture } from "../../features/simulator/tests/fixtures";

const provider = "http://127.0.0.1:3031";
const owner = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const first = "bbbbbbbb-bbbb-4bbb-8bbb-000000000001";
async function login(page: Page) {
  await page.goto("/masuk");
  await page.getByLabel("Email", { exact: true }).fill("dashboard@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Halo, Astra" })).toBeVisible();
}
async function readDraft(page: Page) {
  return page.evaluate(async (scope) => {
    const db = await new Promise<IDBDatabase>((resolve) => { const r = indexedDB.open("vircuit-projects", 1); r.onsuccess = () => resolve(r.result); });
    return new Promise<{ id: string; cloud: { id: string } | null; project: { components: unknown[]; metadata: { name: string } } }>((resolve) => {
      const r = db.transaction("drafts").objectStore("drafts").get(scope); r.onsuccess = () => { db.close(); resolve(r.result); };
    });
  }, `user:${owner}`);
}
test.beforeEach(async ({ request, page }) => {
  await request.post(`${provider}/__fixture/reset`, { data: { count: 105 } });
  // SSR requests use the Node preload; browser SDK requests use the same local provider.
  await page.route("https://*.supabase.co/auth/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const response = await route.fetch({ url: `${provider}${url.pathname}${url.search}` });
    await route.fulfill({ response });
  });
});
test("dashboard guards, real application listing, account-wide search and pagination (local provider)", async ({ page }) => {
  await page.goto("/dashboard/projects"); await expect(page).toHaveURL(/\/masuk\?next=/);
  await login(page);
  await expect(page.locator("h3")).toHaveCount(6);
  await expect(page.locator("h3").first()).toHaveText("Proyek 001");
  await page.screenshot({ path: "test-results/dashboard-desktop.png", fullPage: true });
  await page.getByRole("link", { name: "Lihat semua proyek" }).click();
  await expect(page.locator("h3")).toHaveCount(24);
  await page.getByRole("link", { name: "Berikutnya" }).click();
  await expect(page.locator("h3").first()).toHaveText("Proyek 025");
  await page.getByLabel("Cari di semua proyek akun").fill("Proyek 105");
  await page.getByRole("button", { name: "Cari", exact: true }).click();
  await expect(page.locator("h3")).toHaveText(["Proyek 105"]);
  await page.getByLabel("Cari di semua proyek akun").fill("tidak-ada");
  await page.getByRole("button", { name: "Cari", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tidak ada proyek yang cocok" })).toBeVisible();
});
test("server-confirmed rename/delete, conflict, and dashboard-only logout", async ({ page, request }) => {
  await login(page);
  await page.getByRole("button", { name: "Tindakan Proyek 001" }).click();
  await page.getByRole("menuitem", { name: "Ubah nama" }).click();
  await page.getByLabel("Nama proyek", { exact: true }).fill(" ");
  await page.getByRole("button", { name: "Simpan nama" }).click();
  await expect(page.getByText("Nama harus berisi 1–200 karakter.")).toBeVisible();
  await page.getByLabel("Nama proyek", { exact: true }).fill("Lampu laboratorium");
  await request.post(`${provider}/__fixture/conflict`, { data: { enabled: true } });
  await page.getByRole("button", { name: "Simpan nama" }).click();
  await expect(page.getByRole("alert")).toContainText("Revision berbeda");
  await request.post(`${provider}/__fixture/conflict`, { data: { enabled: false } });
  await page.getByRole("button", { name: "Muat versi terbaru" }).click();
  await page.getByRole("button", { name: "Tindakan Proyek 001" }).click();
  await page.getByRole("menuitem", { name: "Ubah nama" }).click();
  await page.getByLabel("Nama proyek", { exact: true }).fill("Lampu laboratorium");
  await page.getByRole("button", { name: "Simpan nama" }).click();
  await expect(page.getByRole("heading", { name: "Lampu laboratorium" })).toBeVisible();
  await page.getByRole("button", { name: "Tindakan Lampu laboratorium" }).click();
  await page.getByRole("menuitem", { name: "Hapus", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Lampu laboratorium");
  await page.getByRole("button", { name: "Hapus proyek", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Lampu laboratorium" })).toHaveCount(0);
  await page.getByRole("button", { name: "Menu akun" }).click();
  await page.getByRole("menuitem", { name: "Keluar akun" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Keluar akun", exact: true }).click();
  await expect(page).toHaveURL(/\/masuk/);
  await page.goto("/dashboard"); await expect(page).toHaveURL(/\/masuk/);
});
test("new intent once, open URL, local conflict, save and dashboard navigation", async ({ page, request }) => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await login(page);
  await page.getByRole("button", { name: "Proyek baru", exact: true }).click();
  await expect(page).toHaveURL(/\/simulator$/);
  await expect(page.getByRole("heading", { name: "Proyek tanpa judul" })).toBeVisible();
  const draft = await readDraft(page);
  expect(draft.cloud).toBeNull();
  expect((await (await request.get(`${provider}/__fixture/state`)).json()).saves).toBe(0);
  await page.goto(`/simulator?new=${draft.id}`); await expect(page).toHaveURL(/\/simulator$/);
  expect((await readDraft(page)).id).toBe(draft.id);
  await page.reload(); await expect(page.getByRole("heading", { name: "Proyek tanpa judul" })).toBeVisible();
  expect((await readDraft(page)).id).toBe(draft.id);
  await page.getByRole("button", { name: "Kembali ke dashboard" }).click();
  await page.getByRole("link", { name: "Buka Proyek 001", exact: true }).click();
  await expect(page).toHaveURL(/\/simulator$/);
  await expect(page.getByRole("heading", { name: "Proyek 001" })).toBeVisible();
  const circuit = fixture({ board: "uno", led: "led" }, [], "void setup(){}void loop(){}");
  await page.route("**/api/projects", async (route) => { if (route.request().method() === "POST") await route.fulfill({ status: 503, json: { error: "Offline test: draft aman" } }); else await route.continue(); });
  await page.getByRole("button", { name: "Buka menu proyek" }).click();
  await page.getByLabel("Impor JSON", { exact: true }).setInputFiles({ name: "circuit.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(circuit)) });
  if (await page.getByRole("dialog").isVisible()) await page.keyboard.press("Escape");
  await expect(page.locator(".react-flow__node")).toHaveCount(2);
  await page.getByRole("button", { name: "Kembali ke dashboard" }).click();
  await page.getByRole("link", { name: "Buka Proyek 001", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Perubahan lokal belum tersimpan");
  await page.getByRole("button", { name: "Lanjutkan draft lokal" }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(2);
  await page.unroute("**/api/projects");
  await page.getByRole("button", { name: /^(Simpan proyek|Coba simpan lagi)$/ }).click();
  await expect(page.getByRole("status").filter({ hasText: "Tersimpan di akun" })).toBeVisible();
  await page.getByRole("button", { name: "Kembali ke dashboard" }).click();
  await expect(page.getByRole("heading", { name: "Halo, Astra" })).toBeVisible();
  expect((await (await request.get(`${provider}/__fixture/state`)).json()).saves).toBeGreaterThan(0);
  await page.goto(`/simulator/code?project=${first}`); await expect(page).toHaveURL(/\/simulator\/code$/);
  await expect(page.locator(".monaco-editor")).toBeVisible();
  await expect(page.locator(".react-flow__node")).toHaveCount(2);
  await page.getByRole("link", { name: "Circuit", exact: true }).click();
  await expect(page).toHaveURL(/\/simulator$/);
  await expect(page.getByRole("heading", { name: "Proyek tanpa judul" })).toBeVisible();
  await page.goto("/simulator?project=invalid");
  await expect(page.getByRole("dialog")).toContainText("Tautan proyek tidak valid");
  await page.getByRole("button", { name: "Kembali ke draft lokal" }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(2);
});
test("mobile navigation, empty/error states and themes", async ({ page, request }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await request.post(`${provider}/__fixture/reset`, { data: { count: 0 } });
  await login(page);
  await expect(page.getByRole("heading", { name: "Belum ada proyek" })).toBeVisible();
  await page.getByRole("button", { name: "Buka navigasi" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Buka navigasi" })).toBeFocused();
  await page.getByRole("button", { name: "Buka navigasi" }).click();
  await page.getByRole("dialog").getByRole("link", { name: "Proyek Saya" }).click();
  await expect(page).toHaveURL(/\/dashboard\/projects$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await request.post(`${provider}/__fixture/reset`, { data: { failure: true } });
  await page.reload();
  await expect(page.getByRole("alert").filter({ hasText: "cloud belum dapat diakses" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Belum ada proyek" })).toHaveCount(0);
  await request.post(`${provider}/__fixture/reset`, { data: { count: 3 } });
  await page.getByRole("button", { name: "Coba lagi" }).click();
  await expect(page.locator("h3")).toHaveCount(3);
  for (const theme of ["light", "dark", "system"]) {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.getByRole("button", { name: /^Pilih tema:/ }).click();
    await page.getByRole("menuitemradio", { name: theme === "light" ? "Terang" : theme === "dark" ? "Gelap" : "Sistem" }).click();
    await expect(page.locator("html")).toHaveClass(theme === "light" ? /light/ : /dark/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    if (theme === "light") await page.screenshot({ path: "test-results/dashboard-mobile-light.png", fullPage: true });
  }
  await page.screenshot({ path: "test-results/dashboard-mobile.png", fullPage: true });
  for (const width of [430, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  }
});
