import { test, expect } from "@playwright/test";

for (const [width, height] of [[360, 800], [390, 844], [430, 844], [768, 1024], [1280, 720], [1440, 900]]) {
  test(`complete hero fits the initial viewport at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await expect(page.locator("[data-hero-2d]")).toHaveAttribute("data-hero-phase", "holding");
    await page.evaluate(() => document.fonts.ready);
    const hero = (await page.locator('[data-home-zone="hero"]').boundingBox())!;
    const header = (await page.locator("[data-home-header]").boundingBox())!;
    expect(await page.evaluate(() => scrollY)).toBe(0);
    // The transparent sticky header now sits over the hero background. Check
    // actual content clearance rather than requiring a gap above the section.
    expect(hero.y).toBeGreaterThanOrEqual(0);
    for (const content of await page.locator('[data-home-zone="hero"] [data-hero-copy]:visible, [data-hero-2d]').all()) {
      const box = (await content.boundingBox())!;
      expect(box.y).toBeGreaterThanOrEqual(header.y + header.height - 1);
      expect(box.y + box.height).toBeLessThanOrEqual(height + 1);
    }
    expect(hero.y + hero.height).toBeLessThanOrEqual(height + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await expect(page.locator('[data-home-zone="hero"] canvas')).toHaveCount(0);
    await page.screenshot({ path: `test-results/home-refined-hero-${width}.png` });
  });
}

for (const width of [360, 1440]) test(`Virtual Lab uses proportional component artwork at ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/");
  const preview = page.locator('[data-home-zone="workspace"] figure');
  await preview.scrollIntoViewIfNeeded();
  const uno = (await preview.locator('[data-preview-part="uno"] > svg').boundingBox())!;
  const button = (await preview.locator('[data-preview-part="button"] > svg').boundingBox())!;
  const led = (await preview.locator('[data-preview-part="led"] > svg').boundingBox())!;
  expect(uno.width).toBeGreaterThan(button.width * 1.5);
  expect(uno.height).toBeGreaterThan(led.height);
  await expect(preview.locator('[data-preview-part="uno"]')).toContainText("UNO");
  await expect(preview.locator("[data-demo-led]")).toHaveCSS("opacity", "1");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await preview.screenshot({ path: `test-results/home-refined-lab-${width}.png` });
});

for (const zone of ["story", "boards"] as const) test(`${zone}: slow 3D delivery keeps the stage without loading text or a temporary 2D board`, async ({ page }) => {
  await page.route("**/_next/static/chunks/*.js", async (route) => {
    const response = await route.fetch();
    if ((await response.body()).toString().includes("WebGLRenderer")) await new Promise((resolve) => setTimeout(resolve, 2500));
    await route.fulfill({ response });
  });
  await page.goto("/");
  await page.locator(zone === "story" ? "[data-stage]" : "[data-board-stage]").scrollIntoViewIfNeeded();
  const visual = page.locator(zone === "story" ? '[data-scene="story"] [data-renderer]' : '[data-cinematic-slot="boards"]');
  const fallback = visual.locator(zone === "story" ? "[data-svg-fallback]" : "[data-cinematic-fallback]");
  await expect(page.locator("[data-home-experience]")).toHaveAttribute("data-webgl-preferred", "true");
  await expect(fallback).toBeHidden();
  await expect(page.getByText("Menyiapkan visual 3D")).toHaveCount(0);
  await expect(visual).toHaveAttribute("data-renderer", "webgl", { timeout: 20000 });
  await expect(fallback).toBeHidden();
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.unrouteAll({ behavior: "wait" });
});
