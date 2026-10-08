import { expect, test, type Page } from "@playwright/test";
import { fixture } from "../../features/simulator/tests/fixtures";
import type { Project } from "../../features/simulator/types/project";

async function load(page: Page, project: Project) {
  await page.goto("/simulator");
  await page.getByRole("button", { name: "Buka menu proyek" }).click();
  await page.getByLabel("Impor JSON", { exact: true }).setInputFiles({ name: "routing-v1.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(project)) });
  await expect(page.locator(".react-flow__node")).toHaveCount(project.components.length);
  await expect(page.getByTestId("circuit-canvas")).toHaveAttribute("data-routing-pending", "0");
  await page.locator(".react-flow__controls-fitview").click();
}

async function expectAnchors(page: Page, id: string, from: string, to: string) {
  await expect.poll(() => page.evaluate(({ id, from, to }) => {
    const path = document.querySelector<SVGPathElement>(`.react-flow__edge[data-id="${id}"] .react-flow__edge-path`);
    const pins = [from, to].map((key) => { const [node, pin] = key.split("."); return document.querySelector(`[data-id="${node}"] [data-handleid="${pin}"]`); });
    const matrix = path?.getScreenCTM();
    if (!path || !matrix || pins.some((pin) => !pin)) return Infinity;
    const points = [path.getPointAtLength(0), path.getPointAtLength(path.getTotalLength())];
    return Math.max(...points.map((point, i) => {
      const transformed = new DOMPoint(point.x, point.y).matrixTransform(matrix), box = pins[i]!.getBoundingClientRect();
      return Math.hypot(transformed.x - box.x - box.width / 2, transformed.y - box.y - box.height / 2);
    }));
  }, { id, from, to })).toBeLessThan(1);
}

function obstacleProject() {
  const p = fixture({ left: "resistor", right: "resistor", obstacle: "led" }, [["left.2", "right.1"]], "void setup(){}void loop(){}");
  p.components[0].position = { x: 0, y: 0 }; p.components[1].position = { x: 400, y: 0 }; p.components[2].position = { x: 200, y: -20 };
  return p;
}

test("orthogonal obstacle detours retain pin centers, selection, themes and workspace layout", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await load(page, obstacleProject());
  const edge = page.locator('.react-flow__edge[data-id="w0"]');
  await expect(edge.locator("[data-routing-status]")).toHaveAttribute("data-routing-status", "astar");
  const path = edge.locator(".react-flow__edge-path");
  const d = await path.getAttribute("d");
  expect(d).not.toMatch(/[CQ]/); expect(d).toContain("L");
  // In world space, every segment must stay outside the LED's inflated body.
  expect(await path.evaluate((el) => {
    const numbers = el.getAttribute("d")!.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
    for (let i = 2; i < numbers.length; i += 2) {
      const [ax, ay, bx, by] = [numbers[i - 2], numbers[i - 1], numbers[i], numbers[i + 1]];
      if (ax !== bx && ay !== by) return false;
      if (ax === bx && ax > 192 && ax < 256 && Math.max(ay, by) > -28 && Math.min(ay, by) < 60) return false;
      if (ay === by && ay > -28 && ay < 60 && Math.max(ax, bx) > 192 && Math.min(ax, bx) < 256) return false;
    }
    return true;
  })).toBe(true);
  await expectAnchors(page, "w0", "left.2", "right.1");
  await edge.dispatchEvent("click");
  await expect(edge.locator(".wire-highlight")).toHaveClass(/is-selected/);
  const revision = await page.getByTestId("circuit-canvas").getAttribute("data-routing-revision");
  await page.getByLabel("Warna kabel").selectOption("red");
  await page.getByRole("separator", { name: "Ubah lebar Parts" }).focus(); await page.keyboard.press("ArrowRight");
  await page.getByRole("separator", { name: "Ubah tinggi panel bawah" }).focus(); await page.keyboard.press("ArrowUp");
  await page.locator(".react-flow__controls-zoomin").click();
  await expect(page.getByTestId("circuit-canvas")).toHaveAttribute("data-routing-revision", revision!);
  await expectAnchors(page, "w0", "left.2", "right.1");
  await page.locator(".react-flow__controls-fitview").click();
  for (const theme of ["Terang", "Gelap", "Sistem"]) {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.getByRole("button", { name: /^Pilih tema:/ }).click(); await page.getByRole("menuitemradio", { name: theme }).click();
    await expect(page.getByRole("menu")).not.toBeVisible();
    await page.screenshot({ path: `test-results/routing-${theme}.png` });
  }
  await page.getByRole("link", { name: "Code", exact: true }).click(); await expect(page.locator(".monaco-editor")).toBeVisible();
  await page.getByRole("link", { name: "Circuit", exact: true }).click();
  await expect(page.getByTestId("circuit-canvas")).toHaveAttribute("data-routing-revision", revision!);
  await expectAnchors(page, "w0", "left.2", "right.1");
});

test("drag preview follows endpoints, final routing responds to unrelated obstacles and rotation", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await load(page, obstacleProject());
  await page.getByRole("button", { name: "Focus Mode", exact: true }).click(); await page.locator(".react-flow__controls-fitview").click();
  const edge = page.locator('.react-flow__edge[data-id="w0"] [data-routing-status]');
  const right = page.locator('[data-id="right"].react-flow__node [data-testid="component-body"]');
  const box = (await right.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 100, { steps: 10 });
  await expect(edge).toHaveAttribute("data-routing-status", "fallback");
  await expectAnchors(page, "w0", "left.2", "right.1");
  await page.mouse.up(); await expect(page.getByTestId("circuit-canvas")).toHaveAttribute("data-routing-pending", "0");
  await expect(edge).not.toHaveAttribute("data-routing-status", "fallback");
  const before = await page.getByTestId("circuit-canvas").getAttribute("data-routing-revision");
  const beforePath = await page.locator('.react-flow__edge[data-id="w0"] .react-flow__edge-path').getAttribute("d");
  const obstacle = (await page.locator('[data-id="obstacle"].react-flow__node [data-testid="component-body"]').boundingBox())!;
  await page.mouse.move(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2); await page.mouse.down();
  await page.mouse.move(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2 + 200, { steps: 10 }); await page.mouse.up();
  await expect(page.getByTestId("circuit-canvas")).not.toHaveAttribute("data-routing-revision", before!);
  await expect(page.locator('.react-flow__edge[data-id="w0"] .react-flow__edge-path')).not.toHaveAttribute("d", beforePath!);
  await page.getByRole("button", { name: "Focus Mode", exact: true }).click();
  await right.click({ position: { x: 30, y: 10 } });
  for (let i = 0; i < 4; i++) {
    await page.getByRole("button", { name: "Putar komponen", exact: true }).click();
    await expect(page.getByTestId("circuit-canvas")).toHaveAttribute("data-routing-pending", "0");
    await expectAnchors(page, "w0", "left.2", "right.1");
  }
});

