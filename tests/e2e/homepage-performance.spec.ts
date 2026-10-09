import { test, expect } from "@playwright/test";
import { gzipSync } from "node:zlib";

type Metrics = { lcp: number; cls: number; interactions: number[] };

for (const width of [390, 1440]) {
  test(`homepage measured loading and interaction at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const session = await page.context().newCDPSession(page);
    await session.send("Network.enable");
    await session.send("Network.setCacheDisabled", { cacheDisabled: true });
    await session.send("Network.emulateNetworkConditions", { offline: false, latency: 40, downloadThroughput: 1_600_000 / 8, uploadThroughput: 750_000 / 8 });
    await session.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.addInitScript(() => {
      const metrics: Metrics = { lcp: 0, cls: 0, interactions: [] };
      (window as typeof window & { homeMetrics: Metrics }).homeMetrics = metrics;
      new PerformanceObserver((list) => { for (const entry of list.getEntries()) metrics.lcp = entry.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => { for (const entry of list.getEntries()) { const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean }; if (!shift.hadRecentInput) metrics.cls += shift.value; } }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((list) => { for (const entry of list.getEntries()) { if ((entry as PerformanceEventTiming).interactionId) metrics.interactions.push(entry.duration); } }).observe({ type: "event", buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
    });
    await page.goto("/");
    await expect(page.locator('[data-scene="hero"]')).toHaveAttribute("data-motion", "hero");
    await expect.poll(() => page.evaluate(() => (window as typeof window & { homeMetrics: Metrics }).homeMetrics.lcp)).toBeGreaterThan(0);
    const initialScripts = await page.evaluate(() => performance.getEntriesByType("resource").map((e) => e.name).filter((url) => url.includes("/_next/static/") && url.includes(".js")));
    await page.locator("summary").first().click();
    await expect(page.locator("details[open]")).toHaveCount(1);
    await page.keyboard.press("Tab");
    const metrics = await page.evaluate(() => (window as typeof window & { homeMetrics: Metrics }).homeMetrics);
    const motionChunks: Array<{ url: string; gzip: number }> = [];
    for (const url of [...new Set(initialScripts)]) {
      const response = await page.request.get(url);
      const body = await response.body();
      const source = body.toString();
      expect(source).not.toMatch(/react-flow__|monaco-editor|GoogleGenAI|SimulationEngine/);
      if (/ScrollTrigger|home-story|data-motion/.test(source)) motionChunks.push({ url: new URL(url).pathname, gzip: gzipSync(body).byteLength });
    }
    const report = { profile: "Local production, cold cache, 4x CPU, 1.6 Mbps, 40ms latency", width, lcpMs: Math.round(metrics.lcp), cls: metrics.cls, maxObservedInteractionMs: Math.max(0, ...metrics.interactions), interactionEntries: metrics.interactions.length, motionChunks, motionGzipBytes: motionChunks.reduce((total, chunk) => total + chunk.gzip, 0), note: "Synthetic lab sample; event timing is not field INP. Zero entries means below observer threshold or unavailable." };
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
      await expect.poll(() => page.locator('[data-scene="hero"] [data-output]').evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(1);
      await page.screenshot({ path: `test-results/home-${width}-${theme}-hero.png` });
      for (const [kind, selector] of [["simulator", "[data-serial]"], ["cirra", "[data-next]"], ["challenge", "[data-result]"]]) {
        const scene = page.locator(`[data-scene="${kind}"]`);
        await scene.scrollIntoViewIfNeeded();
        await expect(scene).toHaveAttribute("data-motion", kind);
        await expect.poll(() => scene.locator(selector).evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(1);
        await scene.screenshot({ path: `test-results/home-${width}-${theme}-${kind}.png` });
      }
      await page.getByRole("heading", { name: "Rangkaian pertamamu dimulai dari satu percobaan." }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: `test-results/home-${width}-${theme}-final.png` });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    });
  }
}
