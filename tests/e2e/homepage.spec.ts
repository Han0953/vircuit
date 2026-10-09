import { test, expect, type Page } from "@playwright/test";

async function overflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}

async function storyPosition(page: Page, progress: number) {
  await page.evaluate((p) => {
    const grid = document.querySelector<HTMLElement>("[data-story]")!;
    const stage = document.querySelector<HTMLElement>("[data-stage]")!;
    const start = grid.getBoundingClientRect().top + scrollY - (document.querySelector<HTMLElement>("[data-home-header]")?.offsetHeight ?? 0) - 16;
    scrollTo(0, start + Math.max(300, grid.offsetHeight - stage.offsetHeight) * p);
  }, progress);
}

test("homepage copy, destinations, FAQ and semantic fallback without JS", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto("/");
  const icon = await page.locator('link[rel="icon"]').getAttribute("href");
  expect(icon).toMatch(/^\/icon\.svg/);
  expect((await page.request.get(icon!)).ok()).toBe(true);
  await page.screenshot({ path: "test-results/home-no-js-hero.png" });
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Belajar IoT");
  await expect(page.getByRole("link", { name: "Mulai Belajar", exact: true }).first()).toHaveAttribute("href", "/dashboard/learn");
  await expect(page.getByRole("link", { name: "Coba Simulator", exact: true }).first()).toHaveAttribute("href", "/simulator");
  await expect(page.locator("main")).not.toContainText(/segera hadir|sedang disiapkan|Rencana akses guest/);
  await page.locator("summary").filter({ hasText: "Apakah perlu login" }).click();
  await expect(page.locator("details[open]")).toContainText("sebagai tamu");
  await expect(page.getByRole("heading", { name: "Coba, perbaiki, lalu pahami." })).toBeVisible();
  await overflow(page);
  await page.screenshot({ path: "test-results/home-no-js.png", fullPage: true });
  await context.close();
});

for (const width of [360, 390, 430, 768, 1280, 1440, 1920]) {
  test(`homepage motion, reverse scroll and scene framing at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(`${message.text()} (${message.location().url})`); });
    page.on("response", (response) => { if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`); });
    await page.goto("/");
    await expect(page.locator('[data-scene="hero"]')).toHaveAttribute("data-motion", "hero");
    await expect.poll(() => page.locator('[data-scene="hero"] [data-wire]').evaluateAll((paths) => paths.every((path) => Number(getComputedStyle(path).strokeDashoffset.replace("px", "")) === 0))).toBe(true);
    await expect(page.locator('[data-scene="story"]')).toHaveAttribute("data-motion", "story");
    await overflow(page);
    if ([390, 1440].includes(width)) await page.screenshot({ path: `test-results/home-${width}-hero.png` });
    for (const [i, progress] of [.02, .35, .62, .92].entries()) {
      await storyPosition(page, progress);
      await expect(page.locator('[data-scene="story"]')).toHaveAttribute("data-beat", String(i + 1));
      if (i !== 1) {
        const frame = page.locator(`[data-scene="story"] [data-frame="${i === 0 ? 1 : i === 2 ? 2 : 3}"]`);
        await expect.poll(() => frame.evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(1);
      }
      const box = await page.locator("[data-stage]").boundingBox();
      const headerHeight = await page.locator("[data-home-header]").evaluate((el) => (el as HTMLElement).offsetHeight);
      expect(box!.y).toBeGreaterThanOrEqual(headerHeight - 1);
      expect(box!.y).toBeLessThan(headerHeight + 40);
      expect(box!.y + box!.height).toBeGreaterThan(0);
      if ([390, 1440].includes(width)) await page.screenshot({ path: `test-results/home-${width}-story-${i + 1}.png` });
    }
    await storyPosition(page, .02);
    await expect(page.locator('[data-scene="story"]')).toHaveAttribute("data-beat", "1");
    await storyPosition(page, .62);
    await page.reload();
    await expect(page.locator('[data-scene="story"]')).toHaveAttribute("data-motion", "story");
    await storyPosition(page, .92);
    await expect(page.locator('[data-scene="story"]')).toHaveAttribute("data-beat", "4");
    for (const kind of ["simulator", "cirra", "challenge", "closing"]) {
      const scene = page.locator(`[data-scene="${kind}"]`);
      await scene.scrollIntoViewIfNeeded();
      await expect(scene).toHaveAttribute("data-motion", kind);
      await overflow(page);
      if ([390, 1440].includes(width)) await scene.screenshot({ path: `test-results/home-${width}-${kind}.png`, animations: "disabled" });
    }
    expect(errors).toEqual([]);
  });
}

test("reduced motion, theme switching and short viewport remain usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator('[data-scene="story"]')).not.toHaveAttribute("data-motion");
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Coba, perbaiki, lalu pahami." })).toBeVisible();
  await page.getByRole("button", { name: "Buka menu navigasi" }).click();
  await page.getByRole("button", { name: /Pilih tema:/ }).click();
  await page.getByRole("menuitemradio", { name: "Terang" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.keyboard.press("Escape");
  await overflow(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('[data-scene="story"]')).toHaveAttribute("data-motion", "story");
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  await page.getByRole("heading", { name: "Coba, perbaiki, lalu pahami." }).scrollIntoViewIfNeeded();
  await overflow(page);
});

test("route transitions clean pin state and simulator stays public", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator(".pin-spacer")).toHaveCount(1);
  await page.getByRole("link", { name: "Coba Simulator", exact: true }).first().click();
  await expect(page).toHaveURL(/\/simulator$/);
  await expect(page.getByRole("button", { name: "Run", exact: true })).toBeVisible();
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  await page.goBack();
  await expect(page.locator(".pin-spacer")).toHaveCount(1);
  await storyPosition(page, .62);
  await expect(page.locator('[data-scene="story"]')).toHaveAttribute("data-beat", "3");
  await overflow(page);
});

test("touch portrait and short landscape keep scroll-linked motion", async ({ browser }) => {
  const context = await browser.newContext({ isMobile: true, hasTouch: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator('[data-scene="story"]')).toHaveAttribute("data-motion", "story");
  await storyPosition(page, .62);
  await expect(page.locator('[data-scene="story"]')).toHaveAttribute("data-beat", "3");
  const touchSession = await context.newCDPSession(page);
  async function swipe(from: number, to: number) {
    await touchSession.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 180, y: from, id: 1 }] });
    for (let step = 1; step <= 12; step++) {
      await touchSession.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 180, y: from + (to - from) * step / 12, id: 1 }] });
      await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
    }
    await touchSession.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  }
  const beforeSwipe = await page.evaluate(() => scrollY);
  await swipe(650, 470);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(beforeSwipe);
  const afterSwipe = await page.evaluate(() => scrollY);
  await swipe(470, 650);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(afterSwipe);
  await touchSession.detach();
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('[data-scene="story"]')).toHaveAttribute("data-motion", "story");
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  await page.getByRole("heading", { name: "Coba, perbaiki, lalu pahami." }).scrollIntoViewIfNeeded();
  await overflow(page);
  await page.setViewportSize({ width: 390, height: 720 });
  await storyPosition(page, .92);
  await expect(page.locator('[data-scene="story"]')).toHaveAttribute("data-beat", "4");
  await overflow(page);
  await context.close();
});
