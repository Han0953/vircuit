import { expect, test, type Page } from "@playwright/test";

async function verifyButtons(page: Page, dark: boolean) {
  await expect(page.locator("html")).toHaveClass(dark ? /dark/ : /light/);
  await expect(page.locator("html")).not.toHaveAttribute("data-theme-changing");
  // The verified shell streams before page actions. Wait for real content,
  // rather than sampling the empty Suspense frame immediately after navigation.
  await expect(page.locator('[data-slot="button"][data-variant="default"]').filter({ visible: true }).first()).toBeVisible();
  const results = await page.locator('[data-slot="button"][data-variant="default"]').evaluateAll((buttons) => buttons.filter((button) => button.getClientRects().length && !button.closest("[hidden]")).map((button) => {
    const style = getComputedStyle(button);
    return { label: button.textContent?.trim() || button.getAttribute("aria-label"), fg: style.color, bg: style.backgroundColor };
  }));
  expect(results.length).toBeGreaterThan(0);
  for (const button of results) {
    expect(button.fg, `${page.url()} ${button.label}`).toBe("rgb(255, 255, 255)");
    expect(button.bg, `${page.url()} ${button.label}`).toBe("rgb(37, 99, 235)");
  }
}

for (const width of [390, 1440]) for (const theme of ["light", "dark", "system"]) test(`primary action theme across marketing, forms, dashboard and lab: ${theme} ${width}px`, async ({ page, request }, info) => {
  test.setTimeout(90000);
  await request.post("http://127.0.0.1:3031/__fixture/reset", { data: { count: 4 } });
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.addInitScript((value) => localStorage.setItem("vircuit-theme", value), theme);
  const dark = theme !== "light";
  for (const route of ["/", "/fitur", "/belajar", "/jelajahi", "/harga", "/masuk", "/daftar"]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await verifyButtons(page, dark);
  }
  expect((await page.request.post("/api/auth/login", { headers: { Origin: "http://localhost:3002" }, data: { credentials: { email: "dashboard@example.test", password: "fixture-password" } } })).ok()).toBe(true);
  for (const route of ["/dashboard", "/dashboard/projects", "/dashboard/pengaturan", "/simulator"]) {
    await page.goto(route);
    await expect(page.locator('[data-dashboard-shell], [data-workspace-shell]').first()).toBeVisible();
    await verifyButtons(page, dark);
    if (route === "/dashboard" && theme !== "system") await page.screenshot({ path: info.outputPath(`dashboard-${theme}-${width}.png`) });
  }
  const run = page.getByRole("button", { name: "Run", exact: true });
  await expect(run).toBeEnabled();
  await run.hover();
  await expect(run).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(run).toHaveCSS("background-color", "rgb(29, 78, 216)");
  if (theme === "system") {
    await page.emulateMedia({ colorScheme: "light" });
    await page.mouse.move(0, 0);
    await verifyButtons(page, false);
  }
});

for (const width of [390, 1440]) test(`compact Back to Top has no shadow and returns to the top at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => scrollTo(0, 1400));
  const back = page.getByRole("button", { name: "Kembali ke atas halaman" });
  await expect(back).toBeVisible();
  await expect(back).toHaveCSS("box-shadow", "none");
  await expect(back).toHaveCSS("width", "44px");
  await expect(back).toHaveCSS("height", "44px");
  await expect(back.locator("svg")).toHaveAttribute("width", "18");
  expect(await back.evaluate((element) => getComputedStyle(element, "::before").width)).toBe("38px");
  expect(await back.evaluate((element) => getComputedStyle(element, "::before").boxShadow)).toBe("none");
  const box = (await back.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + 1);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
});

test("primary button text stays white throughout the System theme transition", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "no-preference" });
  await page.addInitScript(() => localStorage.setItem("vircuit-theme", "system"));
  await page.goto("/masuk");
  const button = page.getByRole("button", { name: "Masuk dengan email", exact: true });
  await expect(button).toBeEnabled();
  await expect(button).toHaveCSS("color", "rgb(255, 255, 255)");
  const samples = button.evaluate((element) => new Promise<string[]>((resolve) => {
    const colors: string[] = []; const start = performance.now();
    function frame() { colors.push(getComputedStyle(element).color); if (performance.now() - start < 550) requestAnimationFrame(frame); else resolve(colors); }
    requestAnimationFrame(frame);
  }));
  await page.emulateMedia({ colorScheme: "dark" });
  expect([...new Set(await samples)]).toEqual(["rgb(255, 255, 255)"]);
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.locator("html")).not.toHaveAttribute("data-theme-changing");
  await expect(button).toHaveCSS("color", "rgb(255, 255, 255)");
});
