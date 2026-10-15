import { expect, test, type Locator, type Page } from "@playwright/test";

async function sampleToggle(item: Locator, trigger: Locator) {
  const samples = item.evaluate((element) => new Promise<{ height: number; top: number; scroll: number }[]>((resolve) => {
    element.addEventListener("click", () => {
      const frames: { height: number; top: number; scroll: number }[] = []; const start = performance.now();
      function frame() {
        const box = element.getBoundingClientRect();
        frames.push({ height: box.height, top: box.top, scroll: scrollY });
        if (performance.now() - start < 520) requestAnimationFrame(frame); else resolve(frames);
      }
      frame();
    }, { once: true, capture: true });
  }));
  await trigger.click();
  return samples;
}

async function ready(page: Page, route: string) {
  await page.goto(route);
  if (route === "/") await expect(page.locator("[data-home-experience]")).toHaveAttribute("data-home-motion");
  else await expect(page.locator(`[data-public-route="${route}"]`)).toHaveAttribute("data-motion-ready");
  const item = page.locator("[data-animated-disclosure]").first();
  const trigger = item.locator("summary");
  await trigger.scrollIntoViewIfNeeded();
  await expect(trigger).toBeVisible();
  await expect.poll(() => trigger.evaluate((element) => getComputedStyle(element).opacity)).toBe("1");
  return { item, trigger };
}

for (const width of [390, 1440]) for (const route of ["/", "/harga"]) {
  test(`FAQ expands, collapses, reverses and supports keyboard: ${route} ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript((theme) => localStorage.setItem("vircuit-theme", theme), width === 390 ? "dark" : "light");
    const { item, trigger } = await ready(page, route);
    const next = page.locator("[data-animated-disclosure]").nth(1);
    const neighborHeight = await next.evaluate((element) => element.getBoundingClientRect().height);
    const closedHeight = await item.evaluate((element) => element.getBoundingClientRect().height);
    const opening = await sampleToggle(item, trigger);
    await expect(item).toHaveAttribute("open", "");
    const openHeight = await item.evaluate((element) => element.getBoundingClientRect().height);
    expect(openHeight).toBeGreaterThan(closedHeight + 20);
    expect(opening.some(({ height }) => height > closedHeight + 2 && height < openHeight - 2)).toBe(true);
    expect(Math.max(...opening.map(({ top }) => Math.abs(top - opening[0].top)))).toBeLessThanOrEqual(1);
    expect(Math.max(...opening.map(({ scroll }) => Math.abs(scroll - opening[0].scroll)))).toBeLessThanOrEqual(1);
    await expect(item.locator("p")).toBeVisible();
    expect(await next.evaluate((element) => element.getBoundingClientRect().height)).toBeCloseTo(neighborHeight, 0);
    expect(await item.evaluate((element) => element.style.height)).toBe("");
    await page.screenshot({ path: info.outputPath("faq-open.png") });
    const closing = await sampleToggle(item, trigger);
    await expect(item).not.toHaveAttribute("open");
    expect(closing.some(({ height }) => height > closedHeight + 2 && height < openHeight - 2)).toBe(true);
    expect(Math.max(...closing.map(({ top }) => Math.abs(top - closing[0].top)))).toBeLessThanOrEqual(1);
    expect(Math.max(...closing.map(({ scroll }) => Math.abs(scroll - closing[0].scroll)))).toBeLessThanOrEqual(1);
    await expect(item.locator("p")).toBeHidden();
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(item).toHaveAttribute("data-disclosure-expanded", "true");
    await page.keyboard.press("Space");
    await expect(item).not.toHaveAttribute("open");
    await expect(trigger).toBeFocused();
    // Three toggles before completion must finish expanded, without a stuck height.
    await trigger.evaluate((element) => { (element as HTMLElement).click(); });
    await trigger.evaluate((element) => { (element as HTMLElement).click(); });
    await trigger.evaluate((element) => { (element as HTMLElement).click(); });
    await expect(item).toHaveAttribute("data-disclosure-expanded", "true");
    await expect.poll(() => item.evaluate((element) => element.style.height)).toBe("");
    await expect(item.locator("p")).toBeVisible();
    await next.locator("summary").click();
    await expect(item).toHaveAttribute("data-disclosure-expanded", "false");
    await expect(item).not.toHaveAttribute("open");
    await expect(next.locator("p")).toBeVisible();
    await expect(page.locator("[data-animated-disclosure][open]")).toHaveCount(1);
    // Switching again before either transition finishes must keep the last choice.
    await item.locator("summary").evaluate((element) => (element as HTMLElement).click());
    await next.locator("summary").evaluate((element) => (element as HTMLElement).click());
    await item.locator("summary").evaluate((element) => (element as HTMLElement).click());
    await expect(next).not.toHaveAttribute("open");
    await expect.poll(() => item.evaluate((element) => element.style.height)).toBe("");
    await expect(item.locator("p")).toBeVisible();
    await expect(page.locator("[data-animated-disclosure][open]")).toHaveCount(1);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await trigger.click();
    await expect(item).not.toHaveAttribute("open");
    await trigger.click();
    await expect(item.locator("p")).toBeVisible();
    await next.locator("summary").click();
    await expect(item).not.toHaveAttribute("open");
    await expect(next.locator("p")).toBeVisible();
    await expect(page.locator("[data-animated-disclosure][open]")).toHaveCount(1);
    expect(await item.evaluate((element) => element.getAnimations().length)).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}

test("FAQ stays usable without JavaScript on both routes", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 360, height: 800 } });
  const page = await context.newPage();
  for (const route of ["/", "/harga"]) {
    await page.goto(route);
    const item = page.locator("[data-animated-disclosure]").first();
    await item.locator("summary").click();
    await expect(item.locator("p")).toBeVisible();
    const next = page.locator("[data-animated-disclosure]").nth(1);
    await next.locator("summary").click();
    await expect(item.locator("p")).toBeHidden();
    await expect(next.locator("p")).toBeVisible();
    await expect(page.locator("[data-animated-disclosure][open]")).toHaveCount(1);
    await item.locator("summary").click();
    await expect(next.locator("p")).toBeHidden();
    await item.locator("summary").click();
    await expect(item.locator("p")).toBeHidden();
  }
  await context.close();
});

test("FAQ stays usable after navigating away during expansion", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const { trigger } = await ready(page, "/");
  await trigger.evaluate((element) => (element as HTMLElement).click());
  await page.locator('[data-home-header] a[href="/harga"]').click();
  await expect(page).toHaveURL(/\/harga$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  const item = page.locator("[data-animated-disclosure]").first();
  await expect.poll(() => item.evaluate((element) => element.style.height)).toBe("");
  const wasOpen = await item.getAttribute("open") !== null;
  await item.locator("summary").press("Enter");
  if (wasOpen) await expect(item).not.toHaveAttribute("open");
  else await expect(item).toHaveAttribute("open");
  await expect.poll(() => item.evaluate((element) => element.style.height)).toBe("");
});
