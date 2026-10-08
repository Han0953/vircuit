import { test, expect, type Page } from "@playwright/test";
const fixture = "http://127.0.0.1:3031";
const lesson = "/dashboard/learn/dasar-iot/blink";
async function draftSnapshot(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => { const request = indexedDB.open("vircuit-projects", 1); request.onsuccess = () => resolve(request.result); });
    return new Promise<string>((resolve) => { const request = db.transaction("drafts").objectStore("drafts").get("user:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"); request.onsuccess = () => { db.close(); resolve(JSON.stringify(request.result?.project ?? null)); }; });
  });
}
async function login(page: Page) {
  await page.goto("/masuk");
  await page.getByLabel("Email", { exact: true }).fill("dashboard@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
test.beforeEach(async ({ page, request }) => {
  await request.post(`${fixture}/__fixture/reset`, { data: { count: 0 } });
  await page.route("https://*.supabase.co/auth/v1/**", async (route) => { const url = new URL(route.request().url()); await route.fulfill({ response: await route.fetch({ url: `${fixture}${url.pathname}${url.search}` }) }); });
});
test("guest Cirra is guarded while simulator remains public", async ({ page, request }) => {
  const response = await request.post("/api/ai/cirra", { headers: { origin: "http://localhost:3002" }, data: { requestId: crypto.randomUUID(), mode: "tutor", message: "Resistor?" } });
  expect(response.status()).toBe(401);
  await page.goto("/simulator"); await page.getByRole("button", { name: "Buka panel Cirra" }).click();
  await expect(page.getByRole("heading", { name: "Masuk untuk bertanya ke Cirra" })).toBeVisible();
  await expect(page.locator(".react-flow")).toBeVisible();
});
test("lesson Tutor, cancel, retry and session history preserve focus and learning", async ({ page }) => {
  await login(page); await page.goto(lesson); await page.getByRole("button", { name: "Tanya Cirra", exact: true }).click();
  const chat = page.getByRole("region", { name: "Percakapan Cirra" });
  await chat.getByLabel("Pertanyaan untuk Cirra").fill("Kenapa LED membutuhkan resistor?"); await chat.getByRole("button", { name: "Kirim", exact: true }).click();
  await expect(chat.getByRole("log")).toContainText("resistor membatasi arus");
  await chat.getByLabel("Pertanyaan untuk Cirra").fill("fixture-slow"); await chat.getByRole("button", { name: "Kirim", exact: true }).click();
  await chat.getByRole("button", { name: "Batalkan" }).click();
  await expect(chat.getByRole("alert")).toContainText("dibatalkan");
  await page.keyboard.press("Escape"); await expect(page.getByRole("button", { name: "Tanya Cirra", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Tanya Cirra", exact: true }).click(); await expect(chat.getByRole("log")).toContainText("resistor membatasi arus");
  await page.route("**/api/ai/cirra", (route) => route.fulfill({ status: 503, json: { error: "Layanan belum tersedia" } }));
  await chat.getByLabel("Pertanyaan untuk Cirra").fill("Coba lagi"); await chat.getByRole("button", { name: "Kirim", exact: true }).click(); await expect(chat.getByRole("alert")).toContainText("belum tersedia");
  await page.unroute("**/api/ai/cirra"); await page.waitForTimeout(2200);
  await chat.getByRole("button", { name: "Coba lagi", exact: true }).click(); await expect(chat.getByRole("alert")).toHaveCount(0);
  await expect(chat.getByRole("log")).toContainText("resistor membatasi arus");
});
test("challenge Debugger and Assistant do not mutate circuit/code or complete challenge", async ({ page }) => {
  await login(page); await page.goto(lesson); await page.getByRole("button", { name: "Mulai Tantangan", exact: true }).click();
  await page.getByRole("button", { name: "Buka praktik baru", exact: true }).click(); await expect(page.locator(".react-flow__node")).toHaveCount(3);
  await expect.poll(() => draftSnapshot(page)).toContain("board"); const original = await draftSnapshot(page);
  await page.getByRole("button", { name: "Tantangan & evaluasi" }).click();
  await page.getByRole("button", { name: "Tanya Cirra tentang tantangan" }).click();
  const chat = page.getByRole("region", { name: "Percakapan Cirra" });
  await expect(chat.getByLabel("Mode", { exact: true })).toHaveValue("debugger");
  await chat.getByLabel("Pertanyaan untuk Cirra").fill("Beri aku petunjuk untuk challenge ini"); await chat.getByRole("button", { name: "Kirim", exact: true }).click();
  await expect(chat.getByRole("log")).toContainText("wiring dan kode aktual");
  await expect(page.locator(".react-flow__node")).toHaveCount(3);
  await chat.getByLabel("Pertanyaan untuk Cirra").fill("Periksa kode yang sedang terbuka");
  await page.getByRole("button", { name: "Minimalkan Cirra" }).click();
  await page.getByRole("link", { name: "Code", exact: true }).click();
  await expect(page.locator(".monaco-editor")).toBeVisible();
  const source = await page.evaluate(() => (window as unknown as { __vircuitEditor: { getValue: () => string } }).__vircuitEditor.getValue());
  await page.getByRole("button", { name: "Buka Cirra", exact: true }).click();
  await expect(chat.getByLabel("Pertanyaan untuk Cirra")).toHaveValue("Periksa kode yang sedang terbuka");
  const codeRequest = page.waitForRequest((request) => request.url().endsWith("/api/ai/cirra"));
  await chat.getByRole("button", { name: "Kirim", exact: true }).click();
  expect((await codeRequest).postDataJSON().project.code.source).toBe(source);
  await expect(chat.getByRole("button", { name: "Kirim", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Minimalkan Cirra" }).click();
  await page.getByRole("link", { name: "Circuit", exact: true }).click();
  await page.getByRole("button", { name: "Buka Cirra", exact: true }).click();
  await chat.getByLabel("Mode", { exact: true }).selectOption("project-assistant");
  await chat.getByLabel("Pertanyaan untuk Cirra").fill("Aku mau membuat smart plant monitoring"); await chat.getByRole("button", { name: "Kirim", exact: true }).click();
  await expect(chat.getByRole("log")).toContainText("komponen yang didukung");
  await expect(chat.getByRole("region", { name: "Rencana project" })).toBeVisible();
  expect(await draftSnapshot(page)).toBe(original);
  expect((await chat.getByRole("log").boundingBox())!.height).toBeGreaterThan(80);
  await page.screenshot({ path: "test-results/cirra-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Kembali ke lesson" }).click(); await expect(page.getByText("Materi selesai", { exact: true })).toHaveCount(0);
});
test("new project planning and Problems handoff use the existing canvas without edits", async ({ page }) => {
  await login(page); await page.getByRole("region", { name: "Proyek terbaru" }).getByRole("button", { name: "Proyek baru", exact: true }).click(); await expect(page).toHaveURL(/\/simulator$/);
  await page.getByRole("button", { name: "Buka Cirra", exact: true }).click();
  await page.getByLabel("Mode", { exact: true }).selectOption("project-assistant");
  const chat = page.getByRole("region", { name: "Percakapan Cirra" });
  await expect(chat.getByLabel("Mode", { exact: true })).toHaveValue("project-assistant");
  await chat.getByLabel("Pertanyaan untuk Cirra").fill("Bantu aku merencanakan lampu sederhana"); await chat.getByRole("button", { name: "Kirim", exact: true }).click();
  await expect(chat.getByRole("region", { name: "Rencana project" })).toBeVisible(); await expect(page.locator(".react-flow__node")).toHaveCount(0);
  await page.getByRole("tab", { name: "Problems", exact: true }).click(); await page.getByRole("button", { name: "Periksa rangkaian" }).click();
  await page.getByRole("button", { name: "Tanya Cirra", exact: true }).click();
  await expect(chat.getByLabel("Mode", { exact: true })).toHaveValue("debugger");
  const sent = page.waitForRequest((request) => request.url().endsWith("/api/ai/cirra"));
  await chat.getByLabel("Pertanyaan untuk Cirra").fill("Jelaskan diagnostic ini"); await chat.getByRole("button", { name: "Kirim", exact: true }).click();
  expect((await sent).postDataJSON().selectedProblemId).toBe("board-count");
  await expect(chat.getByRole("log")).toContainText("wiring dan kode aktual");
});
test("mobile Cirra fits 360px, supports themes and leaves draft intact", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 }); await login(page); await page.goto(lesson);
  for (const theme of ["Terang", "Gelap", "Sistem"]) {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.getByRole("button", { name: /^Pilih tema:/ }).click(); await page.getByRole("menuitemradio", { name: theme }).click();
    await page.getByRole("button", { name: "Tanya Cirra", exact: true }).click();
    const chat = page.getByRole("region", { name: "Percakapan Cirra" }); await expect(chat.getByLabel("Pertanyaan untuk Cirra")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.keyboard.press("Escape");
  }
  await page.goto("/simulator"); await page.getByRole("button", { name: "Buka panel Cirra" }).click();
  await expect(page.getByRole("button", { name: "Minimalkan Cirra" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  expect(await page.getByRole("dialog", { name: "Asisten Cirra" }).evaluate((el) => el.contains(document.activeElement))).toBe(true);
  const chat = page.getByRole("region", { name: "Percakapan Cirra" }); await chat.getByLabel("Pertanyaan untuk Cirra").fill("Apa fungsi resistor?"); await chat.getByRole("button", { name: "Kirim", exact: true }).click();
  await expect(chat.getByRole("log")).toContainText("resistor membatasi arus"); await page.keyboard.press("Escape"); await expect(page.locator(".react-flow")).toBeVisible();
  await page.getByRole("button", { name: "Buka panel Cirra" }).click();
  await expect.poll(async () => (await page.getByRole("dialog").boundingBox())?.y).toBeLessThan(1);
  await page.screenshot({ path: "test-results/cirra-mobile.png", fullPage: true });
});
