import { test, expect } from "@playwright/test";

for (const width of [360, 390, 430, 768, 1280, 1440]) test(`compact SVG hero and stable reduced motion at ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const hero = page.locator("[data-hero-2d]");
  await hero.scrollIntoViewIfNeeded();
  await expect(hero).toHaveAttribute("data-hero-active", "uno");
  await expect(hero).toHaveAttribute("data-hero-phase", "holding");
  await expect(hero).toHaveAttribute("data-hero-paused", "true");
  await expect(hero.locator("[data-hero-scene]:visible")).toHaveCount(1);
  await expect(hero.locator("button")).toHaveCount(1);
  const control = hero.getByRole("button", { name: "Putar pergantian board" });
  await expect(control).toBeDisabled();
  const size = await control.boundingBox();
  expect(size!.width).toBeGreaterThanOrEqual(44);
  expect(size!.height).toBeGreaterThanOrEqual(44);
  await expect(hero.locator("details, h2, p, code, [aria-pressed]")).toHaveCount(0);
  await expect(hero.locator("[data-hero-scene]:visible [data-hero-lens]")).toHaveAttribute("fill", "var(--part-led-on)");
  expect(await hero.evaluate((el) => el.clientHeight / el.clientWidth)).toBeLessThan(.7);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: `test-results/hero-clean-${width}.png` });
  if (width === 390 || width === 1440) await page.locator('[data-home-zone="hero"]').screenshot({ path: `test-results/hero-clean-composition-${width}.png` });
  await expect(page.locator('[data-home-zone="hero"] canvas')).toHaveCount(0);
});

test("hero loops every five seconds with board-specific wiring and pauses offscreen", async ({ page }) => {
  test.setTimeout(45000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    const timings: number[] = [];
    (window as typeof window & { heroActivations: number[] }).heroActivations = timings;
    new MutationObserver((records) => {
      for (const record of records) if (record.target instanceof HTMLElement && record.target.matches("[data-hero-2d]")) timings.push(performance.now());
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ["data-hero-active"] });
  });
  await page.goto("/");
  await page.mouse.move(0, 0);
  const hero = page.locator("[data-hero-2d]");
  await expect(hero).toHaveAttribute("data-hero-phase", "holding");
  for (const board of ["nano", "esp32", "uno"]) {
    await expect(hero).toHaveAttribute("data-hero-active", board, { timeout: 6500 });
    await expect(hero.locator("[data-hero-scene]:visible")).toHaveCount(1);
    const scene = hero.locator(`[data-hero-scene="${board}"]`);
    await expect(scene.locator("[data-from-pin]")).toHaveAttribute("data-from-pin", board === "esp32" ? "GPIO23" : "D3");
    await expect(scene.locator("[data-to-pin]")).toHaveAttribute("data-to-pin", "GND");
    await expect(hero).toHaveAttribute("data-hero-phase", "holding");
    await expect(scene.locator("[data-hero-lens]")).toHaveAttribute("fill", "var(--part-led-on)");
    for (const path of await scene.locator("[data-hero-wire]").all()) {
      await expect(path).toHaveCSS("opacity", "1");
      await expect(path).toHaveCSS("stroke-dashoffset", "0px");
    }
    await hero.screenshot({ path: `test-results/hero-clean-${board}.png` });
  }
  const timings = await page.evaluate(() => (window as typeof window & { heroActivations: number[] }).heroActivations);
  expect(timings).toHaveLength(3);
  for (let i = 1; i < timings.length; i++) {
    expect(timings[i] - timings[i - 1]).toBeGreaterThan(4750);
    expect(timings[i] - timings[i - 1]).toBeLessThan(5250);
  }
  await page.locator('[data-home-zone="projects"]').scrollIntoViewIfNeeded();
  await expect(hero).toHaveAttribute("data-hero-paused", "true");
  const active = await hero.getAttribute("data-hero-active");
  await page.waitForTimeout(5500);
  await expect(hero).toHaveAttribute("data-hero-active", active!);
  await hero.scrollIntoViewIfNeeded();
  await expect(hero).toHaveAttribute("data-hero-paused", "false");
});

test("hero pause is keyboard accessible and reduced motion cancels autoplay", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const hero = page.locator("[data-hero-2d]");
  await expect(hero).toHaveAttribute("data-hero-phase", "holding");
  await hero.getByRole("button", { name: "Jeda pergantian board" }).focus();
  await page.keyboard.press("Enter");
  await expect(hero).toHaveAttribute("data-hero-paused", "true");
  const active = await hero.getAttribute("data-hero-active");
  await page.waitForTimeout(5500);
  await expect(hero).toHaveAttribute("data-hero-active", active!);
  await page.keyboard.press("Enter");
  await expect(hero).toHaveAttribute("data-hero-paused", "false");
  await hero.hover({ position: { x: 80, y: 80 } });
  const tilt = hero.locator("[data-hero-scene]:visible [data-hero-tilt]");
  await expect(tilt).not.toHaveCSS("transform", "none");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(hero).toHaveAttribute("data-hero-phase", "holding");
  await expect(tilt).toHaveCSS("transform", "none");
  const stable = await hero.getAttribute("data-hero-active");
  await page.waitForTimeout(5500);
  await expect(hero).toHaveAttribute("data-hero-active", stable!);
  await expect(hero.getByRole("button", { name: "Putar pergantian board" })).toBeDisabled();
});

test("hero resize during entrance preserves one owner and complete wiring", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const hero = page.locator("[data-hero-2d]");
  await expect(hero).toHaveAttribute("data-hero-active", "nano", { timeout: 7500 });
  await page.setViewportSize({ width: 390, height: 844 });
  await hero.scrollIntoViewIfNeeded();
  await expect(hero).toHaveAttribute("data-hero-phase", "holding");
  await expect(hero.locator("[data-hero-scene]:visible")).toHaveCount(1);
  for (const wire of await hero.locator("[data-hero-scene]:visible [data-hero-wire]").all()) await expect(wire).toHaveCSS("stroke-dashoffset", "0px");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await hero.screenshot({ path: "test-results/hero-clean-mobile-resize.png" });
});

test("touch hero cycles through all boards without overflow or hover controls", async ({ browser }) => {
  const context = await browser.newContext({ isMobile: true, hasTouch: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto("/");
  const hero = page.locator("[data-hero-2d]");
  await hero.scrollIntoViewIfNeeded();
  for (const board of ["nano", "esp32", "uno"]) {
    await expect(hero).toHaveAttribute("data-hero-active", board, { timeout: 6500 });
    await expect(hero).toHaveAttribute("data-hero-phase", "holding");
    await expect(hero.locator("[data-hero-scene]:visible")).toHaveCount(1);
    const art = await hero.locator("[data-hero-scene]:visible [data-hero-art]").boundingBox();
    expect(art!.x).toBeGreaterThanOrEqual(0);
    expect(art!.x + art!.width).toBeLessThanOrEqual(390);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await hero.screenshot({ path: `test-results/hero-clean-touch-${board}.png` });
  }
  await hero.getByRole("button", { name: "Jeda pergantian board" }).tap();
  await expect(hero).toHaveAttribute("data-hero-paused", "true");
  await expect(hero).not.toHaveAttribute("data-hero-hovered", "true");
  await expect.poll(() => hero.locator("[data-hero-scene]:visible [data-hero-tilt]").evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).isIdentity)).toBe(true);
  await context.close();
});

test("Uno, Nano and ESP32 follow the pointer in 3D across automatic transitions", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  // Pointer coordinates must use the final figure bounds, after its intro
  // transform finishes; the SSR playback phase initially reads "holding".
  await expect(page.locator("[data-home-zone='hero']")).toHaveAttribute("data-hero-intro", "complete");
  const hero = page.locator("[data-hero-2d]");
  const tilt = hero.locator("[data-hero-scene]:visible [data-hero-tilt]");
  const matrix = () => tilt.evaluate((el) => {
    const value = new DOMMatrixReadOnly(getComputedStyle(el).transform);
    return { x: value.m13, y: value.m23, depth: value.m43, offsetX: value.m41 };
  });
  for (const board of ["uno", "nano", "esp32"]) {
    await expect(hero).toHaveAttribute("data-hero-active", board, { timeout: 6500 });
    await expect(hero).toHaveAttribute("data-hero-phase", "holding");
    // No new pointer event is needed to retain the pose on the next board.
    if (board !== "uno") {
      await expect(hero).toHaveAttribute("data-hero-hovered", "true");
      expect(Math.abs((await matrix()).x)).toBeGreaterThan(.04);
    }
    const bounds = (await hero.boundingBox())!;
    await page.mouse.move(bounds.x + bounds.width * .15, bounds.y + bounds.height * .2);
    await expect(hero).toHaveAttribute("data-hero-hovered", "true");
    await expect.poll(async () => (await matrix()).offsetX).toBeLessThan(-4);
    const left = await matrix();
    expect(Math.abs(left.x)).toBeGreaterThan(.04);
    expect(left.depth).toBeGreaterThan(5);
    await page.mouse.move(bounds.x + bounds.width * .85, bounds.y + bounds.height * .8);
    await expect.poll(async () => (await matrix()).offsetX).toBeGreaterThan(4);
    const right = await matrix();
    expect(left.x * right.x).toBeLessThan(0);
    expect(left.y * right.y).toBeLessThan(0);
    await hero.screenshot({ path: `test-results/hero-hover-${board}.png` });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  await page.mouse.move(0, 0);
  await expect(hero).not.toHaveAttribute("data-hero-hovered", "true");
  await expect.poll(async () => (await matrix()).offsetX).toBe(0);
  expect((await matrix()).depth).toBe(0);
});
