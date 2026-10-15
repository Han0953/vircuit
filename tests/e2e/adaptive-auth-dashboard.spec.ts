import { expect, test, type Page } from "@playwright/test";

const provider = "http://127.0.0.1:3031";
async function login(page: Page) {
  await page.goto("/masuk");
  await page.getByLabel("Email", { exact: true }).fill("dashboard@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator("[data-auth-door]")).toHaveCount(0);
}
test.beforeEach(async ({ request, page }) => {
  await request.post(`${provider}/__fixture/reset`, { data: { count: 4 } });
  await page.route("https://*.supabase.co/auth/v1/**", async (route) => {
    const url = new URL(route.request().url());
    await route.fulfill({ response: await route.fetch({ url: `${provider}${url.pathname}${url.search}` }) });
  });
});

test("auth panels preserve values, reverse safely, and unavailable Google never enters dashboard", async ({ page }, info) => {
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/masuk?next=%2Fdashboard%2Fprojects");
  await page.getByLabel("Email", { exact: true }).fill("learner@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("preserved-password");
  await page.getByRole("link", { name: "Belum punya akun? Daftar" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Daftar ke Vircuit" })).toBeVisible();
  await page.getByLabel("Email", { exact: true }).fill("register@example.test");
  await page.getByRole("link", { name: "Sudah punya akun? Masuk" }).click();
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue("learner@example.test");
  await expect(page.getByLabel("Kata sandi", { exact: true })).toHaveValue("preserved-password");
  await expect(page.getByLabel("Kata sandi", { exact: true })).toHaveAttribute("type", "password");
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => !!document.activeElement?.closest("[hidden]"))).toBe(false);
  await page.getByRole("button", { name: "Lanjutkan dengan Google" }).click();
  await expect(page.getByRole("status")).toContainText("Google");
  await expect(page.locator("[data-auth-door]")).toHaveCount(0);
  await expect(page).toHaveURL(/\/masuk\?next=/);
  await page.screenshot({ path: info.outputPath("auth-desktop.png"), fullPage: true });
  for (const width of [360,390,430,768,1024,1280,1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole("button", { name: "Masuk dengan email" })).toBeVisible();
    if (width === 390) await page.screenshot({ path: info.outputPath("auth-mobile.png"), fullPage: true });
  }
  expect(errors).toEqual([]);
});

test("verified login door recovers from slow navigation and does not replay on refresh", async ({ page }) => {
  await page.goto("/masuk");
  await page.route("**/api/auth/login", (route) => route.fulfill({ status: 401, json: { error: "Email atau kata sandi tidak sesuai." } }));
  await page.getByLabel("Email", { exact: true }).fill("dashboard@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  await expect(page.getByRole("status")).toContainText("tidak sesuai");
  await expect(page.locator("[data-auth-door]")).toHaveCount(0);
  await page.unroute("**/api/auth/login");
  await page.route("**/dashboard", async (route) => { await new Promise((resolve) => setTimeout(resolve, 2200)); await route.continue(); });
  await page.getByLabel("Kata sandi", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  await expect(page.locator("[data-auth-door]")).toBeVisible();
  await expect(page.locator("[data-auth-door]")).toHaveCount(0, { timeout: 2500 });
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.unroute("**/dashboard");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("[data-auth-door]")).toHaveCount(0);
});

test("sidebar preference, five-item dock, More, keyboard focus and safe swipe", async ({ page }, info) => {
  await login(page);
  await page.getByRole("button", { name: "Ciutkan sidebar", exact: true }).click();
  await expect(page.locator("[data-dashboard-sidebar]")).toHaveCSS("width", "80px");
  await expect.poll(async () => Math.round((await page.locator("[data-dashboard-header]").boundingBox())?.x ?? -1)).toBe(80);
  await expect(page.locator("[data-dashboard-header]")).toHaveCSS("position", "fixed");
  await page.screenshot({ path: info.outputPath("dashboard-collapsed.png"), fullPage: true });
  await page.getByRole("navigation", { name: "Navigasi dashboard" }).getByRole("link", { name: "Proyek Saya" }).click();
  await expect(page).toHaveURL(/\/dashboard\/projects$/);
  await page.reload();
  await expect(page.locator("[data-dashboard-sidebar]")).toHaveCSS("width", "80px");
  await page.getByRole("button", { name: "Perluas sidebar" }).click();
  await expect(page.locator("[data-dashboard-sidebar]")).toHaveCSS("width", "256px");
  await page.setViewportSize({ width: 390, height: 844 });
  const dock = page.getByRole("navigation", { name: "Navigasi utama mobile" });
  await expect(dock.getByRole("link")).toHaveCount(4);
  await expect(dock.getByRole("button")).toHaveCount(1);
  await page.getByLabel("Cari proyek sirkuit").focus();
  await expect(dock).toBeHidden();
  await page.getByRole("heading", { level: 1 }).click();
  await expect(dock).toBeVisible();
  await dock.getByRole("button", { name: "Lainnya" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("link", { name: "Pengaturan" })).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("button", { name: "Keluar akun", exact: true })).toBeInViewport();
  await page.screenshot({ path: info.outputPath("dashboard-more.png") });
  await page.keyboard.press("Escape");
  await expect(dock.getByRole("button", { name: "Lainnya" })).toBeFocused();
  await dock.getByRole("link", { name: "Dashboard", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  const main = page.locator("#dashboard-main");
  await main.dispatchEvent("pointerdown", { pointerId: 1, pointerType: "touch", isPrimary: true, clientX: 250, clientY: 300 });
  await main.dispatchEvent("pointerup", { pointerId: 1, pointerType: "touch", isPrimary: true, clientX: 130, clientY: 305 });
  await expect(page).toHaveURL(/\/dashboard\/learn$/);
  await main.dispatchEvent("pointerdown", { pointerId: 2, pointerType: "touch", isPrimary: true, clientX: 250, clientY: 300 });
  await main.dispatchEvent("pointermove", { pointerId: 2, pointerType: "touch", isPrimary: true, clientX: 230, clientY: 370 });
  await main.dispatchEvent("pointerup", { pointerId: 2, pointerType: "touch", isPrimary: true, clientX: 130, clientY: 375 });
  await expect(page).toHaveURL(/\/dashboard\/learn$/);
  await page.screenshot({ path: info.outputPath("dashboard-mobile-dock.png"), fullPage: true });
  for (const width of [360,430,768,1024,1280,1440]) { await page.setViewportSize({ width, height: 900 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); }
});

test("reduced motion, auth themes, and invalid recovery remain usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  await page.goto("/masuk");
  for (const theme of ["Terang", "Gelap", "Sistem"]) {
    await page.getByRole("button", { name: /^Pilih tema tampilan/ }).click();
    await page.getByRole("radio", { name: theme, exact: true }).click();
    await expect(page.locator("html")).toHaveClass(theme === "Terang" ? /light/ : /dark/);
  }
  await page.getByRole("link", { name: "Belum punya akun? Daftar" }).click();
  await expect(page.getByRole("heading", { name: "Daftar ke Vircuit" })).toBeVisible();
  await page.goto("/atur-ulang-kata-sandi");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Tautan tidak valid");
  await page.getByRole("link", { name: "Minta tautan baru" }).click();
  await expect(page.getByRole("heading", { name: "Lupa kata sandi?" })).toBeVisible();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.evaluate(() => localStorage.setItem("vircuit-preferences-v1:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", JSON.stringify({ motion: "reduced", density: "comfortable", grid: true, snap: false, reading: "standard" })));
  await page.goto("/masuk");
  await page.evaluate(() => { const observer = new MutationObserver(() => { if (document.querySelector("[data-auth-door]")) document.documentElement.dataset.doorSeen = "true"; }); observer.observe(document.body, { childList: true, subtree: true }); });
  await page.getByLabel("Email", { exact: true }).fill("dashboard@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  await expect(page.locator("[data-dashboard-shell]")).toHaveAttribute("data-motion-preference", "reduced");
  await expect(page.locator("html")).not.toHaveAttribute("data-door-seen", "true");
});

test("auth motion sampling and confirmation state on desktop and mobile", async ({ page }, info) => {
  const samples = [];
  for (const width of [390,1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/masuk");
    const [sample] = await Promise.all([
      page.evaluate(async () => {
        const intervals: number[] = [];
        const tasks: number[] = [];
        let cls = 0;
        const observer = new PerformanceObserver((list) => { for (const entry of list.getEntries()) { if (entry.entryType === "longtask") tasks.push(entry.duration); else if (!(entry as PerformanceEntry & { hadRecentInput: boolean }).hadRecentInput) cls += (entry as PerformanceEntry & { value: number }).value; } });
        observer.observe({ entryTypes: ["longtask", "layout-shift"] });
        await new Promise<void>((resolve) => {
          let previous = performance.now(); const start = previous;
          const frame = (now: number) => { intervals.push(now - previous); previous = now; if (now - start < 1200) requestAnimationFrame(frame); else resolve(); };
          requestAnimationFrame(frame);
        });
        observer.disconnect(); intervals.sort((a,b) => a-b);
        return { frames: intervals.length, p95: intervals[Math.floor(intervals.length * 0.95)], longestFrame: intervals.at(-1), longTasks: tasks.length, longestTask: Math.max(0,...tasks), cls };
      }),
      page.getByRole("link", { name: "Belum punya akun? Daftar" }).click(),
    ]);
    samples.push({ width, ...sample });
    await expect(page.getByRole("heading", { name: "Daftar ke Vircuit" })).toBeVisible();
  }
  console.log("AUTH_MOTION_SAMPLES", JSON.stringify(samples));
  await info.attach("auth-motion-samples.json", { body: JSON.stringify(samples,null,2), contentType: "application/json" });
  await page.route("**/api/auth/register", (route) => route.fulfill({ status: 200, json: { confirmation: true, next: "/dashboard" } }));
  await page.getByLabel("Email", { exact: true }).fill("confirmation@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("confirmation-password");
  await page.getByRole("button", { name: "Daftar dengan email" }).click();
  await expect(page.getByRole("status")).toContainText("Periksa email");
  await expect(page.locator("[data-auth-door]")).toHaveCount(0);
  await expect(page).toHaveURL(/\/daftar/);
});
