import { expect, test, type Page } from "@playwright/test";
import { backgroundScenes } from "../../components/marketing/backgrounds/background-scenes";

const routes = ["/", "/fitur", "/belajar", "/jelajahi", "/harga"];
const counts = [10, 8, 6, 8, 5];
async function theme(page: Page, value: "Terang" | "Gelap" | "Sistem", mobile: boolean) {
  await page.getByRole("button", { name: /^Pilih tema:/ }).click();
  await page.getByRole("menuitemradio", { name: value }).click();
  if (mobile) await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
}

for (const width of [360, 390, 430, 768, 1280, 1440]) test(`five routes: backgrounds, theme polarity and overflow at ${width}`, async ({ page }, testInfo) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
  await page.addInitScript(() => localStorage.setItem("vircuit-theme", "light"));
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  for (const [index, route] of routes.entries()) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const backdrops = page.locator("[data-marketing-background]");
    await expect(backdrops).toHaveCount(counts[index]);
    const inventory = await backdrops.evaluateAll((items) => items.map((item) => ({ scene: item.getAttribute("data-marketing-background"), pointer: getComputedStyle(item).pointerEvents, hidden: item.getAttribute("aria-hidden"), position: getComputedStyle(item).position })));
    expect(inventory.every((item) => item.pointer === "none" && item.hidden === "true" && item.position === "absolute")).toBe(true);
    expect(new Set(inventory.map((item) => item.scene)).size).toBe(counts[index]);
    expect(await page.locator("[data-bg-sweep]").evaluateAll((items) => items.every((item) => getComputedStyle(item).height === "1px" && getComputedStyle(item).paddingTop === "0px"))).toBe(true);
    const inverse = page.locator(":is(section,div):has(> [data-bg-tone='inverse'])").first();
    const sample = () => inverse.evaluate((element) => {
      const style = getComputedStyle(element);
      return { bg: style.backgroundColor, fg: style.color, surface: style.getPropertyValue("--surface").trim(), pattern: style.getPropertyValue("--section-pattern").trim() };
    });
    await theme(page, "Terang", width < 1024);
    await expect.poll(async () => (await sample()).bg).toBe("rgb(8, 20, 38)");
    const light = await sample();
    expect(light.bg).toBe("rgb(8, 20, 38)");
    expect(light.fg).toBe("rgb(245, 247, 250)");
    await page.screenshot({ path: `test-results/background-${route.slice(1) || "home"}-${width}-light.png` });
    await inverse.evaluate((element) => scrollTo(0, element.getBoundingClientRect().top + scrollY - 100));
    await theme(page, "Gelap", width < 1024);
    await expect.poll(async () => (await sample()).bg).toBe("rgb(237, 244, 255)");
    const dark = await sample();
    expect(dark.bg).toBe("rgb(237, 244, 255)");
    expect(dark.fg).toBe("rgb(10, 10, 10)");
    expect(dark.surface).not.toBe(light.surface);
    expect(dark.pattern).not.toBe(light.pattern);
    await inverse.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1800); // Capture completed foreground entrances, not a partial reveal.
    await page.screenshot({ path: `test-results/background-${route.slice(1) || "home"}-${width}-inverted.png` });
    await theme(page, "Sistem", width < 1024);
    await page.emulateMedia({ colorScheme: "light" });
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await expect.poll(async () => (await sample()).bg).toBe(light.bg);
    await page.emulateMedia({ colorScheme: "dark" });
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect.poll(async () => (await sample()).bg).toBe(dark.bg);
    const overflow = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
      outside: Array.from(document.querySelectorAll("body *")).filter((element) => !element.closest("[data-marketing-background]"))
        .map((element) => ({ tag: element.tagName, cls: element.getAttribute("class"), right: element.getBoundingClientRect().right }))
        .filter((item) => item.right > innerWidth + 1).slice(0, 12) }));
    expect(overflow.scrollWidth, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.width + 1);
    const semanticContrast = await backdrops.evaluateAll((items) => {
      const luminance = (rgb: string) => {
        const values = (rgb.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number).map((v) => { const c = v / 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; });
        return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
      };
      return items.map((item) => {
        const parent = item.parentElement!; const style = getComputedStyle(parent);
        const bg = luminance(style.backgroundColor); const fg = luminance(style.color);
        const paragraph = parent.querySelector("p"); const muted = luminance(paragraph ? getComputedStyle(paragraph).color : style.color);
        const contrast = (a: number, b: number) => (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
        return { scene: item.getAttribute("data-marketing-background"), contrast: contrast(bg, fg), muted: contrast(bg, muted) };
      });
    });
    expect(semanticContrast.filter((item) => item.contrast < 4.5 || item.muted < 4.5)).toEqual([]);
    await testInfo.attach(`${route}-contrast`, { body: JSON.stringify(semanticContrast), contentType: "application/json" });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect.poll(() => page.locator("[data-bg-path]").evaluateAll((paths) => paths.every((path) => Number.parseFloat(getComputedStyle(path).strokeDashoffset) === 0))).toBe(true);
    await expect.poll(() => page.locator("[data-bg-drift]").evaluateAll((items) => items.every((item) => getComputedStyle(item).transform === "none"))).toBe(true);
    await page.emulateMedia({ reducedMotion: "no-preference" });
  }
  expect(errors).toEqual([]);
});

