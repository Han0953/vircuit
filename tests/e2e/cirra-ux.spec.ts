import { selectCirraMode } from "./helpers/cirra-controls";
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

for (const width of [1440, 360, 430]) {
  test(`click and touch focus has no blue glow while keyboard focus stays visible at ${width}px`, async ({ browser, request }) => {
    await request.post(`${fixture}/__fixture/reset`, { data: { count: 0 } });
    const context = await browser.newContext({ baseURL: "http://localhost:3002", viewport: { width, height: 900 }, hasTouch: width < 1024 });
    const page = await context.newPage();
    await page.route("https://*.supabase.co/auth/v1/**", async (route) => { const url = new URL(route.request().url()); await route.fulfill({ response: await route.fetch({ url: `${fixture}${url.pathname}${url.search}` }) }); });
    await login(page);
    await page.goto("/simulator");
    const open = page.getByRole("button", { name: "Buka Cirra", exact: true });
    if (width < 1024) await open.tap(); else await open.click();
    const chat = page.getByRole("dialog", { name: "Asisten Cirra" });
    const input = chat.getByLabel("Pertanyaan untuk Cirra");
    if (width < 1024) await input.tap(); else await input.click();
    await expect(input).toBeFocused();
    await expect(chat.locator("[data-cirra-composer-surface]")).toHaveCSS("box-shadow", "none");
    await input.fill("Pertanyaan tetap bisa diketik");
    await page.screenshot({ path: `playwright-report/cirra-focus-${width}.png` });
    await chat.getByRole("button", { name: "Minimalkan Cirra" }).click();
    if (width < 1024) await page.getByRole("button", { name: "Tindakan workspace" }).click();
    await page.getByRole("button", { name: "Buka menu proyek" }).click();
    const close = page.locator('[data-slot="dialog-close"]').filter({ hasText: "Tutup" });
    await close.hover(); await page.mouse.down();
    await expect(close).toHaveCSS("outline-style", "none");
    await expect(close).toHaveCSS("box-shadow", "none");
    await page.mouse.up();
    await page.getByRole("button", { name: "Buka menu proyek" }).click();
    await close.focus(); await page.keyboard.press("Tab"); await page.keyboard.press("Shift+Tab");
    await expect(close).toBeFocused();
    await expect(close).toHaveCSS("outline-width", "2px");
    await page.keyboard.press("Escape");
    await context.close();
  });
}

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
  await selectCirraMode(page, "Debugger");
  await expect(page.getByRole("menu")).toHaveCount(0);
  const request = page.waitForRequest("**/api/ai/cirra");
  await input.fill("Pertanyaan Debugger"); await input.press("Enter");
  expect((await request).postDataJSON().mode).toBe("debugger");
  await expect(chat.locator('[data-message-role="assistant"]')).toHaveCount(2);
  await expect(chat.locator('[data-message-role="user"][data-message-mode="tutor"]')).toHaveCount(1);
  await expect(chat.locator('[data-message-role="user"][data-message-mode="debugger"]')).toHaveCount(1);
  await expect.poll(async () => (await entrances(page)).length).toBe(4);
  await input.fill("Draft belum dikirim"); await input.focus(); await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Tanya Cirra", exact: true }).click();
  await expect(input).toHaveValue("Draft belum dikirim"); await expect(chat.getByRole("button", { name: "Pengaturan Cirra", exact: true })).toHaveAttribute("data-value", "debugger");
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
    await expect(chat.locator("[data-revealing]")).toHaveCount(0);
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
  await selectCirraMode(page, "Project Assistant"); expect(await log.evaluate((el) => el.scrollTop)).toBeCloseTo(top, 0);
  await expect(page.getByRole("menu")).toHaveCount(0); await chat.getByLabel("Pertanyaan untuk Cirra").focus();
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

