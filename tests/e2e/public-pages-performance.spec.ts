import { test, expect } from "@playwright/test";
import { gzipSync } from "node:zlib";

type Metrics = { lcp: number; cls: number; interactions: number[]; longTasks: number[] };
for (const width of [390, 1440]) for (const route of ["fitur", "belajar", "jelajahi", "harga"]) {
  test(`${route} measured production performance at ${width}`, async ({ page }, testInfo) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width, height: 900 });
    const session = await page.context().newCDPSession(page);
    await session.send("Network.enable");
    await session.send("Network.setCacheDisabled", { cacheDisabled: true });
    await session.send("Network.emulateNetworkConditions", { offline: false, latency: 40, downloadThroughput: 200_000, uploadThroughput: 93_750 });
    await session.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.addInitScript(() => {
      const metrics: Metrics = { lcp: 0, cls: 0, interactions: [], longTasks: [] };
      (window as typeof window & { publicMetrics: Metrics }).publicMetrics = metrics;
      new PerformanceObserver((list) => { for (const entry of list.getEntries()) metrics.lcp = entry.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => { for (const entry of list.getEntries()) { const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean }; if (!shift.hadRecentInput) metrics.cls += shift.value; } }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((list) => { for (const entry of list.getEntries()) if ((entry as PerformanceEventTiming).interactionId) metrics.interactions.push(entry.duration); }).observe({ type: "event", buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
      new PerformanceObserver((list) => { for (const entry of list.getEntries()) metrics.longTasks.push(entry.duration); }).observe({ type: "longtask", buffered: true });
    });
    await page.goto(`/${route}`);
    await expect(page.locator(`[data-public-route='/${route}']`)).toHaveAttribute("data-motion-ready", "ready");
    await page.waitForTimeout(500);
    const scripts = await page.evaluate(() => performance.getEntriesByType("resource").map((entry) => entry.name).filter((name) => name.includes("/_next/static/") && name.includes(".js")));
    let gzipBytes = 0;
    for (const url of new Set(scripts)) {
      const body = await (await page.request.get(url)).body();
      expect(body.toString()).not.toMatch(/react-flow__|monaco-editor|GoogleGenAI|WebGLRenderer|SimulationEngine/);
      gzipBytes += gzipSync(body).byteLength;
    }
    await session.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    const frames = await page.evaluate(() => new Promise<number[]>((resolve) => {
      const times: number[] = []; let previous = performance.now();
      const sample = (now: number) => { times.push(now - previous); previous = now; if (times.length < 90) requestAnimationFrame(sample); else resolve(times); };
      requestAnimationFrame(sample); scrollTo({ top: 1400, behavior: "smooth" });
    }));
    await page.getByRole("button", { name: "Kembali ke atas halaman" }).click();
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    const metrics = await page.evaluate(() => (window as typeof window & { publicMetrics: Metrics }).publicMetrics);
    const report = { route, width, profile: "Local production, cold cache, 4x CPU loading, 1.6 Mbps, 40ms latency; scroll sampling at 1x CPU", lcpMs: Math.round(metrics.lcp), cls: metrics.cls, maxEventMs: Math.max(0, ...metrics.interactions), longTaskCount: metrics.longTasks.length, maxLongTaskMs: Math.round(Math.max(0, ...metrics.longTasks)), initialAndMotionGzipBytes: gzipBytes, scrollFrameP95Ms: frames.sort((a, b) => a - b)[Math.floor(frames.length * .95)], note: "Synthetic Event Timing and frame samples, not field INP or physical device results." };
    await testInfo.attach(`performance-${route}-${width}`, { body: JSON.stringify(report, null, 2), contentType: "application/json" });
    console.log(JSON.stringify(report));
    expect(metrics.lcp).toBeGreaterThan(0);
    expect(metrics.lcp).toBeLessThanOrEqual(2500);
    expect(metrics.cls).toBeLessThanOrEqual(.1);
    if (metrics.interactions.length) expect(report.maxEventMs).toBeLessThanOrEqual(200);
    await session.detach();
  });
}
