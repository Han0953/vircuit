import { test, expect } from "@playwright/test";

test("hero stays 2D with one active board and pin-specific wiring", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator('[data-scene="hero"]')).toHaveAttribute("data-motion", "hero");
  await page.evaluate(() => scrollTo(0, 24));
  await page.waitForTimeout(1800);
  await expect(page.locator("canvas")).toHaveCount(0);
  for (const type of ["uno", "nano", "esp32"]) {
    await expect(page.locator("[data-hero-2d]")).toHaveAttribute("data-hero-active", type, { timeout: 6500 });
    await expect(page.locator("[data-hero-2d]")).toHaveAttribute("data-hero-phase", "holding");
    await expect(page.locator('[data-hero-scene]:visible')).toHaveCount(1);
    await expect(page.locator(`[data-hero-scene="${type}"] [data-from-pin]`)).toHaveAttribute("data-from-pin", type === "esp32" ? "GPIO23" : "D3");
    await expect(page.locator(`[data-hero-scene="${type}"] [data-to-pin]`)).toHaveAttribute("data-to-pin", "GND");
  }
  await expect(page.locator('[data-home-zone="hero"] [data-cinematic-slot]')).toHaveCount(0);
  expect(await page.locator('[data-hero-board="uno"] > svg').getAttribute("viewBox")).not.toBe(await page.locator('[data-hero-board="nano"] > svg').getAttribute("viewBox"));
});

test("icon-only theme picker supports hover, click, keyboard and reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: /^Pilih tema:/ });
  await expect(toggle).toHaveText("");
  await toggle.hover();
  await expect(page.getByRole("menuitemradio", { name: "Gelap" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await page.mouse.move(0, 120);
  await toggle.hover();
  await expect(page.getByRole("menuitemradio", { name: "Gelap" })).toBeVisible();
  await toggle.click();
  await expect(page.getByRole("menuitemradio", { name: "Gelap" })).toBeVisible();
  await page.getByRole("menuitemradio", { name: "Gelap" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByRole("menu")).not.toBeVisible();
  await toggle.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("menuitemradio", { name: "Terang" }).click();
  await expect(page.locator("html")).toHaveClass(/light/);
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  await toggle.click();
  await page.getByRole("menuitemradio", { name: "Sistem" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  expect(await page.evaluate(() => localStorage.getItem("vircuit-theme"))).toBe("system");
});

test("theme colors work without page snapshots or body fades and respect reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    Object.defineProperty(document, "startViewTransition", { value: undefined, configurable: true });
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (keyframes, options) {
      if (this === document.body) document.body.dataset.themeFades = String(Number(document.body.dataset.themeFades ?? 0) + 1);
      return animate.call(this, keyframes, options);
    };
  });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: /^Pilih tema:/ });
  await toggle.click();
  await page.getByRole("menuitemradio", { name: "Gelap" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.locator("body")).not.toHaveAttribute("data-theme-fades");
  await expect(page.locator('[data-home-zone="hero"]')).toHaveAttribute("data-theme-visible", "true");
  // The global palette owner shares one clock, including inverse sections.
  for (const zone of ["hero", "closing"]) {
    await expect(page.locator(`[data-home-zone="${zone}"]`)).toHaveCSS("transition-duration", "0.3s");
    await expect(page.locator(`[data-home-zone="${zone}"]`)).toHaveCSS("transition-delay", "0s");
  }
  await expect(page.locator("body")).toHaveCSS("opacity", "1");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await toggle.click();
  await page.getByRole("menuitemradio", { name: "Terang" }).click();
  await expect(page.locator("html")).toHaveClass(/light/);
  await expect(page.locator("body")).not.toHaveAttribute("data-theme-fades");
  const reducedDuration = await page.locator('[data-home-zone="hero"]').evaluate((element) => parseFloat(getComputedStyle(element).transitionDuration));
  expect(reducedDuration).toBeLessThanOrEqual(.001);
});

for (const width of [360, 430, 768]) test(`mobile navigation fills the viewport and restores focus at ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 800 });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Buka menu navigasi" });
  await trigger.click();
  const menu = page.getByRole("dialog");
  await expect(menu).toBeVisible();
  await expect(menu).toHaveCSS("width", `${width}px`);
  await expect(menu).toHaveCSS("height", "800px");
  await expect(menu).toHaveCSS("opacity", "1");
  await expect(menu).toHaveCSS("transform", "none");
  await expect(menu.getByRole("navigation", { name: "Navigasi mobile" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: `test-results/home-menu-${width}.png` });
  await menu.getByRole("button", { name: "Tutup", exact: true }).click();
  await expect(menu).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(page.locator("html")).toHaveAttribute("data-home-scroll", "native");
});
