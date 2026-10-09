import { test, expect, type Page } from "@playwright/test";
import { gzipSync } from "node:zlib";

async function seek(page: Page, progress: number) {
  await expect(page.locator('[data-scene="story"]')).toHaveAttribute("data-motion", "story");
  await page.evaluate(async () => { await document.fonts.ready; await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))); });
  await page.evaluate((p) => {
    const grid = document.querySelector<HTMLElement>("[data-story]")!;
    const stage = document.querySelector<HTMLElement>("[data-stage]")!;
    const offset = (document.querySelector<HTMLElement>("[data-home-header]")?.offsetHeight ?? 0) + 16;
    window.scrollTo(0, grid.getBoundingClientRect().top + scrollY - offset + Math.max(300, grid.offsetHeight - stage.offsetHeight) * p);
  }, progress);
  await expect.poll(async () => Number(await page.locator('[data-scene="story"]').getAttribute("data-progress"))).toBeCloseTo(progress, 1);
}

for (const width of [390, 1440]) test(`3D story reversible, demand rendered and fallback safe at ${width}`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/");
  await seek(page, .5);
  const world = page.locator("[data-renderer]");
  await expect(world).toHaveAttribute("data-renderer", "webgl", { timeout: 20000 });
  await expect(page.locator("canvas")).toHaveCount(1);
  for (const p of [.02, .15, .30, .50, .70, .90, 1, .50, .02]) {
    await seek(page, p);
    await expect.poll(async () => Number(await world.getAttribute("data-world-progress"))).toBeCloseTo(p, 1);
    if ([.15, .5, .9].includes(p)) await page.screenshot({ path: `test-results/world-${width}-${p}.png` });
  }
  await seek(page, .62);
  await expect.poll(async () => Number(await world.getAttribute("data-draw-calls"))).toBeGreaterThan(0);
  const calls = Number(await world.getAttribute("data-draw-calls"));
  const triangles = Number(await world.getAttribute("data-triangles"));
  expect(calls).toBeLessThanOrEqual(width < 600 ? 45 : 80);
  expect(triangles).toBeLessThanOrEqual(width < 600 ? 20000 : 40000);
  await testInfo.attach("world-stats", { body: JSON.stringify({ width, calls, triangles }), contentType: "application/json" });
  const before = Number(await world.getAttribute("data-render-frames"));
  await page.waitForTimeout(600);
  expect(Number(await world.getAttribute("data-render-frames")) - before).toBeLessThan(4);
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(300);
  const offscreen = Number(await world.getAttribute("data-render-frames"));
  await page.waitForTimeout(300);
  expect(Number(await world.getAttribute("data-render-frames"))).toBe(offscreen);
  await seek(page, .62);
  await expect.poll(async () => Number(await world.getAttribute("data-world-progress"))).toBeCloseTo(.62, 1);
  await page.locator("canvas").evaluate((canvas) => (canvas as HTMLCanvasElement).getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext());
  await expect(world).toHaveAttribute("data-renderer", "svg");
  await expect(page.locator("canvas")).toHaveCount(0);
  await seek(page, .2);
  await expect(page.locator("[data-svg-fallback]")).toBeVisible();
  await page.screenshot({ path: `test-results/world-${width}-fallback.png` });
});

test("WebGL unavailable keeps the animated SVG and complete catalog", async ({ page }) => {
  await page.addInitScript(() => Reflect.deleteProperty(window, "WebGL2RenderingContext"));
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto("/");
  await seek(page, .5);
  await expect(page.locator("[data-renderer]")).toHaveAttribute("data-renderer", "svg");
  await expect(page.locator("canvas")).toHaveCount(0);
  const first = await page.locator("[data-svg-fallback] [data-part='pot']").getAttribute("style");
  await seek(page, .2);
  expect(await page.locator("[data-svg-fallback] [data-part='pot']").getAttribute("style")).not.toBe(first);
  for (const type of ["nano", "esp32", "breadboard-half", "breadboard-full", "dht22", "relay", "fan"]) {
    const item = page.locator(`[data-catalog-type='${type}']`);
    await item.scrollIntoViewIfNeeded();
    await expect(item.getByRole("heading")).toBeVisible();
    expect(await item.locator("[data-catalog-body] svg").evaluate((el) => getComputedStyle(el).getPropertyValue("--part-pcb").trim())).toBe("#1b7598");
    const box = (await item.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(361);
  }
  await page.screenshot({ path: "test-results/home-360-catalog-fallback.png" });
});

test("failed WebGL chunk retains meaningful SVG", async ({ page }) => {
  await page.route("**/_next/static/chunks/*.js", async (route) => {
    const response = await route.fetch();
    const body = await response.body();
    if (body.toString().includes("WebGLRenderer")) await route.abort();
    else await route.fulfill({ response });
  });
  await page.goto("/");
  await seek(page, .5);
  await expect(page.locator("[data-svg-fallback]")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.unrouteAll({ behavior: "wait" });
});

test("context creation failure does not replace the page with an error", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { value: function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      return type.includes("webgl") ? null : Reflect.apply(original, this, [type, ...args]);
    } });
  });
  await page.goto("/");
  await seek(page, .5);
  await expect(page.locator("[data-svg-fallback]")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Belajar IoT");
  await seek(page, .2);
});

