import { expect, test } from "@playwright/test";

for (const width of [360, 390, 430, 768, 1440]) test(`marketing capsule and animated mobile menu at ${width}px`, async ({ page }, info) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width, height: 900 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem("vircuit-theme", "light"));
  for (const route of ["/", "/fitur"]) {
    await page.goto(route);
    await page.emulateMedia({ colorScheme: "dark" });
    const header = page.locator("[data-home-header]");
    for (const theme of ["Gelap", "Terang", "Sistem"]) {
      const trigger = header.getByRole("button", { name: /Pilih tema/ });
      await expect(trigger).toBeEnabled();
      await trigger.press("Enter");
      await expect(page.getByRole("menu")).toBeVisible();
      await page.getByRole("menuitemradio", { name: theme, exact: true }).click();
      await expect(page.locator("html")).not.toHaveAttribute("data-theme-changing");
      if (width >= 1024) {
        await expect.poll(async () => header.getByRole("navigation", { name: "Navigasi utama" }).evaluate((nav) => {
          const button = document.querySelector<HTMLElement>('[data-motion-group="nav.theme"] button')!;
          return getComputedStyle(nav).backgroundColor === getComputedStyle(button).backgroundColor;
        })).toBe(true);
      } else {
        const hamburger = header.getByRole("button", { name: "Buka menu navigasi" });
        await expect(hamburger.locator("[data-open] > span")).toHaveCount(3);
        const before = await page.evaluate(() => scrollY);
        await hamburger.click();
        const menu = page.getByRole("dialog");
        await expect(menu).toBeVisible();
        await expect(menu).toHaveCSS("backdrop-filter", "blur(4px)");
        await expect(menu.locator("[data-open]")).toHaveAttribute("data-open", "true");
        const lab = menu.getByRole("link", { name: "Buka Virtual Lab", exact: true });
        const login = menu.getByRole("link", { name: "Masuk", exact: true });
        await expect(lab).toBeVisible();
        expect((await lab.boundingBox())!.y).toBeLessThan((await login.boundingBox())!.y);
        await expect(page.locator("body")).toHaveAttribute("data-scroll-locked");
        await page.keyboard.press("Escape");
        await expect(menu).toBeHidden();
        await expect(hamburger).toBeFocused();
        expect(await page.evaluate(() => scrollY)).toBe(before);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
  }
  if (width < 1024) {
    await page.getByRole("button", { name: "Buka menu navigasi" }).click();
    const menu = page.getByRole("dialog");
    await expect.poll(() => menu.evaluate((element) => Math.round(element.getBoundingClientRect().x))).toBe(0);
    await page.screenshot({ path: info.outputPath(`menu-${width}.png`) });
    await menu.getByRole("button", { name: "Tutup", exact: true }).click();
    await expect(menu).toBeHidden();
    await expect(page.locator('[data-motion-group="nav.menu"] [data-open]')).toHaveAttribute("data-open", "false");
  } else await page.screenshot({ path: info.outputPath("capsule-desktop.png") });
  expect(errors).toEqual([]);
});

test("reduced motion keeps mobile controls and page content immediately available", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/belajar");
  await expect(page.locator('[data-public-route="/belajar"]')).toHaveAttribute("data-motion-ready", "reduced");
  await expect(page.locator("h1")).toBeVisible();
  await page.getByRole("button", { name: "Buka menu navigasi" }).click();
  const menu = page.getByRole("dialog");
  await expect(menu).toHaveCSS("animation-name", "none");
  expect(await menu.locator("[data-open] > span").first().evaluate((element) => parseFloat(getComputedStyle(element).transitionDuration))).toBeLessThanOrEqual(.001);
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
});

test("mobile scroll frame measurements on the five marketing pages", async ({ page }, info) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 390, height: 844 });
  const session = await page.context().newCDPSession(page);
  await session.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const reports = [];
  for (const route of ["/", "/fitur", "/belajar", "/jelajahi", "/harga"]) {
    await page.goto(route);
    await expect(page.locator("[data-home-motion], [data-motion-ready]").first()).toBeAttached();
    const frames = await page.evaluate(() => new Promise<number[]>((resolve) => {
      const times: number[] = [];
      let previous = performance.now();
      const start = previous;
      function sample(now: number) {
        times.push(now - previous); previous = now;
        scrollTo(0, Math.min(2400, (now - start) * 1.2));
        if (now - start < 2000) requestAnimationFrame(sample); else resolve(times.slice(1));
      }
      requestAnimationFrame(sample);
    }));
    const sorted = [...frames].sort((a, b) => a - b);
    reports.push({ route, frames: frames.length, p95: sorted[Math.floor(sorted.length * .95)], max: Math.max(...frames), over50ms: frames.filter((value) => value > 50).length });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await expect(page.locator("html")).toHaveAttribute("data-home-scroll", "native");
  }
  console.log("MARKETING_MOBILE_FRAMES", JSON.stringify(reports));
  await info.attach("mobile-scroll-frames.json", { body: JSON.stringify({ profile: "Local production, 390px viewport, 4x CPU, synthetic scroll; not a physical phone", reports }), contentType: "application/json" });
  await session.detach();
});
