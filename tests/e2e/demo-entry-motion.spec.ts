import { test, expect } from "@playwright/test";

test.beforeEach(async ({ request }) => {
  await request.post("http://127.0.0.1:3031/__fixture/reset", { data: { count: 0 } });
});

for (const width of [360, 390, 430, 1440]) test(`demo reuses login transition and dashboard intro once at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/masuk");
  const authRequests: string[] = [];
  page.on("request", (request) => { if (/\/api\/auth\/(login|register|session)/.test(request.url())) authRequests.push(request.url()); });
  const recording = page.evaluate(async () => {
    const times: Record<string, number> = {};
    const ids = new Set<string>();
    let copies = 0, desktopDoor = false, mobileFade = false, sidebarMoved = false, itemsMoved = false;
    const started = performance.now();
    await new Promise<void>((resolve) => {
      const frame = () => {
        const elapsed = performance.now() - started;
        const overlay = document.querySelector("[data-auth-transition]");
        if (overlay) {
          times.overlay ??= elapsed;
          copies = Math.max(copies, overlay.querySelectorAll("[data-auth-screen-snapshot]").length);
          desktopDoor ||= overlay.hasAttribute("data-auth-door"); mobileFade ||= overlay.hasAttribute("data-auth-mobile");
        }
        const shell = document.querySelector<HTMLElement>("[data-demo-shell][data-login-intro]");
        if (shell && !overlay) {
          times.intro ??= elapsed;
          ids.add(shell.dataset.loginIntro!);
          sidebarMoved ||= !!shell.querySelector<HTMLElement>("[data-dashboard-sidebar]")?.style.transform;
          const items = shell.querySelectorAll<HTMLElement>(innerWidth >= 1024 ? "[data-dashboard-sidebar] nav [data-shell-item]" : "[data-dock-index]");
          itemsMoved ||= [...items].some((item) => item.style.opacity !== "" && Number(item.style.opacity) < 0.95);
          const header = shell.querySelector("[data-dashboard-header]"), card = shell.querySelector("[data-motion=card]");
          if (header && Number(getComputedStyle(header).opacity) > 0.1) times.header ??= elapsed;
          if (card && Number(getComputedStyle(card).opacity) > 0.1) times.card ??= elapsed;
          if (elapsed - times.intro > 3000) { resolve(); return; }
        }
        if (elapsed > 8000) { resolve(); return; }
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
    return { times, ids: [...ids], copies, desktopDoor, mobileFade, sidebarMoved, itemsMoved };
  });
  await page.getByRole("link", { name: "Lihat demo dashboard", exact: true }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.locator("[data-auth-transition]")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Halo, Pengunjung!" })).toBeVisible();
  const trace = await recording;
  expect(trace.ids).toHaveLength(1);
  expect(trace.itemsMoved).toBe(true);
  expect(trace.desktopDoor).toBe(width >= 1024);
  expect(trace.mobileFade).toBe(width < 1024);
  expect(trace.copies).toBe(width >= 1024 ? 2 : 1);
  expect(trace.sidebarMoved).toBe(width >= 1024);
  expect(trace.times.intro - trace.times.overlay).toBeGreaterThan(width >= 1024 ? 1200 : 250);
  expect(trace.times.card).toBeGreaterThanOrEqual(trace.times.header);
  expect(authRequests).toEqual([]);
  expect((await page.context().cookies()).some((cookie) => cookie.name.includes("auth-token") || cookie.name === "vircuit-auth-entry")).toBe(false);
  const nav = page.getByRole("navigation", { name: width >= 1024 ? "Navigasi dashboard" : "Navigasi utama mobile", exact: true });
  await nav.getByRole("link", { name: "Belajar", exact: true }).click();
  await expect(page).toHaveURL(/\/demo\/learn$/);
  await expect(page.locator("[data-demo-shell]")).not.toHaveAttribute("data-login-intro");
  await page.reload();
  await expect(page.locator("[data-demo-shell]")).not.toHaveAttribute("data-login-intro");
  await expect(page.locator("[data-auth-transition]")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("reduced motion skips demo transition and direct visits do not replay", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/masuk");
  await page.getByRole("link", { name: "Lihat demo dashboard", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Halo, Pengunjung!" })).toBeVisible();
  await expect(page.locator("[data-auth-transition]")).toHaveCount(0);
  await expect(page.locator("[data-demo-shell]")).not.toHaveAttribute("data-login-intro");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.reload();
  await expect(page.locator("[data-demo-shell]")).not.toHaveAttribute("data-login-intro");
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/masuk\?next=/);
});
