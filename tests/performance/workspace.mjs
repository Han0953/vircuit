import { chromium } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";

const base = process.env.PERF_BASE_URL ?? "http://localhost:3002";
if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(base).hostname)) throw new Error("Performance fixtures require a loopback server");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = process.env.PERF_RESUME ? JSON.parse(await readFile(process.argv[2], "utf8")) : [];
const snapshot = (count, type = "resistor") => ({
  schemaVersion: 1, metadata: { name: `Performance fixture ${count}` },
  components: Array.from({ length: count }, (_, i) => ({ id: `c${i}`, type, label: type, position: { x: i % 10 * 180, y: Math.floor(i / 10) * 100 }, rotation: 0, properties: type === "resistor" ? { resistance: 220 } : {} })),
  wires: type === "resistor" ? Array.from({ length: count - 1 }, (_, i) => ({ id: `w${i}`, from: { componentId: `c${i}`, pinId: "2" }, to: { componentId: `c${i + 1}`, pinId: "1" }, color: "blue" })) : [],
  code: { language: "arduino-cpp-subset", source: "void setup(){}void loop(){}" }, settings: { boardId: null }, viewport: { x: 0, y: 0, zoom: 1 },
});
async function context(width, cpu = 1, network = false) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, isMobile: width < 600, hasTouch: width < 600 });
  await ctx.addInitScript(() => {
    localStorage.setItem("vircuit-theme", "light");
    window.__perf = { lcp: 0, long: [], frames: [], observing: false };
    new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__perf.lcp = entry.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver(list => { window.__perf.long.push(...list.getEntries().map(e => e.duration)); }).observe({ type: "longtask", buffered: true });
  });
  const page = await ctx.newPage(), cdp = await ctx.newCDPSession(page);
  await cdp.send("Performance.enable");
  await cdp.send("Network.enable");
  if (cpu !== 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpu });
  if (network) await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: 1600000 / 8, uploadThroughput: 750000 / 8 });
  return { ctx, page, cdp };
}
async function operation(w, scenario, action) {
  const before = Object.fromEntries((await w.cdp.send("Performance.getMetrics")).metrics.map(m => [m.name, m.value]));
  await w.page.evaluate(() => {
    const state = window.__perf; state.frames = []; state.long = []; state.observing = true;
    let last = performance.now(); const frame = t => { state.frames.push(t - last); last = t; if (state.observing) requestAnimationFrame(frame); }; requestAnimationFrame(frame);
  });
  const start = Date.now(); await action(); await w.page.waitForTimeout(250);
  const metrics = await w.page.evaluate(() => {
    const s = window.__perf; s.observing = false; const frames = s.frames.slice(2).sort((a, b) => a - b);
    return { frameP95: frames[Math.floor(frames.length * .95)] ?? 0, maxTask: Math.max(0, ...s.long), blockingExcess: s.long.reduce((sum, d) => sum + Math.max(0, d - 50), 0), dom: document.querySelectorAll("*").length, handles: document.querySelectorAll(".react-flow__handle").length, routingBatch: Number(document.querySelector("[data-routing-batch-ms]")?.getAttribute("data-routing-batch-ms") ?? 0) };
  });
  const after = Object.fromEntries((await w.cdp.send("Performance.getMetrics")).metrics.map(m => [m.name, m.value]));
  const result = { scenario, wall: Date.now() - start, ...metrics, styleMs: (after.RecalcStyleDuration - before.RecalcStyleDuration) * 1000, mainThreadMs: (after.TaskDuration - before.TaskDuration) * 1000 };
  results.push(result); console.log(JSON.stringify(result));
}
async function loadFixture(w, project) {
  const { page } = w;
  if (!(await page.getByRole("button", { name: "Buka menu proyek" }).isVisible())) { await page.getByRole("button", { name: "Tindakan workspace" }).click(); await page.getByRole("button", { name: "Buka menu proyek" }).click(); }
  else await page.getByRole("button", { name: "Buka menu proyek" }).click();
  await page.getByLabel("Impor JSON", { exact: true }).setInputFiles({ name: "performance.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(project)) });
  await page.keyboard.press("Escape"); await page.keyboard.press("Escape");
  await page.waitForFunction(count => document.querySelectorAll(".react-flow__node").length === count && document.querySelector("[data-routing-pending]")?.getAttribute("data-routing-pending") === "0", project.components.length);
}
async function drag(w) {
  const { page } = w, canvas = page.getByTestId("circuit-canvas"); await canvas.focus(); await page.keyboard.press("Control+a");
  const area = await canvas.boundingBox(); let body, point;
  for (const candidate of await page.getByTestId("component-body").all()) {
    const b = await candidate.boundingBox(); if (!b) continue;
    const left = Math.max(b.x + 16, area.x + 16), right = Math.min(b.x + b.width - 16, area.x + area.width - 90);
    const top = Math.max(b.y + 16, area.y + 45), bottom = Math.min(b.y + b.height - 16, area.y + area.height - 80);
    if (right > left && bottom > top) { body = candidate; point = { x: (left + right) / 2, y: (top + bottom) / 2 }; break; }
  }
  if (!body) throw new Error("No visible drag target");
  const node = body.locator(".."), before = await node.getAttribute("style");
  await page.mouse.move(point.x, point.y); await page.mouse.down(); await page.mouse.move(point.x + 60, point.y + 40, { steps: 20 }); await page.mouse.up();
  await page.waitForFunction(() => document.querySelector("[data-routing-pending]")?.getAttribute("data-routing-pending") === "0");
  if (before === await node.getAttribute("style")) throw new Error("Drag did not move the node");
}
try {
  for (const [width, cpu] of [[1440, 1], [390, 4]]) {
    if (results.some(row => row.scenario === `theme-${width}-cpu${cpu}`)) continue;
    const w = await context(width, cpu); await w.page.goto(`${base}/simulator`); await w.page.waitForTimeout(700);
    for (const count of [50, 100]) { await loadFixture(w, snapshot(count)); for (let run = 0; run < 3; run++) await operation(w, `drag-${count}-${width}-cpu${cpu}`, () => drag(w)); }
    await loadFixture(w, snapshot(3, "breadboard-full")); await operation(w, `breadboard-selection-${width}-cpu${cpu}`, async () => { await w.page.getByTestId("circuit-canvas").focus(); await w.page.keyboard.press("Control+a"); }); await w.ctx.close();
    const theme = await context(width, cpu); await theme.page.goto(base); await theme.page.waitForTimeout(800); await theme.page.locator("[data-story]").scrollIntoViewIfNeeded(); await theme.page.waitForTimeout(1600);
    for (let run = 0; run < 3; run++) { await theme.page.getByRole("button", { name: /Pilih tema:/ }).filter({ visible: true }).first().click(); await operation(theme, `theme-${width}-cpu${cpu}`, async () => { await theme.page.getByRole("menuitemradio", { name: run % 2 ? "Terang" : "Gelap", exact: true }).click(); await theme.page.waitForTimeout(650); }); }
    await theme.ctx.close();
  }
  for (let run = 0; run < 3; run++) {
    const w = await context(390, 4, true), start = Date.now(); await w.page.goto(`${base}/simulator/code`); await w.page.locator(".monaco-editor textarea").first().waitFor({ state: "attached", timeout: 60000 }); await w.page.waitForTimeout(500);
    const result = await w.page.evaluate(() => ({ lcp: window.__perf.lcp, maxTask: Math.max(0, ...window.__perf.long), jsKiB: performance.getEntriesByType("resource").filter(e => e.name.includes(".js")).reduce((sum, e) => sum + e.transferSize, 0) / 1024 }));
    const row = { scenario: "monaco-cold-390-cpu4-network", editorReady: Date.now() - start - 500, ...result }; results.push(row); console.log(JSON.stringify(row)); await w.ctx.close();
  }
} finally { await browser.close(); if (process.argv[2]) await writeFile(process.argv[2], JSON.stringify(results, null, 2)); }