test("profiles browser routing and drag for small, medium and stress scenes", async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const [label, nodes, wires] of [["small", 8, 10], ["medium", 40, 200], ["stress", 100, 500]] as const) {
    const p = fixture(Object.fromEntries(Array.from({ length: nodes }, (_, i) => [`c${i}`, i === 0 ? "breadboard-full" : "resistor"])), [], "void setup(){}void loop(){}");
    p.components.forEach((c, i) => { c.position = { x: (i % 10) * 220, y: Math.floor(i / 10) * 180 }; });
    p.components[0].position = { x: -600, y: -100 };
    for (let i = 0; i < wires; i++) {
      const a = 1 + i % (nodes - 1), b = 1 + (a + Math.floor(i / (nodes - 1))) % (nodes - 1);
      p.wires.push({ id: `wire${i}`, from: { componentId: `c${a}`, pinId: "2" }, to: { componentId: `c${b}`, pinId: "1" }, color: "blue" });
    }
    const start = Date.now(); await load(page, p);
    await expect(page.locator(".react-flow__edge")).toHaveCount(wires);
    const canvas = page.getByTestId("circuit-canvas");
    const initial = { wallMsIncludingNavigation: Date.now() - start, maxBatchMs: await canvas.getAttribute("data-routing-batch-ms"), computeMs: await canvas.getAttribute("data-routing-compute-ms"), fallbacks: await page.locator('[data-routing-status="fallback"]').count() };
    const box = (await page.locator('[data-id="c1"].react-flow__node [data-testid="component-body"]').boundingBox())!;
    const originalPosition = await page.locator('[data-id="c1"].react-flow__node').getAttribute("style");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
    const [frameTimes] = await Promise.all([
      page.evaluate(() => new Promise<number[]>((resolve) => {
        const intervals: number[] = []; let previous = performance.now(); const start = previous;
        const frame = (now: number) => { intervals.push(now - previous); previous = now; if (now - start >= 250) resolve(intervals); else requestAnimationFrame(frame); };
        requestAnimationFrame(frame);
      })),
      page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2 + 30, { steps: 12 }),
    ]);
    await page.mouse.up(); await expect(canvas).toHaveAttribute("data-routing-pending", "0");
    await expect(page.locator('[data-id="c1"].react-flow__node')).not.toHaveAttribute("style", originalPosition!);
    console.info(JSON.stringify({ label, ...initial, dragMaxFrameMs: Math.round(Math.max(...frameTimes) * 10) / 10, dragFrames: frameTimes.length }));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test("breadboard internal-hole routes survive old snapshot recovery", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const p = fixture({ b: "breadboard-mini", r: "resistor" }, [["b.A2", "r.1"]], "void setup(){}void loop(){}");
  p.components[1].position = { x: 500, y: 100 };
  await load(page, p);
  await expectAnchors(page, "w0", "b.A2", "r.1");
  await expect(page.locator('[data-routing-status="fallback"]')).toHaveCount(0);
  await expect.poll(() => page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => { const request = indexedDB.open("vircuit-projects", 1); request.onsuccess = () => resolve(request.result); });
    return new Promise<boolean>((resolve) => { const request = db.transaction("drafts").objectStore("drafts").get("guest"); request.onsuccess = () => { db.close(); resolve(request.result?.project?.wires?.[0]?.from.pinId === "A2"); }; });
  })).toBe(true);
  await page.reload(); await expect(page.locator(".react-flow__edge")).toHaveCount(1);
  await expect(page.getByTestId("circuit-canvas")).toHaveAttribute("data-routing-pending", "0");
  await expectAnchors(page, "w0", "b.A2", "r.1");
  await page.screenshot({ path: "test-results/routing-breadboard.png" });
});

