import { test, expect, type Page } from "@playwright/test";
import { meaningfulCopy } from "../../components/marketing/scenes/homepage-motion-manifest";

async function boardSeek(page: Page, progress: number) {
  await expect(page.locator("[data-home-experience]")).toHaveAttribute("data-boards-sticky", "true");
  await page.evaluate(async (p) => {
    await document.fonts.ready;
    const container = document.querySelector<HTMLElement>("[data-board-showcase]")!;
    const stage = document.querySelector<HTMLElement>("[data-board-stage]")!;
    const header = document.querySelector<HTMLElement>("[data-home-header]")!.offsetHeight;
    scrollTo(0, container.getBoundingClientRect().top + scrollY - header - 16 + (container.offsetHeight - stage.offsetHeight) * p);
  }, progress);
  await expect.poll(async () => Number(await page.locator('[data-cinematic-slot="boards"]').getAttribute("data-progress"))).toBeCloseTo(progress, 1);
}

for (const width of [390, 1440]) test(`cinematic ownership, board sequencing and coverage at ${width}`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 900 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("[data-home-experience]")).toHaveAttribute("data-home-motion", "full");
  await expect(page.locator("[data-catalog-type]")).toHaveCount(0);
  await expect(page.locator("[data-featured-board]")).toHaveCount(3);
  // Hero is SVG/GSAP only, even after scrolling and engaging the page.
  await page.locator('[data-hero-2d]').scrollIntoViewIfNeeded();
  await page.evaluate(() => scrollBy(0, 24));
  await expect(page.locator('[data-hero-board]')).toHaveCount(3);
  await expect(page.locator('[data-home-zone="hero"] canvas,[data-home-zone="hero"] [data-cinematic-slot]')).toHaveCount(0);
  await expect(page.locator('[data-cinematic-slot]')).toHaveCount(1);
  await page.waitForTimeout(1200);
  await expect(page.locator('[data-home-zone="hero"]')).toBeVisible();
  await page.screenshot({ path: `test-results/cinematic-${width}-hero.png` });
  for (const [p, board] of [[.15, "uno"], [.5, "nano"], [.84, "esp32"], [.5, "nano"], [.15, "uno"]] as const) {
    await boardSeek(page, p);
    await expect(page.locator('[data-cinematic-slot="boards"]')).toHaveAttribute("data-renderer", "webgl", { timeout: 20000 });
    await expect(page.locator('[data-cinematic-slot="boards"] [data-board]')).toHaveAttribute("data-board", board);
    await expect(page.locator(`[data-featured-board="${board}"] h3`)).toHaveCSS("opacity", "1");
    await expect(page.locator("canvas")).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: `test-results/cinematic-${width}-${board}.png` });
    await expect.poll(async () => Number(await page.locator('[data-cinematic-slot="boards"] [data-render-frames]').getAttribute("data-draw-calls"))).toBeGreaterThan(0);
    const hardware = await page.locator('[data-cinematic-slot="boards"] [data-render-frames]').evaluate((el) => ({ calls: Number(el.getAttribute("data-draw-calls")), triangles: Number(el.getAttribute("data-triangles")) }));
    // Six batched physical finishes plus one shared atlas for printed markings.
    expect(hardware.calls).toBeLessThanOrEqual(7);
    expect(hardware.triangles).toBeLessThan(6000);
    await info.attach(`${board}-hardware-budget`, { body: JSON.stringify(hardware), contentType: "application/json" });
    await page.locator("[data-board-stage]").screenshot({ path: `test-results/hardware-${width}-${board}-light.png` });
  }
  await boardSeek(page, .5);
  const performanceSample = await page.evaluate(async () => {
    const container = document.querySelector<HTMLElement>("[data-board-showcase]")!;
    const stage = document.querySelector<HTMLElement>("[data-board-stage]")!;
    const start = container.getBoundingClientRect().top + scrollY - document.querySelector<HTMLElement>("[data-home-header]")!.offsetHeight - 16;
    const length = container.offsetHeight - stage.offsetHeight;
    const samples: number[] = []; let previous = 0;
    for (let i = 0; i < 120; i++) {
      const now = await new Promise<number>((resolve) => requestAnimationFrame(resolve));
      if (previous && i > 10) samples.push(now - previous);
      previous = now;
      scrollTo(0, start + length * (.37 + .2 * (i < 60 ? i / 60 : (120 - i) / 60)));
    }
    samples.sort((a, b) => a - b);
    const host = document.querySelector<HTMLElement>('[data-cinematic-slot="boards"] [data-render-frames]')!;
    return { frameP95: samples[Math.floor(samples.length * .95)], calls: Number(host.dataset.drawCalls), triangles: Number(host.dataset.triangles) };
  });
  expect(performanceSample.frameP95).toBeLessThanOrEqual(width < 600 ? 33 : 20);
  expect(performanceSample.calls).toBeLessThanOrEqual(width < 600 ? 45 : 80);
  expect(performanceSample.triangles).toBeLessThanOrEqual(width < 600 ? 20000 : 40000);
  await info.attach("cinematic-performance", { body: JSON.stringify(performanceSample), contentType: "application/json" });
  console.log(JSON.stringify({ width, cinematic: performanceSample }));
  await boardSeek(page, .5);
  await page.reload();
  await boardSeek(page, .5);
  await expect(page.locator('[data-cinematic-slot="boards"]')).toHaveAttribute("data-active-board", "nano");
  await expect(page.locator('[data-cinematic-slot="boards"]')).toHaveAttribute("data-renderer", "webgl", { timeout: 20000 });
  const before = await page.locator('[data-cinematic-slot="boards"] [data-render-frames]').getAttribute("data-render-frames");
  await page.waitForTimeout(500);
  expect(Number(await page.locator('[data-cinematic-slot="boards"] [data-render-frames]').getAttribute("data-render-frames")) - Number(before)).toBeLessThan(4);
  for (const zone of ["problem", "workspace", "cirra", "challenge", "projects", "access", "closing"]) {
    await page.locator(`[data-home-zone="${zone}"]`).scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await expect(page.locator(`[data-home-zone="${zone}"] canvas,[data-home-zone="${zone}"] [data-cinematic-slot]`)).toHaveCount(0);
    await page.screenshot({ path: `test-results/cinematic-${width}-${zone}.png` });
    expect(await page.locator("canvas").count()).toBeLessThanOrEqual(1);
  }
  const coverage = await page.locator("[data-home-experience]").evaluate((root, selector) => {
    const report: Record<string, Record<string, number>> = {};
    root.querySelectorAll<HTMLElement>("[data-home-zone]").forEach((zone) => {
      const counts: Record<string, number> = {};
      zone.querySelectorAll<HTMLElement>("[data-home-treatment]").forEach((target) => { const name = target.dataset.homeTreatment!; counts[name] = (counts[name] ?? 0) + 1; });
      report[zone.dataset.homeZone!] = counts;
    });
    const uncovered = [...root.querySelectorAll(selector)].filter((el) => !el.closest("[data-home-target],svg,[data-cinematic-slot]"));
    return { sections: report, uncovered: uncovered.map((el) => el.textContent?.slice(0, 80)) };
  }, meaningfulCopy);
  expect(coverage.uncovered).toEqual([]);
  expect(Object.keys(coverage.sections)).toHaveLength(10);
  await info.attach("homepage-motion-coverage", { body: JSON.stringify(coverage, null, 2), contentType: "application/json" });
  console.log(JSON.stringify({ width, coverage }));
  expect(errors).toEqual([]);
});

