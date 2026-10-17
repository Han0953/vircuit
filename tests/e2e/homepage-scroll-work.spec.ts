import { expect, test } from "@playwright/test";

test("scrolling the hero does not rewrite an unchanged offscreen board scene", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator("[data-home-zone='hero']")).toHaveAttribute("data-hero-intro", "complete");
  const slot = page.locator("[data-cinematic-slot='boards']");
  await expect(slot).toHaveAttribute("data-progress", "0.000");
  await slot.evaluate(element => {
    const view = window as typeof window & { boardWrites: number; stopBoardObserver: () => void };
    view.boardWrites = 0;
    const observer = new MutationObserver(records => { view.boardWrites += records.length; });
    observer.observe(element, { attributes: true, attributeFilter: ["data-progress", "data-active-board", "data-presence", "style"] });
    view.stopBoardObserver = () => observer.disconnect();
  });
  await page.mouse.move(100, 400);
  for (const direction of [1, -1]) for (let i = 0; i < 10; i++) {
    await page.mouse.wheel(0, 40 * direction);
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(300);
  await expect(slot).toHaveAttribute("data-progress", "0.000");
  const writes = await page.evaluate(() => {
    const view = window as typeof window & { boardWrites: number; stopBoardObserver: () => void };
    view.stopBoardObserver(); return view.boardWrites;
  });
  expect(writes).toBe(0);
});

test("returning through hero and Titik awal reuses an idle story Canvas and preserves exclusive ownership", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const world = page.locator("[data-scene='story'] [data-renderer]");
  await page.locator("[data-stage]").scrollIntoViewIfNeeded();
  await expect(world).toHaveAttribute("data-renderer", "webgl", { timeout: 20000 });
  await world.locator("canvas").evaluate(canvas => { canvas.dataset.instance = "original"; });
  await page.mouse.wheel(0, -10000);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(4);
  await expect(page.locator("[data-home-experience]")).toHaveAttribute("data-canvas-owner", "none");
  await expect(world.locator("canvas")).toHaveAttribute("data-instance", "original");
  await page.waitForTimeout(300);
  const frames = await world.getAttribute("data-render-frames");
  await page.waitForTimeout(350);
  await expect(world).toHaveAttribute("data-render-frames", frames!);
  await expect(page.locator("[data-home-zone='hero'] canvas")).toHaveCount(0);
  await page.locator("[data-stage]").scrollIntoViewIfNeeded();
  await expect(world.locator("canvas")).toHaveAttribute("data-instance", "original");
  await page.locator("[data-board-stage]").scrollIntoViewIfNeeded();
  await expect(page.locator("[data-cinematic-slot='boards']")).toHaveAttribute("data-renderer", "webgl", { timeout: 20000 });
  await expect(world.locator("canvas")).toHaveCount(0);
  await expect(page.locator("canvas")).toHaveCount(1);
});

for (const width of [390, 1440]) test(`Nano LED lights after wiring and stays lit across pause/reduced motion at ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/");
  const hero = page.locator("[data-hero-2d]");
  await expect(hero).toHaveAttribute("data-hero-active", "nano", { timeout: 10000 });
  const nano = hero.locator("[data-hero-scene='nano']");
  await expect(hero).toHaveAttribute("data-hero-phase", "holding");
  for (const wire of await nano.locator("[data-hero-wire]").all()) await expect(wire).toHaveCSS("stroke-dashoffset", "0px");
  await expect(nano.locator("[data-hero-lens]")).toHaveAttribute("fill", "var(--part-led-on)");
  await expect(nano.locator("[data-hero-lens]")).toHaveCSS("animation-name", /hero-output-pulse/);
  await hero.getByRole("button", { name: "Jeda pergantian board" }).click();
  await expect(hero).toHaveAttribute("data-hero-active", "nano");
  await expect(nano.locator("[data-hero-lens]")).toHaveAttribute("fill", "var(--part-led-on)");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(hero).toHaveAttribute("data-hero-paused", "true");
  await expect(nano.locator("[data-hero-lens]")).toHaveAttribute("fill", "var(--part-led-on)");
  await expect(nano.locator("[data-hero-lens]")).toHaveCSS("animation-name", "none");
  await expect(nano).toContainText("Visual saja");
  await expect(page.locator("[data-home-zone='hero'] canvas")).toHaveCount(0);
});
