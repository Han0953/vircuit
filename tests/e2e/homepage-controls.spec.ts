import { test, expect } from "@playwright/test";

test("desktop scroll adapter follows eligibility and tears down across routes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-home-scroll", "lenis");
  await page.mouse.wheel(0, 700);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(500);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("html")).toHaveAttribute("data-home-scroll", "native");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("html")).toHaveAttribute("data-home-scroll", "lenis");
  await page.setViewportSize({ width: 390, height: 900 });
  await expect(page.locator("html")).toHaveAttribute("data-home-scroll", "native");
  await page.getByRole("button", { name: "Buka menu navigasi" }).click();
  await page.getByRole("navigation", { name: "Navigasi mobile" }).getByRole("link", { name: "Fitur", exact: true }).click();
  await expect(page).toHaveURL(/\/fitur$/);
  await expect(page.locator("html")).not.toHaveAttribute("data-home-scroll");
  await expect(page.locator("html")).not.toHaveClass(/lenis/);
  await page.goBack();
  await expect(page.locator("html")).toHaveAttribute("data-home-scroll", "native");
});

test("hybrid touch and mobile stay native", async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-home-scroll", "native");
  await context.close();
});

for (const width of [390, 1440]) test(`homepage header keeps its height, visible focus and offset at ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/");
  const header = page.locator("[data-home-header]");
  await expect(header).toHaveAttribute("data-scrolled", "false");
  const height = await header.evaluate((el) => (el as HTMLElement).offsetHeight);
  await page.evaluate(() => scrollTo(0, 300));
  await expect(header).toHaveAttribute("data-scrolled", "true");
  expect((await header.boundingBox())!.y).toBe(0);
  expect(await header.evaluate((el) => (el as HTMLElement).offsetHeight)).toBe(height);
  await page.evaluate(() => scrollTo(0, 70));
  await expect(header).toHaveAttribute("data-scrolled", "true");
  await page.evaluate(() => scrollTo(0, 20));
  await expect(header).toHaveAttribute("data-scrolled", "false");
  if (width < 1024) {
    await page.getByRole("button", { name: "Buka menu navigasi" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-home-scroll", "native");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Buka menu navigasi" })).toBeFocused();
  }
});

for (const width of [390, 1440]) test(`Back to Top and footer anchor reach actual top without losing focus at ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/");
  const button = page.getByRole("button", { name: "Kembali ke atas halaman", includeHidden: true });
  await expect(button).not.toBeVisible();
  await page.evaluate(() => scrollTo(0, 1200));
  await expect(button).toBeVisible();
  await button.dblclick({ delay: 20 });
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(page.locator("main")).toBeFocused();
  await expect(button).not.toBeVisible();
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await page.locator("footer").getByRole("link", { name: "Kembali ke atas", exact: true }).click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(page.locator("main")).toBeFocused();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("html")).toHaveAttribute("data-home-scroll", "native");
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await page.evaluate(() => scrollTo(0, 1200));
  await expect(button).toBeVisible();
  await button.click();
  expect(await page.evaluate(() => scrollY)).toBe(0);
});