test("signature artwork scrubs forward and reverse, and story owners remain unique", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const [route, scene] of [["/", "home-challenge"], ["/fitur", "features-story"], ["/belajar", "learn-roadmap"], ["/jelajahi", "explore-capstone"], ["/harga", "pricing-comparison"]]) {
    await page.goto(route);
    const background = page.locator(`[data-marketing-background='${scene}']`);
    const section = background.locator("..");
    const path = background.locator("[data-bg-path]").first();
    const seek = async (fraction: number) => {
      await section.evaluate((element, value) => scrollTo(0, element.getBoundingClientRect().top + scrollY + element.getBoundingClientRect().height * value - innerHeight * .8), fraction);
      await page.waitForTimeout(850);
      return Number.parseFloat(await path.evaluate((element) => getComputedStyle(element).strokeDashoffset));
    };
    await seek(0); const before = await seek(.05); const after = await seek(.8); const reversed = await seek(.05);
    expect(after).toBeLessThan(before);
    expect(reversed).toBeGreaterThan(after);
    if (route === "/fitur") {
      await expect(page.locator("[data-feature-visual]")).toHaveCSS("position", "sticky");
      await expect(page.locator("canvas")).toHaveCount(0);
    }
  }
});

test("static server artwork is complete with JavaScript disabled on all five routes", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  for (const [index, route] of routes.entries()) {
    await page.goto(route);
    await expect(page.locator("[data-marketing-background]")).toHaveCount(counts[index]);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.locator("[data-bg-path]").evaluateAll((items) => items.every((item) => getComputedStyle(item).strokeDashoffset === "0px"))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  await context.close();
});

test("all authored scenes are present across actual routes", async ({ page }) => {
  const scenes = new Set<string>();
  for (const route of routes) { await page.goto(route); (await page.locator("[data-marketing-background]").evaluateAll((items) => items.map((item) => item.getAttribute("data-marketing-background")!))).forEach((scene) => scenes.add(scene)); }
  expect([...scenes].sort()).toEqual(Object.keys(backgroundScenes).sort());
});

test("gallery accents follow the real filter in Light and Dark", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/jelajahi");
  for (const value of ["Terang", "Gelap"] as const) {
    await theme(page, value, false);
    await page.getByRole("button", { name: "Semua", exact: true }).click();
    await page.waitForTimeout(350); // Finish the existing 280ms color transition before sampling.
    const glow = () => page.locator("[data-gallery-filter]").evaluate((element) => getComputedStyle(element).getPropertyValue("--section-glow"));
    const before = await glow();
    await page.getByRole("button", { name: "Lanjutan", exact: true }).click();
    await expect(page.locator("[data-project]:visible")).toHaveCount(3);
    await expect.poll(glow).not.toBe(before);
  }
});

test("feature stage illumination follows existing controls in Light and Dark", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/fitur");
  const stage = page.locator("[data-motion-section='features-story']");
  const glow = () => stage.evaluate((element) => getComputedStyle(element).getPropertyValue("--section-glow"));
  for (const value of ["Terang", "Gelap"] as const) {
    await theme(page, value, false);
    await page.getByRole("button", { name: "Build", exact: true }).click();
    await expect(stage.locator("[data-stage]")).toHaveAttribute("data-stage", "0");
    await page.waitForTimeout(350);
    const before = await glow();
    await page.getByRole("button", { name: "Learn", exact: true }).click();
    await expect(stage.locator("[data-stage]")).toHaveAttribute("data-stage", "5");
    await expect.poll(glow).not.toBe(before);
  }
});
