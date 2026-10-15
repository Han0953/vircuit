import { test, expect, type Page } from "@playwright/test";
import { selectCirraEffort } from "./helpers/cirra-controls";

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

test("public demo browses the shared shell without authentication or private mutations", async ({ page, request }) => {
  const mutations: string[] = [];
  page.on("request", (request) => { if (request.url().includes("/api/") && request.method() !== "GET") mutations.push(request.url()); });
  await page.goto("/masuk");
  await page.getByRole("link", { name: "Lihat demo dashboard", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Halo, Pengunjung!" })).toBeVisible();
  const sidebar = page.getByRole("navigation", { name: "Navigasi dashboard", exact: true });
  for (const label of ["Belajar", "Proyek Saya", "Cirra", "Tantangan", "Progress", "Pengaturan"]) {
    await sidebar.getByRole("link", { name: label, exact: true }).click();
    await expect(page.getByRole("heading", { name: label, exact: true }).last()).toBeVisible();
    await expect(page.locator("#dashboard-main").getByRole("link", { name: /^Masuk/ }).first()).toBeVisible();
  }
  expect(mutations).toEqual([]);
  for (const endpoint of ["/api/projects", "/api/progress"]) expect((await request.get(endpoint)).status()).toBe(401);
  expect((await request.post("/api/ai/cirra", { headers: { origin: "http://localhost:3002" }, data: {} })).status()).toBe(401);
  await page.goto("/demo/cirra");
  await page.getByRole("link", { name: "Masuk untuk bertanya", exact: true }).click();
  await expect(page).toHaveURL(/\/masuk\?next=%2Fdashboard%2Fcirra/);
  await page.goto("/dashboard/cirra");
  await expect(page).toHaveURL(/\/masuk\?next=/);
  expect((await page.goto("/demo/unknown"))?.status()).toBe(404);
});

for (const width of [360, 390, 430]) test(`icon-only dock stays centered after login and navigation at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 800 });
  await login(page);
  const dock = page.locator("[data-dashboard-dock]");
  // Wait past the login timeline's pill fade: it must not clear the dock's x transform.
  await page.waitForTimeout(1000);
  for (const label of ["Dashboard", "Cirra", "Proyek Saya"]) {
    if (label !== "Dashboard") await dock.getByRole("link", { name: label, exact: true }).click();
    const icon = dock.getByRole("link", { name: label, exact: true }).locator("svg");
    await expect.poll(async () => {
      const a = (await dock.locator("[data-dock-pill]").boundingBox())!, b = (await icon.boundingBox())!;
      return Math.abs(a.x + a.width / 2 - b.x - b.width / 2);
    }).toBeLessThan(2);
    await expect(dock.locator("[data-dock-index] > span").first()).toHaveClass("sr-only");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  const lab = page.locator("[data-dashboard-header]").getByRole("link", { name: "Buka Virtual Lab", exact: true });
  expect(await lab.evaluate((el) => getComputedStyle(el).boxShadow)).toBe("none");
  await page.goto("/demo");
  await dock.getByRole("link", { name: "Cirra", exact: true }).click();
  await expect(page).toHaveURL(/\/demo\/cirra$/);
  await expect(page.getByRole("link", { name: "Masuk untuk bertanya", exact: true })).toBeVisible();
  await expect.poll(async () => {
    const a = (await dock.locator("[data-dock-pill]").boundingBox())!, b = (await dock.getByRole("link", { name: "Cirra", exact: true }).locator("svg").boundingBox())!;
    return Math.abs(a.x + a.width / 2 - b.x - b.width / 2);
  }).toBeLessThan(2);
  await page.screenshot({ path: `test-results/demo-dock-${width}.png`, fullPage: true });
});

for (const workspace of [false, true]) test(`Cirra bubble grows with text and hint selection is explicit (${workspace ? "simulator" : "dashboard"})`, async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await login(page);
  await page.goto(workspace ? "/simulator" : "/dashboard/cirra");
  if (workspace) await page.getByRole("button", { name: "Buka Cirra", exact: true }).click();
  const chat = page.getByRole("region", { name: "Percakapan Cirra" });
  const mode = chat.getByRole("button", { name: "Pengaturan Cirra", exact: true });
  await mode.click();
  await expect(mode).toHaveAttribute("aria-expanded", "true");
  await expect.poll(() => mode.locator("svg").last().evaluate((el) => getComputedStyle(el).rotate)).toBe("180deg");
  await page.keyboard.press("Escape");
  await selectCirraEffort(page, 3);
  const answer = "Periksa pin output board dan jalur resistor sebelum menghubungkan LED ke ground.\n".repeat(45);
  const levels: number[] = [];
  await page.route("**/api/ai/cirra", async (route) => {
    const input = route.request().postDataJSON(); levels.push(input.hintLevel);
    await route.fulfill({ json: { requestId: input.requestId, result: { mode: input.mode, answer, observations: [], suggestions: [], hints: [], references: [] }, modelCategory: "FAST", context: { sources: [], truncated: [], challengeActive: false, hintLevel: input.hintLevel } } });
  });
  await chat.getByLabel("Pertanyaan untuk Cirra").fill("Bantu aku memahami rangkaian ini");
  await chat.getByRole("button", { name: "Kirim", exact: true }).click();
  const reply = chat.locator('[data-message-role="assistant"]');
  await expect(reply.locator("[data-revealing]")).toHaveCount(1);
  const start = (await reply.boundingBox())!.height;
  await expect.poll(() => reply.locator("[data-reply-text] > span[hidden]").count()).toBeGreaterThan(0);
  await expect(reply.locator("[data-revealing]")).toHaveCount(0);
  expect((await reply.boundingBox())!.height).toBeGreaterThan(start + 200);
  await expect.poll(() => chat.getByRole("log").evaluate((el) => el.scrollHeight - el.clientHeight - el.scrollTop)).toBeLessThan(3);
  expect(levels).toEqual([3]);
  await selectCirraEffort(page, 1);
  await chat.getByLabel("Pertanyaan untuk Cirra").fill("Jelaskan singkat saja");
  await chat.getByRole("button", { name: "Kirim", exact: true }).click();
  await expect.poll(() => levels).toEqual([3, 1]);
});

test("dashboard has one Lab entry and evenly spaced sidebar links", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("link", { name: "Buka Virtual Lab", exact: true })).toHaveCount(1);
  await expect(page.locator("#dashboard-main").getByRole("link", { name: "Buka Lab", exact: true })).toHaveCount(0);
  const nav = page.getByRole("navigation", { name: "Navigasi dashboard", exact: true });
  const projects = (await nav.getByRole("link", { name: "Proyek Saya", exact: true }).boundingBox())!;
  const challenges = (await nav.getByRole("link", { name: "Tantangan", exact: true }).boundingBox())!;
  expect(challenges.y - projects.y - projects.height).toBeLessThanOrEqual(5);
});
