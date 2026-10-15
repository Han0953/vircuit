import { test, expect, type Page } from "@playwright/test";

const provider = "http://127.0.0.1:3031";
async function login(page: Page) {
  await page.goto("/masuk");
  await page.getByLabel("Email", { exact: true }).fill("dashboard@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator("[data-dashboard-shell]")).toHaveAttribute("data-intro-pending", "false");
}
test.beforeEach(async ({ page, request }) => {
  await request.post(`${provider}/__fixture/reset`, { data: { count: 0 } });
  await page.route("https://*.supabase.co/auth/v1/**", async (route) => {
    const url = new URL(route.request().url());
    await route.fulfill({ response: await route.fetch({ url: `${provider}${url.pathname}${url.search}` }) });
  });
});

test("Cirra is protected and returns to its own route after login", async ({ page }) => {
  await page.goto("/dashboard/cirra");
  await expect(page).toHaveURL(/\/masuk\?next=%2Fdashboard%2Fcirra/);
  await page.getByLabel("Email", { exact: true }).fill("dashboard@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  await expect(page).toHaveURL(/\/dashboard\/cirra$/);
  await expect(page.getByRole("heading", { name: "Tanya Cirra" })).toBeVisible();
});

test("desktop sidebar opens real chat, retains conversation on navigation and keeps Lab in header", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  const sidebar = page.getByRole("navigation", { name: "Navigasi dashboard", exact: true });
  await expect(sidebar.getByRole("link", { name: "Virtual Lab", exact: true })).toHaveCount(0);
  await sidebar.getByRole("link", { name: "Cirra", exact: true }).click();
  await expect(sidebar.getByRole("link", { name: "Cirra", exact: true })).toHaveAttribute("aria-current", "page");
  const chat = page.getByRole("region", { name: "Percakapan Cirra" });
  await expect(page.locator(".react-flow,.monaco-editor")).toHaveCount(0);
  await chat.getByLabel("Pertanyaan untuk Cirra").fill("Kenapa LED membutuhkan resistor?");
  const sent = page.waitForRequest((request) => request.url().endsWith("/api/ai/cirra"));
  await chat.getByRole("button", { name: "Kirim", exact: true }).click();
  const input = (await sent).postDataJSON();
  expect(input).toMatchObject({ mode: "tutor", message: "Kenapa LED membutuhkan resistor?" });
  expect(input.project).toBeUndefined();
  expect(input.lessonId).toBeUndefined();
  await expect(chat.getByRole("log")).toContainText("resistor membatasi arus");
  await chat.getByLabel("Pertanyaan untuk Cirra").fill("Pertanyaan berikutnya");
  await sidebar.getByRole("link", { name: "Proyek Saya", exact: true }).click();
  await sidebar.getByRole("link", { name: "Cirra", exact: true }).click();
  await expect(chat.getByRole("log")).toContainText("resistor membatasi arus");
  await expect(chat.getByLabel("Pertanyaan untuk Cirra")).toHaveValue("Pertanyaan berikutnya");
  await page.getByRole("button", { name: "Ciutkan sidebar" }).click();
  await expect(sidebar.getByRole("link", { name: "Cirra", exact: true })).toBeVisible();
  await page.screenshot({ path: "test-results/dashboard-cirra-desktop.png", fullPage: true });
  await page.locator("[data-dashboard-header]").getByRole("link", { name: "Buka Virtual Lab", exact: true }).click();
  await expect(page).toHaveURL(/\/simulator$/);
  await expect(page.locator(".react-flow")).toBeVisible();
});

for (const width of [360, 390, 430]) test(`mobile Cirra navigation, chat and theme at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 800 });
  await login(page);
  const dock = page.getByRole("navigation", { name: "Navigasi utama mobile", exact: true });
  await expect(dock.getByRole("link", { name: "Virtual Lab", exact: true })).toHaveCount(0);
  await dock.getByRole("link", { name: "Cirra", exact: true }).click();
  await expect(dock.getByRole("link", { name: "Cirra", exact: true })).toHaveAttribute("aria-current", "page");
  const chat = page.getByRole("region", { name: "Percakapan Cirra" });
  await expect(chat.getByLabel("Pertanyaan untuk Cirra")).not.toBeFocused();
  for (const [theme, label] of [["light", "Terang"], ["dark", "Gelap"], ["system", "Sistem"]]) {
    await page.emulateMedia({ colorScheme: "dark" });
    const toggle = page.getByRole("button", { name: /^Pilih tema tampilan/ });
    await toggle.focus();
    await toggle.press("Enter");
    await page.getByRole("radio", { name: label, exact: true }).click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("html")).toHaveClass(new RegExp(theme === "light" ? "light" : "dark"));
    await expect(chat.getByLabel("Pertanyaan untuk Cirra")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const bounds = await chat.boundingBox(), dockBounds = await dock.boundingBox();
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(dockBounds!.y);
  }
  await chat.getByLabel("Pertanyaan untuk Cirra").fill("Apa fungsi resistor?");
  await expect(dock).toBeHidden();
  await chat.getByRole("button", { name: "Kirim", exact: true }).click();
  await expect(chat.getByRole("log")).toContainText("resistor membatasi arus");
  await page.getByRole("heading", { name: "Tanya Cirra" }).click();
  await expect(dock).toBeVisible();
  await expect(chat.locator("[data-revealing]")).toHaveCount(0);
  await page.screenshot({ path: `test-results/dashboard-cirra-${width}.png`, fullPage: true });
  await expect(page.locator("[data-dashboard-header]").getByRole("link", { name: "Buka Virtual Lab", exact: true })).toBeVisible();
});

test("Cirra retry and logout work without initializing a simulator", async ({ page }) => {
  await login(page);
  await page.getByRole("navigation", { name: "Navigasi dashboard", exact: true }).getByRole("link", { name: "Cirra", exact: true }).click();
  const chat = page.getByRole("region", { name: "Percakapan Cirra" });
  await page.route("**/api/ai/cirra", (route) => route.fulfill({ status: 503, json: { error: "Unavailable" } }));
  await chat.getByLabel("Pertanyaan untuk Cirra").fill("Bagaimana cara kerja resistor?");
  await chat.getByRole("button", { name: "Kirim", exact: true }).click();
  await expect(chat.getByRole("alert")).toContainText("belum tersedia");
  await page.unroute("**/api/ai/cirra");
  await chat.getByRole("button", { name: "Coba lagi", exact: true }).click();
  await expect(chat.getByRole("log")).toContainText("resistor membatasi arus");
  await expect(chat.locator('[data-message-role="user"]')).toHaveCount(1);
  await page.getByRole("button", { name: "Keluar akun", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Keluar akun", exact: true }).click();
  await expect(page).toHaveURL(/\/masuk/);
  await login(page);
  await page.getByRole("navigation", { name: "Navigasi dashboard", exact: true }).getByRole("link", { name: "Cirra", exact: true }).click();
  await expect(chat.locator('[data-message-role="user"]')).toHaveCount(0);
  await expect(chat.locator('[data-cirra-greeting]')).toBeVisible();
});