test("multi-selection drag and undo keep both endpoint identities", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await load(page, obstacleProject());
  await page.getByRole("button", { name: "Focus Mode", exact: true }).click(); await page.locator(".react-flow__controls-fitview").click();
  const left = page.locator('[data-id="left"].react-flow__node'), right = page.locator('[data-id="right"].react-flow__node');
  await left.locator('[data-testid="component-body"]').click();
  await page.keyboard.down("Control"); await right.locator('[data-testid="component-body"]').click(); await page.keyboard.up("Control");
  await expect(left).toHaveClass(/selected/); await expect(right).toHaveClass(/selected/);
  const original = await left.getAttribute("style"), box = (await right.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2 + 40, { steps: 12 }); await page.mouse.up();
  await expect(left).not.toHaveAttribute("style", original!);
  await expectAnchors(page, "w0", "left.2", "right.1");
  await page.getByTestId("circuit-canvas").focus(); await page.keyboard.press("Control+z");
  await expect(left).toHaveAttribute("style", original!);
  await expectAnchors(page, "w0", "left.2", "right.1");
});

test.describe("touch routing", () => {
  test.use({ hasTouch: true, isMobile: true });
  test("mobile tap preview and final route use the same logical pins", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const p = obstacleProject(); p.wires = [];
    await load(page, p);
    for (const [index, selector] of ['[data-id="left"] [data-handleid="2"]', '[data-id="right"] [data-handleid="1"]'].entries()) {
      const box = (await page.locator(selector).boundingBox())!;
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      if (index === 0) {
        await expect(page.locator(".react-flow__connection-path")).toBeAttached();
        expect(await page.locator(".react-flow__connection-path").evaluate((el) => getComputedStyle(el).stroke)).not.toBe("none");
        expect(await page.locator(".react-flow__connection-path").getAttribute("d")).not.toMatch(/[CQ]/);
      }
    }
    await expect(page.locator(".react-flow__edge")).toHaveCount(1);
    await expect(page.getByTestId("circuit-canvas")).toHaveAttribute("data-routing-pending", "0");
    for (const width of [360, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    for (const theme of ["Terang", "Gelap", "Sistem"]) {
      await page.emulateMedia({ colorScheme: "dark" });
      await page.getByRole("button", { name: /^Pilih tema:/ }).click(); await page.getByRole("menuitemradio", { name: theme }).click();
      await expect(page.getByRole("menu")).not.toBeVisible();
      await page.screenshot({ path: `test-results/routing-mobile-${theme}.png` });
    }
  });
});
