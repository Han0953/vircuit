import { expect, test, type Page } from "@playwright/test";

async function trackIntro(page: Page) {
  await expect(page.getByRole("button", { name: /^Pilih tema:/ }).filter({ visible: true }).first()).toBeEnabled();
  await page.evaluate(() => {
    const view = window as typeof window & { heroIntroTrace: { first: Record<string, number>; completed: number }[] };
    view.heroIntroTrace = [];
    const seen = new WeakSet<Element>();
    const observer = new MutationObserver(() => {
      const section = document.querySelector<HTMLElement>("[data-home-zone='hero'][data-hero-intro='playing']");
      if (!section || seen.has(section)) return;
      seen.add(section);
      const trace = { first: {} as Record<string, number>, completed: 0 };
      view.heroIntroTrace.push(trace);
      const start = performance.now();
      const targets = {
        eyebrow: section.querySelector("[data-hero-eyebrow]"),
        word0: section.querySelectorAll("[data-hero-title-word]")[0],
        word5: section.querySelectorAll("[data-hero-title-word]")[5],
        description: section.querySelector("[data-hero-description]"),
        action0: section.querySelectorAll("[data-hero-action]")[0],
        action1: section.querySelectorAll("[data-hero-action]")[1],
        note: section.querySelector("[data-hero-note]"),
      };
      const sample = () => {
        for (const [name, element] of Object.entries(targets)) {
          if (element && trace.first[name] === undefined && Number(getComputedStyle(element).opacity) > .15) trace.first[name] = performance.now() - start;
        }
        if (section.dataset.heroIntro === "complete") trace.completed = performance.now() - start;
        else if (section.isConnected) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    observer.observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-hero-intro"] });
  });
}

for (const width of [360, 390, 430, 1440]) test(`GSAP hero entry is staggered and replays on navigation at ${width}`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: width === 360 ? 640 : 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/fitur");
  await trackIntro(page);
  await page.getByRole("banner").getByRole("link", { name: "Vircuit — Beranda", exact: true }).click();
  const section = page.locator("[data-home-zone='hero']");
  await expect(section).toHaveAttribute("data-hero-intro", "playing");
  await expect(section).toHaveAttribute("data-hero-intro", "complete");
  await expect.poll(() => page.evaluate(() => (window as typeof window & { heroIntroTrace: { completed: number }[] }).heroIntroTrace[0]?.completed ?? 0)).toBeGreaterThan(0);
  const trace = await page.evaluate(() => (window as typeof window & { heroIntroTrace: { first: Record<string, number>; completed: number }[] }).heroIntroTrace[0]);
  for (const name of ["eyebrow", "word0", "word5", "description", "action0", "action1", "note"]) expect(trace.first[name]).toBeDefined();
  expect(trace.first.word0).toBeGreaterThanOrEqual(trace.first.eyebrow);
  expect(trace.first.word5).toBeGreaterThan(trace.first.word0);
  expect(trace.first.action0).toBeGreaterThan(trace.first.description);
  expect(trace.first.action1).toBeGreaterThan(trace.first.action0);
  expect(trace.first.note).toBeGreaterThan(trace.first.action1);
  expect(trace.completed).toBeGreaterThan(1200);
  expect(trace.completed).toBeLessThan(2800);
  await info.attach("entry-sequence", { body: JSON.stringify(trace), contentType: "application/json" });
  await expect(section.getByRole("heading", { level: 1 })).toHaveText("Belajar IoT dengan membangunnya secara langsung.");
  await expect(section.locator("canvas")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  for (const target of await section.locator("[data-hero-title-word],[data-hero-action],[data-hero-note]").all()) {
    await expect(target).toHaveCSS("opacity", "1");
    await expect(target).toHaveCSS("transform", "none");
  }
  await section.screenshot({ path: info.outputPath(`hero-entry-${width}.png`) });
  if (width < 1024) {
    await page.getByRole("button", { name: "Buka menu navigasi", exact: true }).click();
    await page.getByRole("navigation", { name: "Navigasi mobile", exact: true }).getByRole("link", { name: "Fitur", exact: true }).click();
  } else {
    await page.getByRole("navigation", { name: "Navigasi utama", exact: true }).getByRole("link", { name: "Fitur", exact: true }).click();
  }
  await expect(page).toHaveURL(/\/fitur$/);
  await page.getByRole("banner").getByRole("link", { name: "Vircuit — Beranda", exact: true }).click();
  await expect(section).toHaveAttribute("data-hero-intro", "playing");
  await expect(section).toHaveAttribute("data-hero-intro", "complete");
});

test("leaving during the hero intro restores persistent navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator("[data-home-zone='hero']")).toHaveAttribute("data-hero-intro", "playing");
  await page.getByRole("navigation", { name: "Navigasi utama", exact: true }).getByRole("link", { name: "Fitur", exact: true }).click();
  await expect(page).toHaveURL(/\/fitur$/);
  for (const item of await page.locator("[data-home-header] [data-motion-group]").all()) {
    if (!(await item.isVisible())) continue;
    await expect(item).toHaveCSS("opacity", "1");
    await expect(item).toHaveCSS("transform", "none");
  }
});

test("reduced motion shows the finished hero without an entry timeline", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const section = page.locator("[data-home-zone='hero']");
  await expect(section).toHaveAttribute("data-hero-intro", "reduced");
  await expect(page.locator("[data-hero-2d]")).toHaveAttribute("data-hero-paused", "true");
  for (const item of await section.locator("[data-hero-title-word],[data-hero-action],[data-hero-note]").all()) await expect(item).toHaveCSS("opacity", "1");
});

test("keyboard focus finishes the intro without hiding controls", async ({ page }) => {
  await page.goto("/");
  const section = page.locator("[data-home-zone='hero']");
  await expect(section).toHaveAttribute("data-hero-intro", "playing");
  await page.keyboard.press("Tab");
  await expect(section).toHaveAttribute("data-hero-intro", "complete");
  await expect(section.locator("[data-hero-action]").first()).toHaveCSS("opacity", "1");
});

test("mobile menu accepts the first click during the intro", async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 800 });
  for (let visit = 0; visit < 5; visit++) {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Buka menu navigasi", exact: true });
    await trigger.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  }
});
