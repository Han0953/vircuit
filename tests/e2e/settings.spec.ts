import { expect, test, type Page } from "@playwright/test";
import { fixture } from "../../features/simulator/tests/fixtures";

const provider = "http://127.0.0.1:3031";
const owner = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
async function login(page: Page) {
  await page.goto("/dashboard/pengaturan");
  await expect(page).toHaveURL(/masuk\?next=%2Fdashboard%2Fpengaturan/);
  await page.getByLabel("Email", { exact: true }).fill("dashboard@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  await expect(page).toHaveURL(/\/dashboard\/pengaturan$/);
  await expect(page.getByLabel("Nama tampilan")).toHaveValue("Astra");
}
async function category(page: Page, name: string) {
  await page.getByRole("tab", { name, exact: false }).click();
  await expect(page.getByRole("tab", { name, exact: false })).toHaveAttribute("aria-selected", "true");
}
test.beforeEach(async ({ page, request }) => {
  await request.post(`${provider}/__fixture/reset`, { data: { count: 2 } });
  await page.route("https://*.supabase.co/auth/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const response = await route.fetch({ url: `${provider}${url.pathname}${url.search}` });
    await route.fulfill({ response });
  });
});

test("profile save, validation, failure, category preservation and live dashboard identity", async ({ page, request }) => {
  await login(page);
  const mirror = await page.context().newPage();
  await mirror.goto("/dashboard");
  await page.getByLabel("Nama tampilan").fill(" ");
  await page.getByRole("button", { name: "Simpan profil" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("2–100");
  await page.getByLabel("Nama tampilan").fill("Nadia Putri");
  await category(page, "Tampilan"); await category(page, "Profil Saya");
  await expect(page.getByLabel("Nama tampilan")).toHaveValue("Nadia Putri");
  await request.post(`${provider}/__fixture/failure`, { data: { enabled: true } });
  await page.getByRole("button", { name: "Simpan profil" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("belum dapat disimpan");
  await expect(page.getByLabel("Nama tampilan")).toHaveValue("Nadia Putri");
  await request.post(`${provider}/__fixture/failure`, { data: { enabled: false } });
  await page.getByRole("button", { name: "Simpan profil" }).click();
  await expect(page.getByRole("status")).toContainText("berhasil disimpan");
  await expect(mirror.getByRole("heading", { name: "Halo, Nadia Putri!" })).toBeVisible();
  await mirror.close();
  await page.getByRole("button", { name: "Menu akun" }).click();
  await expect(page.getByRole("menu")).toContainText("Nadia Putri");
  await page.keyboard.press("Escape");
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Halo, Nadia Putri!" })).toBeVisible();
  await page.getByRole("button", { name: "Menu akun" }).click();
  await page.getByRole("menuitem", { name: "Pengaturan" }).click();
  await expect(page.getByLabel("Nama tampilan")).toHaveValue("Nadia Putri");
  await page.getByLabel("Nama tampilan").fill("Belum disimpan");
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("belum disimpan");
  await page.getByRole("button", { name: "Tetap di pengaturan" }).click();
  await expect(page.getByRole("link", { name: "Dashboard", exact: true })).toBeFocused();
  await expect(page.getByLabel("Nama tampilan")).toHaveValue("Belum disimpan");
  await page.getByRole("button", { name: "Menu akun" }).click();
  await page.getByRole("menuitem", { name: "Keluar akun" }).click();
  await expect(page.getByRole("dialog")).toContainText("belum disimpan");
  await page.getByRole("button", { name: "Tetap di pengaturan" }).click();
  await page.evaluate(() => window.history.back());
  await expect(page.getByRole("dialog")).toContainText("belum disimpan");
  await page.getByRole("button", { name: "Tetap di pengaturan" }).click();
  await expect(page).toHaveURL(/\/dashboard\/pengaturan$/);
  await page.getByRole("button", { name: "Batalkan perubahan", exact: true }).click();
});

test("account confirmation, password handling and existing logout", async ({ page }) => {
  await login(page); await category(page, "Akun & Keamanan");
  await expect(page.getByText("Terverifikasi", { exact: true })).toBeVisible();
  await page.getByLabel("Email baru").fill("new@example.test");
  await page.getByRole("button", { name: "Kirim konfirmasi email" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Permintaan dikirim" })).toBeVisible();
  await expect(page.getByText("Menunggu konfirmasi:", { exact: false })).toContainText("new@example.test");
  await expect(page.getByText("dashboard@example.test", { exact: true })).toBeVisible();
  await page.getByLabel("Kata sandi saat ini").fill("fixture-password");
  await page.getByLabel("Kata sandi baru", { exact: true }).fill("new-password");
  await page.getByLabel("Konfirmasi kata sandi", { exact: true }).fill("mismatch-password");
  await page.getByRole("button", { name: "Simpan kata sandi" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("tidak cocok");
  await page.getByLabel("Konfirmasi kata sandi", { exact: true }).fill("new-password");
  await page.getByRole("button", { name: "Simpan kata sandi" }).click();
  await expect(page.getByRole("status").filter({ hasText: "berhasil diperbarui" })).toBeVisible();
  await expect(page.getByLabel("Kata sandi baru", { exact: true })).toHaveValue("");
  const stored = await page.evaluate(() => Object.values(localStorage));
  expect(stored.join(" ")).not.toContain("new-password");
  await page.getByRole("button", { name: "Keluar akun", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Keluar akun", exact: true }).click();
  await expect(page).toHaveURL(/masuk/);
  await page.goto("/dashboard/pengaturan"); await expect(page).toHaveURL(/masuk/);
});

test("OAuth account offers verified password setup without assuming an existing password", async ({ page, request }) => {
  await request.post(`${provider}/__fixture/reset`, { data: { count: 0, oauth: true } });
  await login(page); await category(page, "Akun & Keamanan");
  await expect(page.getByText("google", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Kata sandi saat ini")).toHaveCount(0);
  await page.getByRole("button", { name: "Kirim kode keamanan" }).click();
  await expect(page.getByRole("status")).toContainText("kode verifikasi keamanan");
});

test("theme, motion, density, reading and canvas preferences persist with real effects", async ({ page }) => {
  await login(page); await category(page, "Tampilan");
  for (const name of ["Terang", "Gelap", "Sistem"]) {
    await page.getByRole("radio", { name, exact: true }).check();
    await expect(page.getByRole("radio", { name, exact: true })).toBeChecked();
    if (name === "Gelap") await expect(page.locator("html")).toHaveClass(/dark/);
    if (name === "Terang") await expect(page.locator("html")).not.toHaveClass(/dark/);
    await expect(page.getByRole("button", { name: `Pilih tema tampilan (Saat ini: ${name})` })).toBeVisible();
  }
  const comfortable = await page.locator("[role='tabpanel']:not([hidden]) [data-settings-motion].rounded-xl").first().evaluate((element) => getComputedStyle(element).paddingTop);
  await page.getByRole("radio", { name: "Ringkas", exact: false }).check();
  await expect(page.locator("[data-dashboard-shell]")).toHaveAttribute("data-density", "compact");
  const compact = await page.locator("[role='tabpanel']:not([hidden]) [data-settings-motion].rounded-xl").first().evaluate((element) => getComputedStyle(element).paddingTop);
  expect(parseFloat(compact)).toBeLessThan(parseFloat(comfortable));
  await page.getByRole("radio", { name: "Kurangi animasi" }).check();
  await expect(page.locator("[data-dashboard-shell]")).toHaveAttribute("data-motion-preference", "reduced");
  await category(page, "Virtual Lab");
  await page.getByRole("checkbox", { name: "Tampilkan grid canvas", exact: false }).uncheck();
  await page.getByRole("checkbox", { name: "Snap ke grid", exact: false }).check();
  await category(page, "Pembelajaran");
  await page.getByRole("radio", { name: "Lebih besar", exact: false }).check();
  await expect(page.locator("[data-dashboard-shell]")).toHaveAttribute("data-reading", "large");
  await page.reload(); await category(page, "Tampilan");
  await expect(page.getByRole("radio", { name: "Kurangi animasi" })).toBeChecked();
  await expect(page.getByRole("radio", { name: "Ringkas", exact: false })).toBeChecked();
  await page.goto("/simulator");
  await expect(page.getByTestId("circuit-canvas")).toBeVisible();
  await expect(page.locator(".react-flow__background")).toHaveCount(0);
  await page.goto("/dashboard/learn/dasar-iot/tegangan-ground");
  await expect(page.locator("[data-lesson-reading]")).toHaveCSS("font-size", "18px");
});

test("safe data export, confirmed archive deletion, preference reset and layout reset preserve project", async ({ page }) => {
  await login(page);
  const project = fixture({ uno: "uno", led: "led" }, [], "void setup() {}\nvoid loop() {}");
  await page.evaluate(async ({ owner, project }) => {
    localStorage.setItem("vircuit-workspace-layout-v1", JSON.stringify({ left: { visible: false, size: 17 }, right: { visible: false, size: 18 }, bottom: { visible: false, size: 50 } }));
    const db = await new Promise<IDBDatabase>((resolve) => { const request = indexedDB.open("vircuit-projects", 1); request.onupgradeneeded = () => request.result.createObjectStore("drafts", { keyPath: "scope" }); request.onsuccess = () => resolve(request.result); });
    await new Promise<void>((resolve) => { const tx = db.transaction("drafts", "readwrite"); const draft = { id: crypto.randomUUID(), project, localRevision: 1, savedLocalRevision: -1, cloud: null, saveIntent: false, updatedAt: 100, pending: null }; tx.objectStore("drafts").put({ ...draft, scope: `user:${owner}` }); tx.objectStore("drafts").put({ ...draft, scope: `archive:user:${owner}:example` }); tx.oncomplete = () => resolve(); }); db.close();
  }, { owner, project });
  await category(page, "Virtual Lab");
  await page.getByRole("button", { name: "Reset layout workspace" }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("vircuit-workspace-layout-v1")!))).toEqual({ left: { visible: true, size: 22 }, right: { visible: true, size: 22 }, bottom: { visible: true, size: 30 } });
  await category(page, "Data & Privasi"); await page.getByRole("button", { name: "Muat ulang draft" }).click();
  await expect(page.getByText("Arsip pemulihan", { exact: false })).toBeVisible();
  const download = page.waitForEvent("download"); await page.getByRole("button", { name: "Ekspor", exact: false }).first().click(); expect((await download).suggestedFilename()).toMatch(/vircuit-.*\.json/);
  await page.getByRole("button", { name: "Hapus arsip", exact: false }).click();
  await page.getByRole("button", { name: "Batal", exact: true }).click();
  await expect(page.getByText("Arsip pemulihan", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Hapus arsip", exact: false }).click();
  await page.getByRole("button", { name: "Konfirmasi", exact: true }).click();
  await expect(page.getByText("Arsip pemulihan", { exact: false })).toHaveCount(0);
  await expect(page.getByText("Draft akun aktif", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Reset preferensi lokal", exact: true }).click();
  await page.getByRole("button", { name: "Konfirmasi", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("dikembalikan");
  await page.goto("/simulator"); await expect(page.locator(".react-flow__node")).toHaveCount(2);
});

test("mobile/desktop categories, keyboard access, reduced motion and no overflow", async ({ page }) => {
  await login(page);
  await category(page, "Akun & Keamanan");
  await expect.poll(() => page.locator("[role='tabpanel']:not([hidden]) [data-settings-motion]").evaluateAll((elements) => elements.every((element) => element instanceof HTMLElement && element.style.opacity === "" && element.style.transform === ""))).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [360, 390, 430, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const name of ["Profil Saya", "Akun & Keamanan", "Tampilan", "Virtual Lab", "Pembelajaran", "Data & Privasi"]) {
      await category(page, name);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      expect(await page.locator("[role='tabpanel']:not([hidden]) [data-settings-motion]").evaluateAll((elements) => elements.every((element) => element instanceof HTMLElement && element.style.transform === ""))).toBe(true);
    }
    await page.screenshot({ path: `test-results/settings-${width}.png`, fullPage: true });
  }
  await page.getByRole("tab", { name: "Data & Privasi", exact: false }).focus();
  await page.keyboard.press("Home"); await expect(page.getByRole("tab", { name: "Profil Saya", exact: false })).toBeFocused();
  await page.keyboard.press("ArrowRight"); await expect(page.getByRole("tab", { name: "Akun & Keamanan", exact: false })).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Buka navigasi menu" }).click();
  await expect(page.getByRole("dialog").getByRole("link", { name: "Pengaturan", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Buka navigasi menu" })).toBeFocused();
});

test("snap changes subsequent drags and cross-tab layout reset preserves existing project data", async ({ page }) => {
  await login(page);
  await category(page, "Virtual Lab");
  await page.getByRole("checkbox", { name: "Snap ke grid", exact: false }).check();
  const project = fixture({ led: "led" }, [], "void setup() {}\nvoid loop() {}");
  project.components[0].position = { x: 100, y: 100 };
  await page.evaluate(async ({ owner, project }) => {
    localStorage.setItem("vircuit-workspace-layout-v1", JSON.stringify({ left: { visible: false, size: 17 }, right: { visible: false, size: 18 }, bottom: { visible: false, size: 50 } }));
    const db = await new Promise<IDBDatabase>((resolve) => { const request = indexedDB.open("vircuit-projects", 1); request.onupgradeneeded = () => request.result.createObjectStore("drafts", { keyPath: "scope" }); request.onsuccess = () => resolve(request.result); });
    await new Promise<void>((resolve) => { const tx = db.transaction("drafts", "readwrite"); tx.objectStore("drafts").put({ id: crypto.randomUUID(), scope: `user:${owner}`, project, localRevision: 0, savedLocalRevision: -1, cloud: null, cloudPaused: true, saveIntent: false, updatedAt: 100 }); tx.oncomplete = () => resolve(); }); db.close();
  }, { owner, project });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/simulator");
  const node = page.locator(".react-flow__node");
  await expect(node).toHaveCount(1);
  await expect(node).toHaveCSS("transform", "matrix(1, 0, 0, 1, 100, 100)");
  const box = (await node.boundingBox())!;
  await page.mouse.move(box.x + 24, box.y + 24); await page.mouse.down();
  await page.mouse.move(box.x + 61, box.y + 71, { steps: 8 }); await page.mouse.up();
  await expect(node).toHaveCSS("transform", "matrix(1, 0, 0, 1, 140, 140)");
  const settings = await page.context().newPage();
  await settings.goto("/dashboard/pengaturan"); await category(settings, "Virtual Lab");
  await settings.getByRole("button", { name: "Reset layout workspace" }).click();
  await expect(page.getByRole("complementary", { name: "Parts", exact: true })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Properties", exact: true })).toBeVisible();
  await expect(node).toHaveCount(1);
  await expect(node).toHaveCSS("transform", "matrix(1, 0, 0, 1, 140, 140)");
  await settings.close();
});
