import { expect, test, type Page } from "@playwright/test";
import { authEntryCookie } from "../../features/auth/motion/transition-contract";
import { defaultPreferences } from "../../features/settings/contracts";

const provider = "http://127.0.0.1:3031";
const owner = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
type IntroTrace = { ids: string[]; sidebarMoved: boolean; itemsMoved: boolean };
async function trace(page: Page) {
  return page.evaluate(() => (window as unknown as { introTrace: IntroTrace }).introTrace);
}
test.beforeEach(async ({ request, page }) => {
  await request.post(`${provider}/__fixture/reset`, { data: { count: 4 } });
  await page.addInitScript(() => {
    const trace: IntroTrace = { ids: [], sidebarMoved: false, itemsMoved: false };
    (window as unknown as { introTrace: IntroTrace }).introTrace = trace;
    new MutationObserver(() => {
      const shell = document.querySelector<HTMLElement>("[data-dashboard-shell]");
      const id = shell?.dataset.loginIntro;
      if (!id) return;
      if (!trace.ids.includes(id)) trace.ids.push(id);
      const sidebar = shell.querySelector<HTMLElement>("[data-dashboard-sidebar]");
      if (sidebar?.style.transform && sidebar.style.transform !== "none") trace.sidebarMoved = true;
      if (Array.from(shell.querySelectorAll<HTMLElement>("[data-shell-item], [data-dock-index]")).some((item) => !!item.style.transform)) trace.itemsMoved = true;
    }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-login-intro", "style"] });
  });
});

async function verifiedFullDocumentEntry(page: Page) {
  await page.goto("/masuk");
  const verified = await page.evaluate(async () => {
    const login = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credentials: { email: "dashboard@example.test", password: "fixture-password" }, next: "/dashboard" }) });
    const session = await fetch("/api/auth/session", { cache: "no-store" });
    return login.ok && session.ok && typeof (await session.json()).user?.id === "string";
  });
  expect(verified).toBe(true);
  const entry = { id: crypto.randomUUID(), target: "/dashboard", expires: Date.now() + 60_000 };
  await page.context().addCookies([{ name: authEntryCookie, value: encodeURIComponent(JSON.stringify(entry)), url: "http://localhost:3002", sameSite: "Lax" }]);
  await page.goto("/dashboard");
  return entry;
}

for (const width of [390, 1440]) test(`verified full-document login animates once; refresh and tabs do not replay at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const entry = await verifiedFullDocumentEntry(page);
  await expect.poll(async () => (await trace(page)).ids).toEqual([entry.id]);
  await expect.poll(async () => (await trace(page)).itemsMoved).toBe(true);
  if (width === 1440) expect((await trace(page)).sidebarMoved).toBe(true);
  await expect(page.locator("[data-dashboard-sidebar]")).toHaveCSS("transform", "none");
  const nav = page.getByRole("navigation", { name: width < 1024 ? "Navigasi utama mobile" : "Navigasi dashboard" });
  await nav.getByRole("link", { name: "Proyek Saya", exact: true }).click();
  await expect(page.locator("#dashboard-main h1")).toHaveText("Proyek Saya");
  await expect(page.locator("[data-dashboard-shell]")).not.toHaveAttribute("data-login-intro");
  await nav.getByRole("link", { name: "Dashboard", exact: true }).click();
  await expect(page.locator("#dashboard-main h1")).toContainText("Halo, Astra");
  await expect(page.locator("[data-dashboard-shell]")).not.toHaveAttribute("data-login-intro");
  expect((await trace(page)).ids).toEqual([entry.id]);
  await page.reload();
  await expect(page.locator("#dashboard-main h1")).toBeVisible();
  expect((await trace(page)).ids).toEqual([]);
});

test("account motion preference is resolved before consuming a verified entry", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(({ owner, preferences }) => localStorage.setItem(`vircuit-preferences-v1:${owner}`, JSON.stringify(preferences)), { owner, preferences: { ...defaultPreferences, motion: "full" } });
  const entry = await verifiedFullDocumentEntry(page);
  await expect.poll(async () => (await trace(page)).ids).toEqual([entry.id]);
  await expect.poll(async () => (await trace(page)).itemsMoved).toBe(true);
});

test("entry still animates when sessionStorage is blocked", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    const get = Storage.prototype.getItem;
    const set = Storage.prototype.setItem;
    Storage.prototype.getItem = function (key) { if (this === sessionStorage) throw new DOMException("Storage blocked", "SecurityError"); return get.call(this, key); };
    Storage.prototype.setItem = function (key, value) { if (this === sessionStorage) throw new DOMException("Storage blocked", "SecurityError"); return set.call(this, key, value); };
  });
  const entry = await verifiedFullDocumentEntry(page);
  await expect.poll(async () => (await trace(page)).ids).toEqual([entry.id]);
  await expect.poll(async () => (await trace(page)).itemsMoved).toBe(true);
  await page.reload();
  await expect(page.locator("#dashboard-main h1")).toBeVisible();
  expect((await trace(page)).ids).toEqual([]);
});

test("a motion effect rebind resumes the same login clock instead of removing or replaying the intro", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const entry = await verifiedFullDocumentEntry(page);
  await expect.poll(async () => (await trace(page)).ids).toEqual([entry.id]);
  const sidebar = page.locator("[data-dashboard-sidebar]");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(sidebar).toHaveCSS("transform", "none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(sidebar).not.toHaveCSS("transform", "none");
  await expect(sidebar).toHaveCSS("transform", "none");
  await expect.poll(() => page.locator("[data-dashboard-sidebar] nav [data-shell-item]").evaluateAll((items) => items.every((item) => getComputedStyle(item).opacity === "1" && getComputedStyle(item).transform === "none"))).toBe(true);
  expect((await trace(page)).ids).toEqual([entry.id]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(sidebar).toHaveCSS("transform", "none");
  await expect(page.locator("#dashboard-main [data-motion]").first()).toHaveCSS("opacity", "1");
});

test("each successful login gets one fresh intro, while an existing session does not", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  const ids: string[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    if (!attempt) await page.goto("/masuk");
    await page.getByLabel("Email", { exact: true }).fill("dashboard@example.test");
    await page.getByLabel("Kata sandi", { exact: true }).fill("fixture-password");
    await page.getByRole("button", { name: "Masuk dengan email" }).click();
    await expect(page.locator("[data-auth-door]")).toHaveCount(0);
    await expect.poll(async () => (await trace(page)).ids.length).toBe(1);
    ids.push((await trace(page)).ids[0]);
    if (!attempt) {
      await page.locator("aside").getByRole("button", { name: "Keluar akun", exact: true }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Keluar akun", exact: true }).click();
      await expect(page).toHaveURL(/\/masuk/);
    }
  }
  expect(ids[0]).not.toBe(ids[1]);
  await page.goto("/dashboard");
  await expect(page.locator("[data-dashboard-shell]")).toHaveAttribute("data-intro-pending", "false");
  await expect(page.locator("#dashboard-main h1")).toBeVisible();
  expect((await trace(page)).ids).toEqual([]);
});
