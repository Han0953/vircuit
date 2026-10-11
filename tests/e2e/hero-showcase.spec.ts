import { test, expect } from "@playwright/test";

for (const width of [360, 390, 430, 768, 1280, 1440]) test(`hero manual navigation, wiring and reduced motion at ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/");
  const hero = page.locator("[data-hero-2d]");
  await hero.scrollIntoViewIfNeeded();
  await expect(hero).toHaveAttribute("data-hero-phase", "holding");
  await page.getByRole("button", { name: "Nano", exact: true }).click();
  await page.getByRole("button", { name: "ESP32", exact: true }).click();
  await expect(hero).toHaveAttribute("data-hero-active", "esp32");
  await expect(hero).toHaveAttribute("data-hero-phase", "holding");
  await expect(page.locator("[data-hero-scene]:visible")).toHaveCount(1);
  await expect(hero).toHaveAttribute("data-hero-paused", "true");
  await expect(page.locator('[data-hero-scene="esp32"]')).toContainText("digitalWrite(23, HIGH)");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Nano", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(hero).toHaveAttribute("data-hero-active", "nano");
  await expect(page.locator('[data-hero-scene="nano"]')).toContainText("Visual saja");
  await expect(page.getByRole("button", { name: "Putar pergantian board" })).toBeDisabled();
  await expect(page.locator('[data-hero-scene="nano"] [data-hero-lens]')).toHaveAttribute("fill", "var(--part-led-off)");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: `test-results/hero-final-${width}.png` });
  await expect(page.locator('[data-home-zone="hero"] canvas')).toHaveCount(0);
});

test("hero autoplay loops, pauses offscreen and survives resize during transition", async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.mouse.move(0, 0);
  const hero = page.locator("[data-hero-2d]");
  for (const board of ["nano", "esp32", "uno"]) {
    await expect(hero).toHaveAttribute("data-hero-active", board, { timeout: 10000 });
    await expect(hero).toHaveAttribute("data-hero-phase", "holding");
    for (const path of await page.locator(`[data-hero-scene="${board}"] [data-hero-wire]`).all()) await expect(path).toHaveCSS("opacity", "1");
    await expect(page.locator(`[data-hero-scene="${board}"] [data-hero-info]`).first()).toHaveCSS("opacity", "1");
  }
  await page.locator('[data-home-zone="projects"]').scrollIntoViewIfNeeded();
  await expect(hero).toHaveAttribute("data-hero-paused", "true");
  const active = await hero.getAttribute("data-hero-active");
  await page.waitForTimeout(7500);
  await expect(hero).toHaveAttribute("data-hero-active", active!);
  await hero.scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Nano", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(hero).toHaveAttribute("data-hero-active", "nano");
  await expect(hero).toHaveAttribute("data-hero-phase", "holding");
});

test("hero transition intermediate frames retain a single visual owner", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const hero = page.locator("[data-hero-2d]");
  await expect(hero).toHaveAttribute("data-hero-phase", "holding");
  for (const board of ["nano", "esp32", "uno"]) {
    await page.getByRole("button", { name: board === "nano" ? "Nano" : board === "uno" ? "Uno" : "ESP32", exact: true }).click();
    await page.waitForTimeout(250);
    await expect(page.locator("[data-hero-scene]:visible")).toHaveCount(1);
    await hero.screenshot({ path: `test-results/hero-${board}-exit.png` });
    await expect(hero).toHaveAttribute("data-hero-active", board);
    await page.waitForTimeout(850);
    await hero.screenshot({ path: `test-results/hero-${board}-wiring.png` });
    await expect(hero).toHaveAttribute("data-hero-phase", "holding");
    await hero.screenshot({ path: `test-results/hero-${board}-holding.png` });
  }
});
