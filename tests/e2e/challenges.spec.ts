import { test, expect, type Page } from "@playwright/test";
const provider = "http://127.0.0.1:3031";
const lesson = "/dashboard/learn/dasar-iot/blink";
const owner = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
async function login(page: Page) {
  await page.goto("/masuk");
  await page.getByLabel("Email", { exact: true }).fill("dashboard@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
async function challenge(page: Page) {
  await page.goto(lesson);
  await page.getByRole("button", { name: "Mulai Tantangan", exact: true }).click();
  await page.getByRole("button", { name: "Buka praktik baru", exact: true }).click();
  await expect(page).toHaveURL(/\/simulator$/);
  await expect(page.locator(".react-flow__node")).toHaveCount(3);
}
async function code(page: Page, source: string) {
  const desktopTab = page.getByRole("tab", { name: "Code", exact: true });
  if ((page.viewportSize()?.width ?? 1280) >= 1024) { await expect(desktopTab).toBeVisible(); await desktopTab.click(); }
  else await page.getByRole("button", { name: "Buka Code", exact: true }).click();
  await expect(page.locator(".monaco-editor")).toBeVisible();
  await page.evaluate((text) => {
    const editor = (window as unknown as { __vircuitEditor?: { setValue: (value: string) => void } }).__vircuitEditor;
    if (!editor) throw new Error("Editor belum siap"); editor.setValue(text);
  }, source);
  const mobile = page.getByRole("dialog").filter({ has: page.getByRole("heading", { name: "Code", exact: true }) });
  if (await mobile.isVisible()) await page.keyboard.press("Escape");
}
const blink = "void setup(){pinMode(3,OUTPUT);}void loop(){digitalWrite(3,HIGH);delay(500);digitalWrite(3,LOW);delay(500);}";
test.beforeEach(async ({ page, request }) => {
  await request.post(`${provider}/__fixture/reset`, { data: { count: 0 } });
  await page.route("https://*.supabase.co/auth/v1/**", async (route) => {
    const url = new URL(route.request().url());
    await route.fulfill({ response: await route.fetch({ url: `${provider}${url.pathname}${url.search}` }) });
  });
});
test("protected challenges, server verification, completion and real dashboard progress", async ({ page, request }) => {
  for (const path of ["/dashboard/challenges", "/dashboard/progress"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(decodeURIComponent(response.headers().location!)).toContain(`next=${path}`);
  }
  expect((await request.get("/api/progress")).status()).toBe(401);
  await login(page); await challenge(page);
  await page.getByRole("button", { name: "Tantangan & evaluasi" }).click();
  await page.getByRole("button", { name: "Evaluasi", exact: true }).click();
  await expect(page.getByText("Hasil terverifikasi dan tersimpan. Coba perbaiki lagi.")).toBeVisible();
  await page.keyboard.press("Escape");
  await code(page, blink);
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByTestId("output-led")).toHaveAttribute("data-value", "1");
  await page.getByRole("button", { name: "Tantangan & evaluasi" }).click();
  await page.getByRole("button", { name: "Evaluasi", exact: true }).click();
  await expect(page.getByText("Terverifikasi — materi selesai")).toBeVisible();
  await expect(page.getByRole("heading", { level: 3, name: "Terpenuhi", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await page.getByRole("button", { name: "Kembali ke lesson" }).click();
  await expect(page.getByText("Materi selesai", { exact: true })).toBeVisible();
  await page.goto("/dashboard");
  await expect(page.getByLabel("Progress belajar")).toContainText("1 dari 7 materi selesai");
  await expect(page.getByLabel("Lanjutkan belajar")).toContainText("Tegangan dan Ground");
  await page.goto("/dashboard/progress");
  await expect(page.getByLabel("Coverage keterampilan")).toContainText("Digital output: 1/2 materi selesai");
  await page.goto("/dashboard/learn/dasar-iot/tegangan-ground");
  await page.getByRole("button", { name: "Selesaikan materi" }).click();
  await expect(page.getByText("Materi selesai", { exact: true })).toBeVisible();
  await page.goto("/dashboard");
  await expect(page.getByLabel("Progress belajar")).toContainText("2 dari 7 materi selesai");
});
test("failed sync survives refresh, retries immutable snapshot and leaves draft intact", async ({ page }) => {
  await login(page); await challenge(page); await code(page, blink);
  await page.route("**/api/challenges/submit", (route) => route.fulfill({ status: 503, json: { error: "Sinkronisasi offline" } }));
  await page.getByRole("button", { name: "Tantangan & evaluasi" }).click();
  await page.getByRole("button", { name: "Evaluasi", exact: true }).click();
  await expect(page.getByText("Hasil lokal — belum tersinkronisasi", { exact: true })).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("Sinkronisasi offline");
  await page.reload();
  await page.getByRole("button", { name: "Tantangan & evaluasi" }).click();
  await expect(page.getByRole("button", { name: "Coba sinkronkan hasil" })).toBeVisible();
  await page.unroute("**/api/challenges/submit");
  await page.getByRole("button", { name: "Coba sinkronkan hasil" }).click();
  await expect(page.getByText("Terverifikasi — materi selesai")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".react-flow__node")).toHaveCount(3);
  const draft = await page.evaluate(async (scope) => {
    const db = await new Promise<IDBDatabase>((resolve) => { const request = indexedDB.open("vircuit-projects", 1); request.onsuccess = () => resolve(request.result); });
    return new Promise<{ project: { code: { source: string } }; learningContext: { challengeId: string } }>((resolve) => { const request = db.transaction("drafts").objectStore("drafts").get(scope); request.onsuccess = () => { db.close(); resolve(request.result); }; });
  }, `user:${owner}`);
  expect(draft.project.code.source).toBe(blink); expect(draft.learningContext.challengeId).toBe("challenge.blink");
  await page.goto("/dashboard"); await expect(page.getByLabel("Progress belajar")).toContainText("1 dari 7");
});
test("challenge sheet and progress remain accessible on mobile and all themes", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await login(page); await challenge(page);
  await page.getByRole("button", { name: "Tantangan & evaluasi" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByLabel("Board", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Evaluasi", exact: true }).click();
  await expect(page.getByText("Hasil terverifikasi dan tersimpan. Coba perbaiki lagi.")).toBeVisible();
  await page.screenshot({ path: "test-results/challenges-mobile.png", fullPage: true });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Tantangan & evaluasi" })).toBeFocused();
  await page.goto("/dashboard/progress");
  for (const theme of ["Terang", "Gelap", "Sistem"]) {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.getByRole("button", { name: /^Pilih tema:/ }).click();
    await page.getByRole("menuitemradio", { name: theme }).click();
    await expect(page.locator("html")).toHaveClass(theme === "Terang" ? /light/ : /dark/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByRole("button", { name: "Buka navigasi", exact: true }).click();
  await page.getByRole("dialog").getByRole("link", { name: "Tantangan", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Tantangan" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Mulai Tantangan", exact: true })).toHaveCount(6);
  for (const width of [430, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 }); await page.goto("/dashboard/progress");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.screenshot({ path: "test-results/progress-desktop.png", fullPage: true });
});
