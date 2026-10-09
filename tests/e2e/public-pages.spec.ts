import { test, expect } from "@playwright/test";
import { motionDefinition } from "../../components/marketing/scenes/public-motion-manifest";
const routes = ["fitur", "belajar", "jelajahi", "harga"];
for (const route of routes) {
  test(`${route}: visible SSR, lower content motion and coverage`, async ({ page }, testInfo) => {
    const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${route}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(`[data-public-route='/${route}']`)).toHaveAttribute("data-motion-ready", "ready");
    await expect(page.locator("html")).toHaveAttribute("data-home-scroll", "lenis");
    const groups = page.locator(`[data-public-route='/${route}'] [data-motion-group]`);
    const count = await groups.count(); expect(count).toBeGreaterThanOrEqual({ fitur: 58, belajar: 76, jelajahi: 68, harga: 58 }[route]!);
    const inventory = await groups.evaluateAll((items) => items.map((item) => ({ id: (item as HTMLElement).dataset.motionGroup!, treatment: (item as HTMLElement).dataset.motion })));
    expect(new Set(inventory.map((item) => item.id)).size).toBe(count);
    expect(inventory.every((item) => item.treatment && ["text", "identity", "details", "actions", "art", "control", "static"].includes(item.treatment))).toBe(true);
    expect(inventory.filter((item) => motionDefinition(`/${route}`, item.id)?.treatment !== item.treatment)).toEqual([]);
    const ungrouped = await page.locator(`[data-public-route='/${route}']`).evaluate((root) => Array.from(root.querySelectorAll("h1,h2,h3,p,li,dt,dd,figcaption,summary,button,a")).filter((item) => item.getBoundingClientRect().width > 0 && !item.closest("[data-motion-group]")).map((item) => item.textContent?.trim()));
    expect(ungrouped).toEqual([]);
    for (let y = 0; y < await page.evaluate(() => document.documentElement.scrollHeight); y += 600) {
      await page.evaluate((value) => scrollTo(0, value), y); await page.waitForTimeout(140);
    }
    await page.waitForTimeout(700);
    const pending = await groups.evaluateAll((items) => items.filter((item) => {
      const visible = (item as HTMLElement).getBoundingClientRect().width > 0;
      return visible && !(item as HTMLElement).dataset.motionState;
    }).map((item) => (item as HTMLElement).dataset.motionGroup));
    expect(pending).toEqual([]);
    await expect.poll(() => groups.evaluateAll((items) => items.filter((item) => item.getBoundingClientRect().width > 0 && (item as HTMLElement).dataset.motionState === "active").length)).toBe(0);
    await expect(page.getByRole("button", { name: "Kembali ke atas halaman" })).toBeVisible();
    await expect(page.locator("footer").getByRole("link", { name: "Kembali ke atas", exact: true })).toHaveCount(0);
    await expect(page.locator("canvas")).toHaveCount(0);
    expect(errors).toEqual([]);
    const modes = await groups.evaluateAll((items) => items.reduce((counts, item) => {
      const mode = (item as HTMLElement).dataset.motionMode ?? "responsive-hidden";
      counts[mode] = (counts[mode] ?? 0) + 1; return counts;
    }, {} as Record<string, number>));
    await testInfo.attach(`coverage-${route}`, { body: JSON.stringify({ route, count, inventory, modes }, null, 2), contentType: "application/json" });
    console.log(JSON.stringify({ route, groups: count, modes }));
  });
}
test("roadmap, gallery, access comparison and disclosures have real state", async ({ page }, testInfo) => {
  await page.goto("/belajar");
  await page.getByRole("button", { name: "Mini Project: Traffic Light", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Mini Project: Traffic Light", exact: true })).toBeVisible();
  await page.goto("/jelajahi");
  await page.getByRole("button", { name: "Lanjutan", exact: true }).click();
  await expect(page.locator("[data-project]:visible")).toHaveCount(3);
  await page.getByRole("button", { name: "Lihat detail IoT Egg Incubator" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("Belum tersedia sebagai template");
  await expect(page.locator("[data-public-route='project-detail']")).toHaveAttribute("data-motion-ready", "ready");
  const detailGroups = await page.getByRole("dialog").locator("[data-motion-group]").evaluateAll((items) => items.map((item) => ({ id: (item as HTMLElement).dataset.motionGroup!, treatment: (item as HTMLElement).dataset.motion })));
  expect(detailGroups).toHaveLength(6);
  for (const group of detailGroups) expect(motionDefinition("project-detail", group.id)?.treatment).toBe(group.treatment);
  await testInfo.attach("detail-coverage", { body: JSON.stringify(detailGroups), contentType: "application/json" });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Lihat detail IoT Egg Incubator" })).toBeFocused();
  await page.goto("/harga");
  await page.getByRole("button", { name: "AI", exact: true }).click();
  await expect(page.locator("[data-active='true']")).toHaveCount(1);
  await page.getByText("Berapa biaya langganan Premium?", { exact: true }).click();
  await expect(page.locator("details[open]")).toContainText("belum ditentukan");
});
test("illustration has intermediate drawing and assembled states", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/fitur");
  await expect(page.locator("[data-public-route='/fitur']")).toHaveAttribute("data-motion-ready", "ready");
  const samples = await page.locator("[data-motion-group='fitur.hero.art']").evaluate((figure) => new Promise<Array<{ offset: number; opacity: number }>>((resolve) => {
    const result: Array<{ offset: number; opacity: number }> = []; const start = performance.now();
    const sample = () => { result.push({ offset: parseFloat(getComputedStyle(figure.querySelector("[data-trace]")!).strokeDashoffset), opacity: Number(getComputedStyle(figure).opacity) }); if (performance.now() - start < 2200) requestAnimationFrame(sample); else resolve(result); }; sample();
  }));
  expect(samples.some((sample) => sample.offset > 1)).toBe(true);
  expect(samples.at(-1)!.offset).toBe(0);
  expect(samples.at(-1)!.opacity).toBe(1);
  await testInfo.attach("illustration-timed-samples", { body: JSON.stringify(samples), contentType: "application/json" });
});
for (const width of [360, 390, 430, 768, 1280, 1440]) test(`all public routes responsive and themed at ${width}`, async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width, height: 900 });
  for (const route of routes) {
    await page.goto(`/${route}`);
    await expect(page.locator("html")).toHaveAttribute("data-home-scroll", width < 1024 ? "native" : "lenis");
    for (const theme of ["light", "dark", "system"]) {
      await page.emulateMedia({ colorScheme: "dark" });
      if (width < 1024) await page.getByRole("button", { name: "Buka menu navigasi" }).click();
      await page.getByRole("button", { name: /^Pilih tema:/ }).click();
      await page.getByRole("menuitemradio", { name: ({ light: "Terang", dark: "Gelap", system: "Sistem" })[theme]! }).click();
      await expect(page.getByRole("menu")).not.toBeVisible();
      if (width < 1024) { await page.keyboard.press("Escape"); await expect(page.getByRole("dialog")).not.toBeVisible(); }
      if (theme === "light") await expect(page.locator("html")).not.toHaveClass(/dark/);
      else await expect(page.locator("html")).toHaveClass(/dark/);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `test-results/public-${route}-${width}-${theme}.png` });
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator(`[data-public-route='/${route}']`)).toHaveAttribute("data-motion-ready", "reduced");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.locator("footer").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `test-results/public-${route}-${width}-footer.png` });
  }
});
test("card choreography, reversible story and shared controls stay scoped", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/fitur");
  const root = page.locator("[data-stage]").first();
  await page.locator("[data-stage-narrative]").scrollIntoViewIfNeeded();
  await expect(root).toHaveAttribute("data-stage", /[0-5]/);
  const seek = async (stage: string) => { await page.locator(`#stage-${stage}`).evaluate((item) => scrollTo(0, item.getBoundingClientRect().top + scrollY - 100)); await page.waitForTimeout(300); };
  await seek("Learn"); const later = Number(await root.getAttribute("data-stage"));
  await seek("Build"); expect(Number(await root.getAttribute("data-stage"))).toBeLessThan(later);
  const card = page.locator("#virtual-laboratory");
  await card.evaluate((item) => scrollTo(0, item.getBoundingClientRect().top + scrollY - innerHeight + 150));
  await expect(card.locator("[data-motion-group]").first()).toHaveAttribute("data-motion-state", /active|complete/);
  await expect(card.locator("[data-motion-group]").last()).toHaveAttribute("data-motion-mode", "sequence");
  await page.waitForTimeout(1200);
  await expect(card.locator("[data-motion-group]").last()).toHaveAttribute("data-motion-state", "complete");
  const originalHeight = await page.locator("header").evaluate((item) => (item as HTMLElement).offsetHeight);
  for (const route of ["Belajar", "Jelajahi", "Harga", "Fitur", "Belajar", "Fitur"]) {
    await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: route, exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-home-scroll", "lenis");
    await expect(page.locator("main [data-public-route]")).toHaveCount(1);
    await expect(page.locator("[data-motion-owner='footer']")).toHaveCount(1);
    expect(await page.locator("header").evaluate((item) => (item as HTMLElement).offsetHeight)).toBe(originalHeight);
  }
  const shared = new Set<string>();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    if (width === 390) await page.getByRole("button", { name: "Buka menu navigasi" }).click();
    const groups = await page.locator("header [data-motion-group], [data-motion-group='nav.sheet'], footer [data-motion-group], [data-motion-group='shared.back-top']").evaluateAll((items) => items.map((item) => ({ id: (item as HTMLElement).dataset.motionGroup!, treatment: (item as HTMLElement).dataset.motion })));
    for (const group of groups) { shared.add(group.id); expect(motionDefinition(group.id.startsWith("footer.") ? "footer" : "controls", group.id)?.treatment).toBe(group.treatment); }
    if (width === 390) { await page.keyboard.press("Escape"); await expect(page.getByRole("dialog")).not.toBeVisible(); }
  }
  await testInfo.attach("shared-coverage", { body: JSON.stringify({ count: shared.size, ids: [...shared] }, null, 2), contentType: "application/json" });
  console.log(JSON.stringify({ sharedGroups: shared.size }));
  await page.goto("/masuk");
  await expect(page.locator("html")).toHaveAttribute("data-home-scroll", "native");
  await expect(page.locator("[data-motion-group='shared.back-top']")).toHaveCount(0);
});
test("public content and FAQ remain available without JS", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false }); const page = await context.newPage();
  for (const route of routes) { await page.goto(`/${route}`); await expect(page.getByRole("heading", { level: 1 })).toBeVisible(); await expect(page.getByRole("link", { name: /Coba Simulator|Mulai Gratis Sekarang/ }).first()).toBeVisible(); }
  await page.locator("summary").first().click(); await expect(page.locator("details[open] p")).toBeVisible(); await context.close();
});
test("failed public timeline import keeps readable content and usable FAQ", async ({ page }) => {
  await page.route("**/_next/static/chunks/*.js", async (route) => {
    const response = await route.fetch();
    const source = (await response.body()).toString();
    if (source.includes("motionMapped")) await route.abort();
    else await route.fulfill({ response });
  });
  await page.goto("/harga");
  await expect(page.locator("[data-public-route='/harga']")).toHaveAttribute("data-motion-ready", "fallback");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByText("Berapa biaya langganan Premium?", { exact: true }).click();
  await expect(page.locator("details[open] p")).toBeVisible();
  await page.unrouteAll({ behavior: "wait" });
});
