import { expect, test, type Page } from "@playwright/test";

const routes = ["/", "/fitur", "/belajar", "/jelajahi", "/harga"];
const provider = "http://127.0.0.1:3031";
async function chooseTheme(page: Page, name: "Terang" | "Gelap" | "Sistem") {
  const trigger = page.getByRole("button", { name: /^Pilih tema(:| tampilan)/ }).filter({ visible: true }).first();
  await expect(trigger).toBeVisible();
  const box = (await trigger.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  const option = page.getByRole("menu").getByRole("menuitemradio", { name, exact: true }).or(page.getByRole("radiogroup", { name: "Pilihan tema" }).getByRole("radio", { name, exact: true }));
  await expect(option).toBeVisible();
  const optionBox = (await option.boundingBox())!;
  await page.mouse.click(optionBox.x + optionBox.width / 2, optionBox.y + optionBox.height / 2);
}
async function colorTrace(page: Page) {
  return page.evaluate(() => new Promise<{ changes: string[]; owners: { property: string; start: number; duration: number; delay: number }[]; tail: string[]; scrollDelta: number }>((resolve) => {
    const originalY = scrollY;
    const changes = new Set<string>();
    const owners = new Map<string, { property: string; start: number; duration: number; delay: number }>();
    let start = 0;
    const observer = new MutationObserver(() => {
      if (document.documentElement.dataset.themeChanging) {
        observer.disconnect(); start = performance.now(); requestAnimationFrame(frame);
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme-changing"] });
    function frame() {
      const root = document.documentElement;
      changes.add(getComputedStyle(document.body).backgroundColor);
      const targets = [root, ...document.querySelectorAll(':is(section,div):has(> [data-marketing-background])')];
      targets.forEach((target, index) => target.getAnimations().forEach((animation) => {
        if (!(animation instanceof CSSTransition) || !animation.transitionProperty.startsWith("--")) return;
        const timing = animation.effect?.getTiming();
        if (typeof animation.startTime === "number" && timing) owners.set(`${index}:${animation.transitionProperty}`, { property: animation.transitionProperty, start: animation.startTime, duration: Number(timing.duration), delay: timing.delay ?? 0 });
      }));
      if (performance.now() - start < 650) requestAnimationFrame(frame);
      else resolve({ changes: [...changes], owners: [...owners.values()], tail: document.getAnimations().filter((animation) => animation instanceof CSSTransition && /^(--|color|background-color|border-color|fill|stroke|filter)/.test(animation.transitionProperty)).map((animation) => (animation as CSSTransition).transitionProperty), scrollDelta: Math.abs(scrollY - originalY) });
    }
  }));
}

for (const width of [390, 1440]) test(`five public footers bleed to viewport and theme colors share one clock at ${width}px`, async ({ page }, info) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => localStorage.setItem("vircuit-theme", "light"));
  const samples = [];
  for (const route of routes) {
    await page.goto(route);
    const mark = page.locator("footer > .footer-wordmark");
    await expect(mark).toHaveAttribute("aria-hidden", "true");
    const bounds = await mark.boundingBox();
    expect(bounds?.x).toBe(0); expect(bounds?.width).toBe(width);
    expect(await mark.evaluate((element) => getComputedStyle(element).maskImage)).toContain("logo-teks.webp");
    expect(await mark.locator("img,button,a").count()).toBe(0);
    await page.evaluate(() => window.scrollTo(0, 800));
    // Finish existing scroll/scene entrances before isolating the theme swap.
    await page.waitForTimeout(1000);
    for (const name of ["Gelap", "Terang"] as const) {
      const promise = colorTrace(page);
      await chooseTheme(page, name);
      const result = await promise;
      console.log("THEME_PALETTE_SAMPLE", JSON.stringify({ width, route, name, changes: result.changes.length, owners: result.owners.length, tail: result.tail, scroll: result.scrollDelta }));
      if (result.tail.length) console.log("THEME_TAIL_DETAILS", JSON.stringify(await page.evaluate(() => document.getAnimations().filter((animation) => animation instanceof CSSTransition).map((animation) => ({ property: (animation as CSSTransition).transitionProperty, elapsed: animation.currentTime, duration: animation.effect?.getTiming().duration, target: ((animation.effect as KeyframeEffect | null)?.target as Element | null)?.outerHTML.slice(0, 160) })))));
      expect(result.changes.length).toBeGreaterThan(2);
      expect(result.owners.some((owner) => owner.property === "--background")).toBe(true);
      expect(result.owners.every((owner) => owner.duration === 300 && owner.delay === 0)).toBe(true);
      expect(Math.max(...result.owners.map((owner) => owner.start)) - Math.min(...result.owners.map((owner) => owner.start))).toBeLessThan(35);
      expect(result.tail).toEqual([]);
      expect(result.scrollDelta).toBeLessThanOrEqual(2);
      expect(await mark.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(name === "Gelap" ? "rgb(245, 247, 250)" : "rgb(10, 10, 10)");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      samples.push({ route, theme: name, ...result });
    }
    await mark.scrollIntoViewIfNeeded();
    const back = page.getByRole("button", { name: "Kembali ke atas halaman" });
    await expect(back).toHaveAttribute("data-footer-wordmark", "true");
    await expect.poll(async () => { const button = (await back.boundingBox())!; return button.y + button.height - (await mark.boundingBox())!.y; }).toBeLessThanOrEqual(-8);
    await page.screenshot({ path: info.outputPath(`footer-${route.slice(1) || "home"}.png`) });
  }
  await page.getByRole("button", { name: "Kembali ke atas halaman" }).click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await info.attach("synchronized-colors.json", { body: JSON.stringify(samples), contentType: "application/json" });
});

test("wordmark remains edge-to-edge at all target widths and without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    for (const width of [360, 390, 430, 768, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/harga");
      const box = await page.locator(".footer-wordmark").boundingBox();
      expect(box?.x).toBe(0); expect(box?.width).toBe(width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
  } finally { await context.close(); }
});

test("dashboard theme, account preference, system updates and reduced motion use the shared owner", async ({ page, request }) => {
  await request.post(`${provider}/__fixture/reset`, { data: { count: 3 } });
  await page.addInitScript(() => localStorage.setItem("vircuit-theme", "light"));
  await page.goto("/masuk");
  await page.getByLabel("Email", { exact: true }).fill("dashboard@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  await expect(page.locator("#dashboard-main h1")).toContainText("Halo, Astra");
  await expect(page.locator("[data-auth-door]")).toHaveCount(0);
  const promise = colorTrace(page);
  await chooseTheme(page, "Gelap");
  const result = await promise;
  expect(result.changes.length).toBeGreaterThan(2);
  expect(result.tail).toEqual([]);
  expect(result.owners.every((owner) => owner.duration === 300)).toBe(true);
  await page.getByRole("navigation", { name: "Navigasi dashboard" }).getByRole("link", { name: "Pengaturan", exact: true }).click();
  await page.getByRole("tab", { name: /Tampilan/ }).click();
  await page.getByRole("group", { name: "Tema aplikasi" }).getByRole("radio", { name: "Terang", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/light/);
  await expect(page.locator("html")).not.toHaveAttribute("data-theme-changing");
  await chooseTheme(page, "Sistem");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme-changing");
  const system = colorTrace(page);
  await page.emulateMedia({ colorScheme: "dark" });
  expect((await system).changes.length).toBeGreaterThan(2);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await chooseTheme(page, "Terang");
  await expect(page.locator("html")).toHaveClass(/light/);
  await expect(page.locator("html")).not.toHaveAttribute("data-theme-changing");
  expect(await page.evaluate(() => document.documentElement.getAnimations().filter((animation) => animation instanceof CSSTransition && animation.transitionProperty.startsWith("--")).length)).toBe(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await chooseTheme(page, "Gelap");
  // Reverse the in-flight theme through Settings without reopening a Radix
  // menu while its close animation is still removing the old portal.
  await page.getByRole("group", { name: "Tema aplikasi" }).getByRole("radio", { name: "Terang", exact: true }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme-changing");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(247, 249, 252)");
});
