import { expect, test, type Locator, type Page } from "@playwright/test";

const routes = ["/", "/fitur", "/belajar", "/jelajahi", "/harga"];

// Locator.click can scroll a sticky control into view before dispatching input.
// Use real screen coordinates to measure user-driven scrolling accurately.
async function press(page: Page, locator: Locator, touch: boolean) {
  await expect(locator).toBeVisible();
  const box = (await locator.boundingBox())!;
  if (touch) await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  else await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

for (const width of [360, 430, 1440]) test.describe(`viewport ${width}`, () => {
test.use({ hasTouch: width < 1024 });
test(`theme changes preserve scroll and compact header at ${width}`, async ({ page }, testInfo) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(() => {
    localStorage.setItem("vircuit-theme", "light");
    const original = document.startViewTransition?.bind(document);
    if (original) document.startViewTransition = (...args) => {
      document.documentElement.dataset.themeSnapshots = String(Number(document.documentElement.dataset.themeSnapshots ?? 0) + 1);
      return original(...args);
    };
  });
  for (const route of routes) {
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);
    await page.mouse.wheel(0, 1800);
    await page.waitForTimeout(1200); // Let lazy scene initialization and scroll settling finish.
    const before = await page.evaluate(() => scrollY);
    expect(before).toBeGreaterThan(100);
    for (const name of ["Gelap", "Terang"] as const) {
      const trigger = page.getByRole("button", { name: /^Pilih tema:/ });
      await press(page, trigger, width < 1024);
      const afterOpen = await page.evaluate(() => scrollY);
      const samples = page.evaluate(() => new Promise<{ min: number; max: number; frameP95: number; maxFrame: number }>((resolve) => {
        const positions: number[] = []; const frames: number[] = []; const start = performance.now(); let previous = start;
        const sample = (now: number) => {
          positions.push(scrollY); frames.push(now - previous); previous = now;
          if (now - start < 1000) requestAnimationFrame(sample);
          else { frames.sort((a, b) => a - b); resolve({ min: Math.min(...positions), max: Math.max(...positions), frameP95: frames[Math.floor(frames.length * .95)], maxFrame: Math.max(...frames) }); }
        };
        requestAnimationFrame(sample);
      }));
      await press(page, page.getByRole("menuitemradio", { name, exact: true }), width < 1024);
      await expect(trigger).toBeFocused();
      const result = await samples;
      await testInfo.attach(`${route}-${name}-${width}`, { body: JSON.stringify({ before, afterOpen, ...result }), contentType: "application/json" });
      expect(Math.abs(afterOpen - before)).toBeLessThanOrEqual(2);
      expect(Math.abs(result.min - before)).toBeLessThanOrEqual(2);
      expect(Math.abs(result.max - before)).toBeLessThanOrEqual(2);
      expect(await page.evaluate(() => Number(document.documentElement.dataset.themeSnapshots ?? 0))).toBe(0);
      await expect(page.locator("html")).toHaveClass(name === "Gelap" ? /dark/ : /light/);
    }
    const header = page.locator("[data-home-header]");
    expect((await header.boundingBox())!.height).toBeLessThanOrEqual(65);
    const filter = await header.evaluate((element) => getComputedStyle(element).backdropFilter);
    expect(filter).toBe("blur(12px)");
    await expect(header).toHaveCSS("border-bottom-width", "0px");
    await expect(header).toHaveCSS("box-shadow", "none");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: `test-results/theme-header-${route.slice(1) || "home"}-${width}.png` });
  }
});
});
