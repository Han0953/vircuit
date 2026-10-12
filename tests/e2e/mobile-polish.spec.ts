import { expect, test } from "@playwright/test";

test("3D stages stay viewport bounded in portrait and landscape with readable DOM labels", async ({ page }) => {
  test.setTimeout(60000);
  for (const [width, height] of [[360, 900], [390, 844], [430, 900], [768, 900], [1280, 900], [1440, 900], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    for (const selector of ["[data-stage]", "[data-board-stage]"]) {
      const stage = page.locator(selector);
      await stage.scrollIntoViewIfNeeded();
      const bounds = (await stage.boundingBox())!;
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1);
      if (width < 1024) expect(bounds.height).toBeLessThanOrEqual(height - 64);
      await expect(stage.locator("header,figcaption").first()).toBeVisible();
      expect(await page.locator("canvas").count()).toBeLessThanOrEqual(1);
    }
  }
});

for (const width of [360, 390, 430, 768, 1280, 1440]) {
  test(`marketing header and fullscreen navigation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/fitur", "/belajar", "/jelajahi", "/harga"]) {
      await page.goto(route);
      const header = page.locator("[data-home-header]");
      await expect(header).toHaveAttribute("data-scrolled", "false");
      await expect(header).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      const height = (await header.boundingBox())!.height;
      await page.evaluate(() => scrollTo(0, 200));
      await expect(header).toHaveAttribute("data-scrolled", "true");
      expect((await header.boundingBox())!.height).toBe(height);
      await page.evaluate(() => scrollTo(0, 0));
      await expect(header).toHaveAttribute("data-scrolled", "false");
      if (width < 1024) {
        await expect(header.getByRole("link", { name: "Buka Virtual Lab", exact: true })).toHaveCount(0);
        await expect(header.getByRole("button", { name: /Pilih tema/ })).toBeVisible();
        await page.getByRole("button", { name: "Buka menu navigasi" }).click();
        const menu = page.getByRole("dialog");
        await expect(menu).toBeVisible();
        await expect(menu.getByRole("link", { name: "Buka Virtual Lab", exact: true })).toHaveCount(0);
        await expect.poll(async () => Math.round((await menu.boundingBox())!.x)).toBe(0);
        expect(Math.round((await menu.boundingBox())!.width)).toBe(width);
        if (route === "/") await page.screenshot({ path: `playwright-report/fullscreen-menu-${width}.png` });
        await expect(page.locator("body")).toHaveAttribute("data-scroll-locked");
        await page.keyboard.press("Escape");
        await expect(page.getByRole("button", { name: "Buka menu navigasi" })).toBeFocused();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
    await page.screenshot({ path: `playwright-report/marketing-nav-${width}.png` });
  });
}

for (const width of [360, 390, 430, 768, 1280, 1440]) {
  test(`workspace navigation, focus and viewport at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/simulator");
    await expect(page.getByRole("button", { name: "Run", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width >= 1024) return;
    await expect(page.locator("header")).toHaveCount(1);
    expect((await page.locator("header").boundingBox())!.height).toBeLessThan(90);
    const nav = page.getByRole("navigation", { name: "Panel workspace", exact: true });
    await expect(nav).toBeVisible();
    await nav.getByRole("button", { name: "Parts", exact: true }).click();
    const heading = page.getByRole("heading", { name: "Parts", exact: true });
    await expect(heading).toBeFocused();
    await expect(page.getByRole("textbox", { name: "Cari komponen" })).not.toBeFocused();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Buka Cirra" }).click();
    await expect(page.getByRole("dialog", { name: "Asisten Cirra" })).toBeVisible();
    await expect(nav).toBeHidden();
    await page.getByRole("button", { name: "Minimalkan Cirra" }).click();
    await expect(nav).toBeVisible();
    await page.screenshot({ path: `playwright-report/workspace-island-${width}.png` });
    await page.getByRole("button", { name: "Tindakan workspace", exact: true }).click();
    await expect(page.getByRole("button", { name: "Buka menu proyek", exact: true }).first()).toBeVisible();
    await page.keyboard.press("Escape");
    await page.goto("/simulator/code");
    await expect(page.locator(".monaco-editor")).toBeVisible();
    await page.evaluate(() => {
      const editor = (window as unknown as { __vircuitEditor: { focus(): void } }).__vircuitEditor;
      editor.focus();
      Object.defineProperty(visualViewport!, "height", { configurable: true, value: 460 });
      visualViewport!.dispatchEvent(new Event("resize"));
    });
    await expect(page.locator("[data-workspace-shell]")).toHaveAttribute("data-keyboard-open", "true");
    await expect(nav).toBeHidden();
    const editorBox = (await page.locator(".monaco-editor").boundingBox())!;
    expect(editorBox.y + editorBox.height).toBeLessThanOrEqual(461);
    await page.evaluate(() => { Object.defineProperty(visualViewport!, "height", { configurable: true, value: 240 }); visualViewport!.dispatchEvent(new Event("resize")); });
    await expect.poll(async () => (await page.locator(".monaco-editor").boundingBox())!.height).toBeGreaterThan(60);
    await page.evaluate(() => { Object.defineProperty(visualViewport!, "height", { configurable: true, value: 900 }); visualViewport!.dispatchEvent(new Event("resize")); });
    await expect(nav).toBeHidden();
    await page.evaluate(() => {
      let copied = "";
      Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => { copied = text; }, readText: async () => copied } });
    });
    await page.getByRole("button", { name: "Aksi teks kode" }).click();
    await page.getByRole("menuitem", { name: "Pilih semua", exact: true }).click();
    await page.getByRole("button", { name: "Aksi teks kode" }).click();
    await page.getByRole("menuitem", { name: "Potong pilihan", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Pilihan dipotong." })).toBeVisible();
    await page.getByRole("button", { name: "Aksi teks kode" }).click();
    await page.getByRole("menuitem", { name: "Tempel", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Kode ditempel." })).toBeVisible();
    await page.getByRole("button", { name: "Aksi teks kode" }).click();
    await page.getByRole("menuitem", { name: "Pilih semua", exact: true }).click();
    await page.evaluate(() => { Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw new Error("Denied"); } } }); });
    await page.getByRole("button", { name: "Aksi teks kode" }).click();
    await page.getByRole("menuitem", { name: "Salin pilihan", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Kode untuk disalin" })).toHaveValue(/void setup/);
    await page.screenshot({ path: `playwright-report/mobile-workspace-${width}.png` });
  });
}

test("short landscape menu scrolls within its viewport and keeps links accessible", async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto("/");
  await page.getByRole("button", { name: "Buka menu navigasi" }).click();
  const menu = page.getByRole("dialog");
  await expect.poll(async () => Math.round((await menu.boundingBox())!.x)).toBe(0);
  const nav = page.getByRole("navigation", { name: "Navigasi mobile" });
  const target = nav.getByRole("link", { name: "Harga", exact: true });
  await target.scrollIntoViewIfNeeded();
  const bounds = (await nav.boundingBox())!, link = (await target.boundingBox())!;
  expect(link.y).toBeGreaterThanOrEqual(bounds.y - 1);
  expect(link.y + link.height).toBeLessThanOrEqual(bounds.y + bounds.height + 1);
  await target.click(); await expect(page).toHaveURL(/\/harga$/);
  await expect(menu).toHaveCount(0);
});
