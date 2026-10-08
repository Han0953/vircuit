import { test, expect, type Page } from "@playwright/test";
const fixture = "http://127.0.0.1:3031";
const lesson = "/dashboard/learn/dasar-iot/blink";
async function login(page: Page) {
  await page.goto("/masuk");
  await page.getByLabel("Email", { exact: true }).fill("dashboard@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
async function mockReplies(page: Page, answer = "Aku bantu kamu memahami rangkaian ini.") {
  await page.route("**/api/ai/cirra", async (route) => {
    const input = route.request().postDataJSON();
    await route.fulfill({ json: { requestId: input.requestId, result: { mode: input.mode, answer, observations: [], suggestions: [], hints: [], references: [] }, modelCategory: "FAST", context: { sources: [], truncated: [], challengeActive: false, hintLevel: 1 } } });
  });
}
async function trackEntrances(page: Page) {
  await page.addInitScript(() => {
    const state = window as unknown as { __cirraEntrances: string[] };
    state.__cirraEntrances = [];
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (...args: Parameters<Element["animate"]>) {
      if (this instanceof HTMLElement && this.dataset.messageId) state.__cirraEntrances.push(this.dataset.messageId);
      return animate.apply(this, args);
    };
  });
}
const entrances = (page: Page) => page.evaluate(() => (window as unknown as { __cirraEntrances: string[] }).__cirraEntrances);
test.beforeEach(async ({ page, request }) => {
  await request.post(`${fixture}/__fixture/reset`, { data: { count: 0 } });
  await page.route("https://*.supabase.co/auth/v1/**", async (route) => { const url = new URL(route.request().url()); await route.fulfill({ response: await route.fetch({ url: `${fixture}${url.pathname}${url.search}` }) }); });
});

test("desktop Enter, Shift+Enter, IME and unified mode history retain a lesson draft", async ({ page }) => {
  await trackEntrances(page); await login(page); await mockReplies(page); await page.goto(lesson);
  await page.getByRole("button", { name: "Tanya Cirra", exact: true }).click();
  const chat = page.getByRole("region", { name: "Percakapan Cirra" }), input = chat.getByLabel("Pertanyaan untuk Cirra");
  await expect(input).toBeFocused();
  await input.fill("Baris pertama"); await input.press("Shift+Enter"); await input.pressSequentially("Baris kedua");
  await expect(input).toHaveValue("Baris pertama\nBaris kedua");
  await input.dispatchEvent("compositionstart"); await input.press("Enter");
  await expect(chat.locator('[data-message-role="user"]')).toHaveCount(0);
  await input.dispatchEvent("compositionend"); await input.fill("Pertanyaan Tutor"); await input.press("Enter");
  await expect(chat.locator('[data-message-role="assistant"]')).toHaveCount(1);
  await chat.getByLabel("Mode", { exact: true }).selectOption("debugger");
  const request = page.waitForRequest("**/api/ai/cirra");
  await input.fill("Pertanyaan Debugger"); await input.press("Enter");
  expect((await request).postDataJSON().mode).toBe("debugger");
  await expect(chat.locator('[data-message-role="assistant"]')).toHaveCount(2);
  await expect(chat.locator('[data-message-role="user"][data-message-mode="tutor"]')).toHaveCount(1);
  await expect(chat.locator('[data-message-role="user"][data-message-mode="debugger"]')).toHaveCount(1);
  await expect.poll(async () => (await entrances(page)).length).toBe(4);
  await input.fill("Draft belum dikirim"); await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Tanya Cirra", exact: true }).click();
  await expect(input).toHaveValue("Draft belum dikirim"); await expect(chat.getByLabel("Mode", { exact: true })).toHaveValue("debugger");
  await expect(chat.locator('[data-message-role="assistant"]')).toHaveCount(2);
  expect((await entrances(page)).length).toBe(4);
  expect(await chat.locator("article").evaluateAll((elements) => elements.flatMap((el) => el.getAnimations()).length)).toBe(0);
});

test("smart scroll keeps reading position on reply, mode changes and reopen", async ({ page }) => {
  await login(page); await mockReplies(page, ("Aku jelaskan langkahnya supaya kamu bisa memeriksa rangkaian.\n\n").repeat(35));
  await page.goto(lesson); await page.getByRole("button", { name: "Tanya Cirra", exact: true }).click();
  const chat = page.getByRole("region", { name: "Percakapan Cirra" }), log = chat.getByRole("log");
  for (let index = 0; index < 2; index++) {
    await chat.getByLabel("Pertanyaan untuk Cirra").fill(`Pertanyaan ${index}`); await chat.getByRole("button", { name: "Kirim", exact: true }).click();
    await expect(chat.locator('[data-message-role="assistant"]')).toHaveCount(index + 1);
  }
  let release!: () => void;
  const waiting = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/ai/cirra", async (route) => {
    const input = route.request().postDataJSON(); await waiting;
    await route.fulfill({ json: { requestId: input.requestId, result: { mode: input.mode, answer: "Jawaban terbaru", observations: [], suggestions: [], hints: [], references: [] }, modelCategory: "FAST", context: { sources: [], truncated: [], challengeActive: false, hintLevel: 1 } } });
  });
  await chat.getByLabel("Pertanyaan untuk Cirra").fill("Pertanyaan tertunda"); await chat.getByRole("button", { name: "Kirim", exact: true }).click();
  await expect(chat.locator(".cirra-typing span")).toHaveCount(3); await expect(chat.getByLabel("Pertanyaan untuk Cirra")).toBeDisabled();
  await log.evaluate((el) => { el.scrollTop = 150; }); await expect(chat.getByRole("button", { name: "Ke pesan terbaru" })).toBeVisible();
  const top = await log.evaluate((el) => el.scrollTop); release();
  await expect(chat.getByRole("log")).toContainText("Jawaban terbaru"); await expect(chat.locator(".cirra-typing")).toHaveCount(0);
  expect(await log.evaluate((el) => el.scrollTop)).toBeCloseTo(top, 0);
  await chat.getByLabel("Mode", { exact: true }).selectOption("project-assistant"); expect(await log.evaluate((el) => el.scrollTop)).toBeCloseTo(top, 0);
  await page.keyboard.press("Escape"); await page.getByRole("button", { name: "Tanya Cirra", exact: true }).click();
  expect(await log.evaluate((el) => el.scrollTop)).toBeCloseTo(top, 0);
  await chat.getByRole("button", { name: "Ke pesan terbaru" }).click();
  await expect(chat.getByRole("button", { name: "Ke pesan terbaru" })).toHaveCount(0);
  expect(await log.evaluate((el) => el.scrollHeight - el.clientHeight - el.scrollTop)).toBeLessThan(2);
  await page.screenshot({ path: "test-results/cirra-ux-desktop.png", fullPage: true });
});

