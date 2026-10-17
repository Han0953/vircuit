import { expect, test } from "@playwright/test";

for (const width of [390, 1440]) test(`3D code is prepared after the hero intro without mounting a Canvas at ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  const hero = page.locator("[data-home-zone='hero']");
  const world = page.locator("[data-scene='story'] [data-renderer]");
  await expect(hero).toHaveAttribute("data-hero-intro", "playing");
  await expect(world).not.toHaveAttribute("data-world-prepared", "true");
  await expect(hero).toHaveAttribute("data-hero-intro", "complete");
  await expect(world).toHaveAttribute("data-world-prepared", "true", { timeout: 15000 });
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator("[data-hero-scene]:visible")).toHaveCount(1);
  await page.locator("[data-stage]").scrollIntoViewIfNeeded();
  await expect(world).toHaveAttribute("data-renderer", "webgl", { timeout: 20000 });
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(world.locator("[data-svg-fallback]")).toBeHidden();
  expect(errors).toEqual([]);
});

test("approaching the story while idle preparation is in flight still mounts the renderer", async ({ page }) => {
  let delayed = false;
  let release!: () => void;
  const delivery = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/_next/static/chunks/*.js", async route => {
    const response = await route.fetch();
    if ((await response.body()).toString().includes("WebGLRenderer")) { delayed = true; await delivery; }
    await route.fulfill({ response });
  });
  try {
    await page.goto("/");
    await expect.poll(() => delayed, { timeout: 15000 }).toBe(true);
    await expect(page.locator("canvas")).toHaveCount(0);
    await page.locator("[data-stage]").scrollIntoViewIfNeeded();
    release();
    await expect(page.locator("[data-scene='story'] [data-renderer]")).toHaveAttribute("data-renderer", "webgl", { timeout: 20000 });
    await expect(page.locator("canvas")).toHaveCount(1);
  } finally { release(); await page.unrouteAll({ behavior: "wait" }); }
});

test("reduced motion skips idle WebGL preparation and can resume normal storytelling", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const world = page.locator("[data-scene='story'] [data-renderer]");
  await expect(page.locator("[data-home-zone='hero']")).toHaveAttribute("data-hero-intro", "reduced");
  await page.waitForTimeout(700);
  await expect(world).not.toHaveAttribute("data-world-prepared", "true");
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(world).toHaveAttribute("data-world-prepared", "true", { timeout: 15000 });
  await page.locator("[data-stage]").scrollIntoViewIfNeeded();
  await expect(world).toHaveAttribute("data-renderer", "webgl", { timeout: 20000 });
});

test("idle downloads do not consume the scene timeout or force fallback before entry", async ({ page }) => {
  await page.addInitScript(() => {
    const timeout = window.setTimeout.bind(window);
    window.setTimeout = ((callback: TimerHandler, delay?: number, ...args: unknown[]) => timeout(callback, delay === 15000 ? 100 : delay, ...args)) as typeof window.setTimeout;
  });
  let delayed = false;
  let release!: () => void;
  const delivery = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/_next/static/chunks/*.js", async route => {
    const response = await route.fetch();
    if ((await response.body()).toString().includes("WebGLRenderer")) { delayed = true; await delivery; }
    await route.fulfill({ response });
  });
  try {
    await page.goto("/");
    await expect.poll(() => delayed, { timeout: 15000 }).toBe(true);
    await page.waitForTimeout(500);
    const world = page.locator("[data-scene='story'] [data-renderer]");
    await expect(world).not.toHaveAttribute("data-webgl-failed", "true");
    await expect(page.locator("canvas")).toHaveCount(0);
    release();
    await expect(world).toHaveAttribute("data-world-prepared", "true");
    await page.locator("[data-stage]").scrollIntoViewIfNeeded();
    await expect(world).toHaveAttribute("data-renderer", "webgl", { timeout: 20000 });
  } finally { release(); await page.unrouteAll({ behavior: "wait" }); }
});