test("chat surfaces fit short messages, typing follows the user, and replies reveal without replay", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await login(page); await page.goto(lesson);
  let release!: () => void;
  const waiting = new Promise<void>((resolve) => { release = resolve; });
  const answer = "Periksa sambungan anoda LED ke resistor dan pin output board. Hubungkan katoda ke GND agar rangkaian tertutup. Gunakan digitalWrite untuk mengatur output, lalu jalankan simulasi dan amati perubahan LED.";
  await page.route("**/api/ai/cirra", async (route) => {
    const input = route.request().postDataJSON(); await waiting;
    await route.fulfill({ json: { requestId: input.requestId, result: { mode: input.mode, answer, observations: ["Periksa koneksi sebelum menjalankan program."], suggestions: [], hints: [], references: [] }, modelCategory: "FAST", context: { sources: [], truncated: [], challengeActive: false, hintLevel: 1 } } });
  });
  await page.getByRole("button", { name: "Tanya Cirra", exact: true }).click();
  const chat = page.getByRole("region", { name: "Percakapan Cirra" });
  await expect(chat.locator("[data-cirra-greeting] img")).toBeVisible();
  await expect(chat.locator("[data-cirra-greeting] [data-chat-bubble]")).toContainText("Aku Cirra");
  await chat.getByLabel("Pertanyaan untuk Cirra").fill("Halo");
  await chat.getByRole("button", { name: "Kirim", exact: true }).click();
  await expect(chat.getByText("Cirra sedang berpikir…", { exact: true })).toBeVisible();
  await expect(chat.locator(".cirra-typing span")).toHaveCount(3);
  await expect(chat.locator("[data-cirra-greeting]")).toHaveCount(0);
  const user = chat.locator('[data-message-role="user"]');
  const userBounds = (await user.boundingBox())!, logBounds = (await chat.getByRole("log").boundingBox())!;
  expect(userBounds.width).toBeLessThan(logBounds.width / 2);
  const typingBounds = (await chat.locator("[data-cirra-pending]").boundingBox())!;
  expect(typingBounds.y).toBeGreaterThanOrEqual(userBounds.y + userBounds.height);
  expect(typingBounds.y - userBounds.y - userBounds.height).toBeLessThan(30);
  expect(await chat.getByRole("log").locator(".cirra-typing").count()).toBe(1);
  await page.screenshot({ path: "playwright-report/cirra-typing-in-thread.png" });
  release();
  const response = chat.locator('[data-message-role="assistant"]');
  await expect(response.locator('[data-revealing="true"]')).toHaveCount(1);
  expect(await response.locator("p > span").evaluateAll((parts) => parts.some((part) => Number(getComputedStyle(part).opacity) < 1))).toBe(true);
  expect(await response.locator("[data-reply-details]").evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(0);
  await expect(response.locator("[data-chat-bubble]")).toContainText(answer);
  await expect(chat.locator(".cirra-typing")).toHaveCount(0);
  await expect.poll(() => response.locator("img").evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  await expect(response.locator("[data-revealing]")).toHaveCount(0);
  await expect(response).toContainText(answer);
  await expect(response.getByText("Periksa koneksi sebelum menjalankan program.")).toBeVisible();
  expect(await response.locator("p > span").evaluateAll((parts) => parts.every((part) => Number(getComputedStyle(part).opacity) === 1))).toBe(true);
  await page.screenshot({ path: "playwright-report/cirra-response-desktop.png" });
  await page.keyboard.press("Escape"); await page.getByRole("button", { name: "Tanya Cirra", exact: true }).click();
  await expect(response.locator("[data-revealing]")).toHaveCount(0);
  expect(await response.evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(0);
});

test("touch Enter creates a newline; visible viewport, focus and reduced motion stay usable", async ({ browser, request }) => {
  const context = await browser.newContext({ baseURL: "http://localhost:3002", viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: "reduce" });
  const page = await context.newPage();
  await trackEntrances(page);
  await request.post(`${fixture}/__fixture/reset`, { data: { count: 0 } });
  await page.route("https://*.supabase.co/auth/v1/**", async (route) => { const url = new URL(route.request().url()); await route.fulfill({ response: await route.fetch({ url: `${fixture}${url.pathname}${url.search}` }) }); });
  await login(page); await mockReplies(page); await page.goto("/simulator");
  await page.getByRole("button", { name: "Buka Cirra", exact: true }).tap();
  await expect(page.getByRole("button", { name: "Minimalkan Cirra" })).toBeFocused();
  const chat = page.getByRole("region", { name: "Percakapan Cirra" }), input = chat.getByLabel("Pertanyaan untuk Cirra");
  await chat.getByRole("button", { name: "Pengaturan Cirra", exact: true }).tap();
  const settings = page.getByRole("dialog", { name: "Pengaturan Cirra", exact: true });
  expect(await settings.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  await settings.getByRole("button", { name: /^Ganti mode:/ }).tap();
  await settings.getByRole("radio", { name: "Debugger", exact: true }).tap();
  await page.keyboard.press("Escape");
  await expect(chat.getByRole("button", { name: "Pengaturan Cirra", exact: true })).toHaveAttribute("data-value", "debugger");
  await expect(page.getByRole("menu")).toHaveCount(0);
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
  await expect(chat.locator("[data-revealing]")).toHaveCount(0);
  expect(await chat.locator('[data-message-role="assistant"]').evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(0);
  await expect.poll(() => chat.locator('[data-message-role="assistant"] img').evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  await chat.getByRole("button", { name: "Pengaturan Cirra", exact: true }).tap(); await expect(settings).toBeVisible();
  await settings.getByRole("button", { name: "Hapus percakapan" }).focus(); await expect(settings.getByRole("button", { name: "Hapus percakapan" })).toBeFocused();
  await page.keyboard.press("Escape"); await expect(chat.getByRole("button", { name: "Pengaturan Cirra", exact: true })).toBeFocused();
  await input.fill("Tetap tersimpan"); await page.screenshot({ path: "test-results/cirra-ux-mobile-viewport.png", fullPage: true });
  await page.getByRole("button", { name: "Minimalkan Cirra" }).tap(); await expect(page.getByRole("button", { name: "Buka Cirra", exact: true })).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
  await page.getByRole("button", { name: "Buka Cirra", exact: true }).tap(); await expect(input).toHaveValue("Tetap tersimpan");
  await context.close();
});

for (const { width, theme } of [{ width: 360, theme: "light" }, { width: 390, theme: "dark" }, { width: 430, theme: "system" }] as const) {
  test(`mobile ${width}px ${theme}: greeting, compact bubbles and motion preference`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: "no-preference", colorScheme: "dark" });
    await page.addInitScript((value) => localStorage.setItem("vircuit-theme", value), theme);
    await login(page); await mockReplies(page, "Halo, aku Cirra."); await page.goto("/simulator");
    await expect(page.locator("html")).toHaveClass(theme === "light" ? /light/ : /dark/);
    await page.getByRole("button", { name: "Buka Cirra", exact: true }).click();
    const chat = page.getByRole("region", { name: "Percakapan Cirra" });
    await expect(chat.locator("[data-cirra-greeting] [data-chat-bubble]")).toContainText("Aku Cirra");
    await expect.poll(() => chat.locator("[data-cirra-greeting] img").evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    await page.screenshot({ path: `playwright-report/cirra-greeting-${theme}-${width}.png` });
    await chat.getByLabel("Pertanyaan untuk Cirra").fill("Halo"); await chat.getByRole("button", { name: "Kirim", exact: true }).click();
    const reply = chat.locator('[data-message-role="assistant"]');
    await expect(reply.locator("[data-revealing]")).toHaveCount(1);
    if (theme === "light") await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(reply.locator("[data-revealing]")).toHaveCount(0);
    for (const role of ["user", "assistant"]) {
      const bounds = (await chat.locator(`[data-message-role="${role}"] [data-chat-bubble]`).boundingBox())!;
      expect(bounds.width).toBeLessThan(width * 0.75);
      expect(bounds.x).toBeGreaterThanOrEqual(0); expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    }
    expect(await reply.evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (theme === "system") {
      await page.emulateMedia({ colorScheme: "light" });
      await expect(page.locator("html")).toHaveClass(/light/);
      await expect(reply.locator("[data-chat-bubble]")).toBeVisible();
    }
    await page.screenshot({ path: `playwright-report/cirra-bubbles-${theme}-${width}.png` });
  });
}