test("runtime reduced motion and repeated navigation release the world", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  for (let i = 0; i < 2; i++) {
    await seek(page, .62);
    await expect(page.locator("[data-renderer]")).toHaveAttribute("data-renderer", "webgl");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.locator(".pin-spacer")).toHaveCount(0);
    await expect(page.locator("[data-svg-fallback]")).toBeVisible();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await seek(page, .5);
    await expect(page.locator("canvas")).toHaveCount(1);
    await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Fitur", exact: true }).click();
    await expect(page).toHaveURL(/\/fitur$/);
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.locator(".pin-spacer")).toHaveCount(0);
    await expect(page.locator("html")).toHaveAttribute("data-home-scroll", "lenis");
    await expect(page.locator("header").first()).toHaveCSS("position", "sticky");
    await page.goBack();
  }
});

for (const width of [390, 1440]) test(`deferred world and scroll frame budget at ${width}`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-home-scroll", width < 1024 ? "native" : "lenis");
  await expect(page.locator('[data-scene="story"]')).toHaveAttribute("data-motion", "story");
  const scripts = () => page.evaluate(() => performance.getEntriesByType("resource").map((r) => r.name).filter((url) => url.includes("/_next/static/") && url.includes(".js")));
  const before = new Set(await scripts());
  for (const url of before) expect((await (await page.request.get(url)).body()).toString()).not.toContain("WebGLRenderer");
  await seek(page, .3);
  await expect(page.locator("[data-renderer]")).toHaveAttribute("data-renderer", "webgl");
  const chunks = [];
  for (const url of await scripts()) if (!before.has(url)) {
    const body = await (await page.request.get(url)).body();
    chunks.push({ url: new URL(url).pathname, gzip: gzipSync(body).byteLength });
  }
  const frames = await page.evaluate(async () => {
    const grid = document.querySelector<HTMLElement>("[data-story]")!;
    const stage = document.querySelector<HTMLElement>("[data-stage]")!;
    const offset = document.querySelector<HTMLElement>("[data-home-header]")!.offsetHeight + 16;
    const start = grid.getBoundingClientRect().top + scrollY - offset;
    const length = Math.max(300, grid.offsetHeight - stage.offsetHeight);
    const samples: number[] = []; let previous = 0;
    for (let i = 0; i < 180; i++) {
      const now = await new Promise<number>((resolve) => requestAnimationFrame(resolve));
      if (previous && i > 10) samples.push(now - previous);
      previous = now;
      window.scrollTo(0, start + length * (.15 + .7 * (i < 90 ? i / 90 : (180 - i) / 90)));
    }
    return samples.sort((a, b) => a - b);
  });
  const p95 = frames[Math.floor(frames.length * .95)];
  const stats = await page.locator("[data-renderer]").evaluate((el) => ({ calls: Number(el.getAttribute("data-draw-calls")), triangles: Number(el.getAttribute("data-triangles")), quality: el.getAttribute("data-quality") ?? "standard" }));
  const report = { profile: "Windows Edge headless, local production, warm world, unthrottled scripted forward/reverse native scroll; rAF interval, not GPU timing or field INP", width, frameP95Ms: Math.round(p95 * 10) / 10, deferredChunks: chunks, deferredGzipBytes: chunks.reduce((sum, chunk) => sum + chunk.gzip, 0), ...stats };
  console.log(JSON.stringify(report));
  await testInfo.attach("world-performance", { body: JSON.stringify(report, null, 2), contentType: "application/json" });
  expect(report.deferredGzipBytes).toBeLessThanOrEqual(256000);
  expect(p95).toBeLessThanOrEqual(width < 600 ? 33 : 20);
});