test("account-change broadcast clears lesson history and draft, including reopen", async ({ page }) => {
  await login(page); await mockReplies(page); await page.goto(lesson);
  await page.getByRole("button", { name: "Tanya Cirra", exact: true }).click();
  const chat = page.getByRole("region", { name: "Percakapan Cirra" }), input = chat.getByLabel("Pertanyaan untuk Cirra");
  await input.fill("Percakapan akun pertama"); await chat.getByRole("button", { name: "Kirim", exact: true }).click();
  await expect(chat.locator('[data-message-role="assistant"]')).toHaveCount(1);
  await input.fill("Draft pribadi");
  await page.evaluate(() => { const channel = new BroadcastChannel("vircuit-auth"); channel.postMessage("signed-out"); channel.close(); });
  await expect(chat.getByRole("alert")).toContainText("Session akun kamu berubah");
  await expect(input).toHaveValue(""); await expect(input).toBeDisabled(); await expect(chat.locator("article")).toHaveCount(0);
  await page.keyboard.press("Escape"); await page.getByRole("button", { name: "Tanya Cirra", exact: true }).click();
  await expect(input).toHaveValue(""); await expect(chat.locator("article")).toHaveCount(0);
});

test("touch Enter creates a newline; visible viewport, focus and reduced motion stay usable", async ({ browser, request }) => {
  const context = await browser.newContext({ baseURL: "http://localhost:3002", viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: "reduce" });
  const page = await context.newPage();
  await trackEntrances(page);
  await request.post(`${fixture}/__fixture/reset`, { data: { count: 0 } });
  await page.route("https://*.supabase.co/auth/v1/**", async (route) => { const url = new URL(route.request().url()); await route.fulfill({ response: await route.fetch({ url: `${fixture}${url.pathname}${url.search}` }) }); });
  await login(page); await mockReplies(page); await page.goto("/simulator");
  await page.getByRole("button", { name: "Buka panel Cirra" }).tap();
  await expect(page.getByRole("button", { name: "Minimalkan Cirra" })).toBeFocused();
  const chat = page.getByRole("region", { name: "Percakapan Cirra" }), input = chat.getByLabel("Pertanyaan untuk Cirra");
  await input.tap(); await input.fill("Baris mobile"); await input.press("Enter"); await expect(input).toHaveValue("Baris mobile\n");
  await expect(chat.locator('[data-message-role="user"]')).toHaveCount(0);
  await page.evaluate(() => {
    const viewport = window.visualViewport!;
    Object.defineProperty(viewport, "height", { configurable: true, value: 340 });
    Object.defineProperty(viewport, "offsetTop", { configurable: true, value: 24 });
    viewport.dispatchEvent(new Event("resize")); viewport.dispatchEvent(new Event("scroll"));
  });
  await expect.poll(async () => (await page.getByRole("dialog", { name: "Asisten Cirra" }).boundingBox())?.height).toBe(340);
  const send = await chat.getByRole("button", { name: "Kirim", exact: true }).boundingBox();
  expect(send!.y + send!.height).toBeLessThanOrEqual(364);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await chat.getByRole("button", { name: "Kirim", exact: true }).tap(); await expect(chat.locator('[data-message-role="assistant"]')).toHaveCount(1);
  expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
  expect(await entrances(page)).toEqual([]);
  await chat.getByRole("button", { name: "Opsi percakapan" }).tap(); await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("ArrowDown"); await expect(page.getByRole("menuitem", { name: "Bersihkan" })).toBeFocused();
  await page.keyboard.press("Escape"); await expect(chat.getByRole("button", { name: "Opsi percakapan" })).toBeFocused();
  await input.fill("Tetap tersimpan"); await page.screenshot({ path: "test-results/cirra-ux-mobile-viewport.png", fullPage: true });
  await page.getByRole("button", { name: "Minimalkan Cirra" }).tap(); await expect(page.getByRole("button", { name: "Buka panel Cirra" })).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
  await page.getByRole("button", { name: "Buka panel Cirra" }).tap(); await expect(input).toHaveValue("Tetap tersimpan");
  await context.close();
});