for (const theme of ["dark", "system"] as const) test(`hardware detail and exclusive rendering in ${theme} theme`, async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.addInitScript((value) => localStorage.setItem("vircuit-theme", value), theme);
  await page.goto("/");
  for (const [p, board] of [[.15, "uno"], [.5, "nano"], [.84, "esp32"]] as const) {
    await boardSeek(page, p);
    const slot = page.locator('[data-cinematic-slot="boards"]');
    await expect(slot).toHaveAttribute("data-renderer", "webgl", { timeout: 20000 });
    await expect(slot.locator("[data-board]")).toHaveAttribute("data-board", board);
    await expect(page.locator("canvas")).toHaveCount(1);
    await expect(slot.locator("[data-cinematic-fallback]")).toHaveCSS("visibility", "hidden");
    await page.locator("[data-board-stage]").screenshot({ path: `test-results/hardware-1440-${board}-${theme}.png` });
  }
  await expect(page.locator('[data-home-zone="hero"] canvas')).toHaveCount(0);
});

test("cinematic context loss, runtime reduced motion and route teardown keep SVG", async ({ page }) => {
  await page.goto("/");
  await boardSeek(page, .5);
  const slot = page.locator('[data-cinematic-slot="boards"]');
  await expect(slot).toHaveAttribute("data-renderer", "webgl", { timeout: 20000 });
  await page.locator("canvas").evaluate((canvas) => (canvas as HTMLCanvasElement).getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext());
  await expect(slot).toHaveAttribute("data-renderer", "svg");
  await expect(page.locator("canvas")).toHaveCount(0);
  await boardSeek(page, .15);
  await expect(slot).toHaveAttribute("data-active-board", "uno");
  await page.reload();
  await boardSeek(page, .5);
  await expect(slot).toHaveAttribute("data-renderer", "webgl", { timeout: 20000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(slot).toHaveAttribute("data-renderer", "svg");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await boardSeek(page, .84);
  await expect(slot).toHaveAttribute("data-renderer", "webgl", { timeout: 20000 });
  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Fitur", exact: true }).click();
  await expect(page).toHaveURL(/\/fitur$/);
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
});

test("boards remain readable in reduced motion and short viewports", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  await expect(page.locator("[data-home-experience]")).toHaveAttribute("data-boards-sticky", "false");
  for (const board of ["uno", "nano", "esp32"]) {
    await expect(page.locator(`[data-featured-fallback="${board}"]`)).toHaveCSS("opacity", "1");
    await page.locator(`[data-featured-board="${board}"]`).scrollIntoViewIfNeeded();
    await expect(page.locator(`[data-featured-board="${board}"] h3`)).toBeVisible();
  }
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator("[data-home-experience]")).toHaveAttribute("data-boards-sticky", "false");
  await expect(page.locator("[data-board-stage]")).toHaveCSS("position", "relative");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
