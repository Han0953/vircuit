import { test, expect } from "@playwright/test";
import { gzipSync } from "node:zlib";
import { writeFile } from "node:fs/promises";

type Metrics = { lcp: number; cls: number; shifts: { start: number; value: number; nodes: { tag: string; id: string; previous: DOMRectReadOnly; current: DOMRectReadOnly }[] }[]; interactions: number[]; events: { name: string; start: number; duration: number; processing: number }[]; longTasks: { start: number; duration: number }[] };

test("server-rendered homepage sections and FAQ work without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
  try {
    const page = await context.newPage();
    await page.goto("/");
    for (const section of await page.locator("[data-home-zone]").all()) {
      await section.scrollIntoViewIfNeeded();
      await expect(section).toBeVisible();
    }
    await expect(page.locator("[data-hero-board='uno'] svg").last()).toBeVisible();
    for (const board of await page.locator("[data-featured-fallback]").all()) await expect(board.locator("svg").last()).toBeVisible();
    await page.locator("summary").first().click();
    await expect(page.locator("details[open] p")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  } finally { await context.close(); }
});

for (const width of [390, 1440]) {
  test(`homepage measured loading and interaction at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const session = await page.context().newCDPSession(page);
    const profile = process.env.VIRCUIT_PROFILE_HOMEPAGE === "1";
    if (profile) {
      await session.send("Profiler.enable");
      await session.send("Profiler.start");
    }
    await session.send("Network.enable");
    await session.send("Network.setCacheDisabled", { cacheDisabled: true });
    await session.send("Network.emulateNetworkConditions", { offline: false, latency: 40, downloadThroughput: 1_600_000 / 8, uploadThroughput: 750_000 / 8 });
    await session.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.addInitScript(() => {
      const metrics: Metrics = { lcp: 0, cls: 0, shifts: [], interactions: [], events: [], longTasks: [] };
      (window as typeof window & { homeMetrics: Metrics }).homeMetrics = metrics;
      new PerformanceObserver((list) => { for (const entry of list.getEntries()) metrics.lcp = entry.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => { for (const entry of list.getEntries()) { const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean; sources: { node?: Element; previousRect: DOMRectReadOnly; currentRect: DOMRectReadOnly }[] }; if (!shift.hadRecentInput) { metrics.cls += shift.value; metrics.shifts.push({ start: entry.startTime, value: shift.value, nodes: shift.sources.map((source) => ({ tag: source.node?.tagName ?? "", id: source.node?.id ?? "", previous: source.previousRect, current: source.currentRect })) }); } } }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((list) => { for (const entry of list.getEntries()) { const event = entry as PerformanceEventTiming; if (event.interactionId) { metrics.interactions.push(entry.duration); metrics.events.push({ name: event.name, start: event.startTime, duration: event.duration, processing: event.processingEnd - event.processingStart }); } } }).observe({ type: "event", buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
      new PerformanceObserver((list) => { for (const entry of list.getEntries()) metrics.longTasks.push({ start: entry.startTime, duration: entry.duration }); }).observe({ type: "longtask", buffered: true });
    });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect.poll(() => page.evaluate(() => (window as typeof window & { homeMetrics: Metrics }).homeMetrics.lcp)).toBeGreaterThan(0);
    const initialScripts = await page.evaluate(() => performance.getEntriesByType("resource").map((e) => e.name).filter((url) => url.includes("/_next/static/") && url.includes(".js")));
    await page.locator("summary").first().click();
    await expect(page.locator("details[open]")).toHaveCount(1);
    await page.keyboard.press("Tab");
    // Event Timing entries arrive asynchronously after presentation. Do not
    // mistake an observer that has not delivered yet for a zero-latency click.
    await page.waitForTimeout(300);
    const metrics = await page.evaluate(() => (window as typeof window & { homeMetrics: Metrics }).homeMetrics);
    if (profile) {
      const { profile: cpu } = await session.send("Profiler.stop");
      const path = testInfo.outputPath(`homepage-${width}.cpuprofile`);
      await writeFile(path, JSON.stringify(cpu));
      await testInfo.attach(`homepage-cpu-${width}`, { path, contentType: "application/json" });
    }
    const motionChunks: Array<{ url: string; gzip: number }> = [];
    for (const url of [...new Set(initialScripts)]) {
      const response = await page.request.get(url);
      const body = await response.body();
      const source = body.toString();
      expect(source).not.toMatch(/react-flow__|monaco-editor|GoogleGenAI|SimulationEngine/);
      if (/ScrollTrigger|home-story|data-motion/.test(source)) motionChunks.push({ url: new URL(url).pathname, gzip: gzipSync(body).byteLength });
    }
    const report = { profile: "Local production, cold cache, 4x CPU, 1.6 Mbps, 40ms latency", width, lcpMs: Math.round(metrics.lcp), cls: metrics.cls, shifts: metrics.shifts, maxObservedInteractionMs: Math.max(0, ...metrics.interactions), interactionEntries: metrics.interactions.length, events: metrics.events, longTasks: metrics.longTasks, motionChunks, motionGzipBytes: motionChunks.reduce((total, chunk) => total + chunk.gzip, 0), note: "Synthetic lab sample; event timing is not field INP. Zero entries means below observer threshold or unavailable." };
    await testInfo.attach(`homepage-performance-${width}`, { body: JSON.stringify(report, null, 2), contentType: "application/json" });
    console.log(JSON.stringify(report));
    expect(metrics.lcp).toBeLessThanOrEqual(2500);
    expect(metrics.cls).toBeLessThanOrEqual(.1);
    if (metrics.interactions.length) expect(report.maxObservedInteractionMs).toBeLessThanOrEqual(200);
    expect(report.motionGzipBytes).toBeLessThanOrEqual(102_400);
    await session.detach();
  });
}

for (const width of [390, 1440]) {
  for (const theme of ["light", "dark", "system"]) {
    test(`homepage ${theme} scene screenshots at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: "dark" });
      await page.addInitScript((value) => localStorage.setItem("vircuit-theme", value), theme);
      await page.goto("/");
      await expect(page.locator('[data-scene="hero"]')).toHaveAttribute("data-motion", "hero");
      await expect(page.locator('[data-hero-2d]')).toHaveAttribute("data-hero-phase", "holding");
      await expect(page.locator('[data-hero-scene]:visible')).toHaveCount(1);
      await expect(page.locator('[data-hero-scene]:visible [data-hero-led]')).toHaveCSS("opacity", "1");
      await page.screenshot({ path: `test-results/home-${width}-${theme}-hero.png` });
      for (const [kind, selector] of [["simulator", "[data-serial]"], ["cirra", "[data-next]"], ["challenge", "[data-result]"]]) {
        const scene = page.locator(`[data-scene="${kind}"]`);
        await scene.scrollIntoViewIfNeeded();
        await expect(scene).toHaveAttribute("data-motion", kind);
        await expect.poll(() => scene.locator(selector).evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(1);
        await scene.screenshot({ path: `test-results/home-${width}-${theme}-${kind}.png` });
      }
      await page.locator("#final-cta-heading").scrollIntoViewIfNeeded();
      await expect(page.locator("#final-cta-heading")).toHaveAttribute("data-home-played", "true");
      await expect(page.locator("#final-cta-heading")).toHaveCSS("opacity", "1");
      await page.screenshot({ path: `test-results/home-${width}-${theme}-final.png` });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    });
  }
}
