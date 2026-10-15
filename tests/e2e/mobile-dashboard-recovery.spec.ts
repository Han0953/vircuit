import { expect, test } from "@playwright/test";

const provider = "http://127.0.0.1:3031";
test.beforeEach(async ({ request, page }) => {
  await request.post(`${provider}/__fixture/reset`, { data: { count: 3 } });
  await page.route("https://*.supabase.co/auth/v1/**", async (route) => {
    const url = new URL(route.request().url());
    await route.fulfill({ response: await route.fetch({ url: `${provider}${url.pathname}${url.search}` }) });
  });
});

for (const width of [360, 390, 430]) test(`mobile fade and sequential header/dock/content at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 844 });
  await page.goto("/masuk");
  await page.getByLabel("Email", { exact: true }).fill("dashboard@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("fixture-password");
  await page.route("**/api/auth/login", async (route) => { await new Promise((resolve) => setTimeout(resolve, 600)); await route.continue(); });
  const trace = page.evaluate(async () => {
    const times: Record<string, number> = {};
    let desktopPanels = false, sidebarMoved = false, copies = 0;
    const fades = new Set<number>();
    const start = performance.now();
    await new Promise<void>((resolve) => {
      const frame = () => {
        const now = performance.now() - start;
        const transition = document.querySelector("[data-auth-transition]");
        desktopPanels ||= !!document.querySelector("[data-door-panel]");
        const copy = transition?.querySelector("[data-auth-screen-snapshot]");
        if (copy) {
          copies = Math.max(copies, transition!.querySelectorAll("[data-auth-screen-snapshot]").length);
          if (transition?.getAttribute("data-phase") === "opening") {
            times.opening ??= now;
            fades.add(Math.round(Number(getComputedStyle(copy).opacity) * 100));
          }
        }
        const shell = document.querySelector("[data-dashboard-shell][data-login-intro]");
        if (shell && !transition) {
          times.entry ??= now;
          const sidebar = shell.querySelector<HTMLElement>("[data-dashboard-sidebar]");
          sidebarMoved ||= !!sidebar?.style.transform;
          const selectors = { header: "[data-dashboard-header-copy] > :first-child", dock0: "[data-dock-index='0']", dock1: "[data-dock-index='1']", content: "#dashboard-main [data-motion]" };
          for (const [name, selector] of Object.entries(selectors)) {
            const node = shell.querySelector(selector);
            if (node && Number(getComputedStyle(node).opacity) > 0.05) times[name] ??= now;
          }
          if (now - times.entry > 1600) { resolve(); return; }
        }
        if (now > 12000) resolve(); else requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
    return { times, desktopPanels, sidebarMoved, copies, fadeSamples: fades.size };
  });
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  const result = await trace;
  await info.attach("mobile-entry.json", { body: JSON.stringify(result), contentType: "application/json" });
  expect(result.desktopPanels).toBe(false);
  expect(result.copies).toBe(1);
  expect(result.sidebarMoved).toBe(false);
  expect(result.fadeSamples).toBeGreaterThan(3);
  expect(result.times.entry - result.times.opening).toBeGreaterThan(250);
  expect(result.times.entry - result.times.opening).toBeLessThan(650);
  expect(result.times.header - result.times.entry).toBeLessThan(120);
  expect(result.times.dock1).toBeGreaterThan(result.times.dock0);
  expect(result.times.content).toBeGreaterThan(result.times.header);
  await expect(page.getByRole("heading", { name: "Halo, Astra!" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("mobile-dashboard.png"), fullPage: true });
  await page.reload();
  await expect(page.locator("[data-dashboard-shell]")).not.toHaveAttribute("data-login-intro");
});

for (const path of ["/dashboard", "/dashboard/learn", "/dashboard/challenges", "/dashboard/progress", "/dashboard/projects"]) test(`dashboard data retry recovers ${path} with pending feedback`, async ({ page, request }) => {
  await page.route("**/dashboard**", async (route) => {
    if (route.request().headers().rsc === "1") await new Promise((resolve) => setTimeout(resolve, 400));
    await route.continue();
  });
  await page.goto(`/masuk?next=${encodeURIComponent(path)}`);
  await page.getByLabel("Email", { exact: true }).fill("dashboard@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  await expect(page.locator("[data-auth-transition]")).toHaveCount(0);
  await expect(page.locator("#dashboard-main h1")).toBeVisible();
  await request.post(`${provider}/__fixture/failure`, { data: { enabled: true } });
  await page.reload();
  const error = page.getByRole("alert").filter({ has: page.getByRole("button", { name: "Coba lagi", exact: true }) }).first();
  await expect(error).toBeVisible();
  await request.post(`${provider}/__fixture/reset`, { data: { count: 3, progressDelay: 700 } });
  await error.getByRole("button", { name: "Coba lagi", exact: true }).click();
  await expect(page.getByRole("button", { name: "Memuat ulang…" }).first()).toBeDisabled();
  // Next's route announcer is also role=alert; only data errors in the
  // dashboard content must disappear after the successful refresh.
  await expect(page.locator("#dashboard-main").getByRole("alert")).toHaveCount(0, { timeout: 10000 });
  await expect(page.locator("#dashboard-main h1")).toBeVisible();
});

test("retry of failed lesson completion preserves the complete intent", async ({ page }) => {
  await page.goto("/masuk?next=%2Fdashboard%2Flearn%2Fdasar-iot%2Ftegangan-ground");
  await page.getByLabel("Email", { exact: true }).fill("dashboard@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  await expect(page.locator("[data-auth-transition]")).toHaveCount(0);
  const status = page.getByRole("region", { name: "Status belajar" });
  await expect(status).toContainText("Sedang dipelajari");
  const actions: string[] = [];
  await page.route("**/api/progress", async (route) => {
    if (route.request().method() === "POST") {
      const action = route.request().postDataJSON().action;
      actions.push(action);
      if (actions.length === 1) { await route.fulfill({ status: 503, json: { error: "Penyimpanan sementara tidak tersedia." } }); return; }
    }
    await route.continue();
  });
  await status.getByRole("button", { name: "Selesaikan materi" }).click();
  await expect(status.getByRole("alert")).toBeVisible();
  await status.getByRole("button", { name: "Coba lagi" }).click();
  await expect(status).toContainText("Materi selesai");
  expect(actions).toEqual(["complete", "complete"]);
});
