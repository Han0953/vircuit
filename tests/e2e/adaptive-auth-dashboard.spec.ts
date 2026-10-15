import { expect, test, type Page } from "@playwright/test";
import { fixture } from "../../features/simulator/tests/fixtures";
import { newDraft } from "../../features/projects/local/drafts";

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
  await expect(page).toHaveURL(/\/masuk$/);
  await expect(page.getByLabel("Kata sandi", { exact: true })).toHaveValue("wrong-password");
  await expect(page.locator("[data-dashboard-shell]")).toHaveCount(0);
  await page.unroute("**/api/auth/login");
  await page.route("**/dashboard", async (route) => { await new Promise((resolve) => setTimeout(resolve, 2200)); await route.continue(); });
  await page.getByLabel("Kata sandi", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  await expect(page.locator("[data-auth-door]")).toBeVisible();
  await expect(page.locator("[data-auth-screen-snapshot]")).toHaveCount(2);
  await expect(page.locator("[data-auth-screen-snapshot] [data-auth-panel]:not([hidden]) h1")).toHaveText(["Masuk ke Vircuit", "Masuk ke Vircuit"]);
  expect(await page.locator("[data-door-panel]").evaluateAll((panels) => panels.every((panel) => getComputedStyle(panel).backgroundImage === "none"))).toBe(true);
  expect(await page.locator("[data-auth-screen-snapshot] input[type=password]").evaluateAll((inputs) => inputs.every((input) => (input as HTMLInputElement).value !== "fixture-password"))).toBe(true);
  expect(await page.locator("[data-auth-screen-snapshot]").evaluateAll((copies) => copies.every((copy) => (copy as HTMLElement).inert))).toBe(true);
  await expect(page.getByText(/Menyiapkan ruang belajar/)).toHaveCount(0);
  await expect(page.locator("[data-auth-door]")).toHaveCount(0, { timeout: 9000 });
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.unroute("**/dashboard");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("[data-auth-door]")).toHaveCount(0);
  await expect(page.locator("[data-dashboard-shell]")).not.toHaveAttribute("data-login-intro");
  await expect(page.locator("#dashboard-main [data-motion]").first()).toHaveCSS("opacity", "1");
});

test("continuous login rolling reveals a slower sidebar with overlapping header and content", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/masuk");
  await page.getByLabel("Email", { exact: true }).fill("dashboard@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("fixture-password");
  const tracePromise = page.evaluate(async () => {
    const times: Record<string, number> = {};
    let leftDirection = 0, rightDirection = 0, doorWidth = 0, doorHeight = 0;
    let previousDoor = false, sidebarHiddenUntilDoorEnd = true, sidebarFirstX = 0;
    const start = performance.now();
    await new Promise<void>((resolve) => {
      function frame() {
        const now = performance.now() - start;
        const door = document.querySelector("[data-auth-door]");
        const panels = door?.querySelectorAll("[data-door-panel]");
        if (door && panels?.length) {
          times.door ??= now;
          const box = door.getBoundingClientRect(); doorWidth = box.width; doorHeight = box.height;
          leftDirection = Math.min(leftDirection, new DOMMatrix(getComputedStyle(panels[0]).transform).m41);
          rightDirection = Math.max(rightDirection, new DOMMatrix(getComputedStyle(panels[1]).transform).m41);
          if (leftDirection <= -box.width / 2 + 0.5) times.motionEnd ??= now;
          if (door.getAttribute("data-phase") === "opening") times.opening ??= now;
        }
        if (previousDoor && !door) times.doorEnd ??= now;
        previousDoor = !!door;
        const shell = document.querySelector("[data-dashboard-shell]");
        if (shell) times.dashboard ??= now;
        const sidebar = document.querySelector("[data-dashboard-sidebar]");
        if (sidebar) {
          const opacity = Number(getComputedStyle(sidebar).opacity);
          if (door && opacity > 0) sidebarHiddenUntilDoorEnd = false;
          if (!door && opacity > 0 && times.sidebarEntry === undefined) { times.sidebarEntry = now; sidebarFirstX = sidebar.getBoundingClientRect().x; }
          if (!door && times.sidebarEntry !== undefined && sidebar.getBoundingClientRect().x >= -1) times.sidebarIn ??= now;
          if (!door && times.sidebarEntry !== undefined && getComputedStyle(sidebar).transform === "none") times.sidebarPanelDone ??= now;
        }
        const groups = { sidebar: "[data-dashboard-sidebar] nav [data-shell-item]", header: "[data-dashboard-header-copy] > *", content: "#dashboard-main [data-motion]" };
        for (const [key, selector] of Object.entries(groups)) {
          const element = document.querySelector(selector);
          if (!element) continue;
          const opacity = Number(getComputedStyle(element).opacity);
          if (!door && opacity > 0.025) times[key] ??= now;
          if (!door && opacity > 0.99 && times[key]) times[`${key}End`] ??= now;
        }
        document.querySelectorAll("[data-dashboard-sidebar] nav [data-shell-item]").forEach((item, index) => {
          const opacity = Number(getComputedStyle(item).opacity);
          if (!door && opacity > 0.025) times[`nav${index}`] ??= now;
          if (!door && index === 6 && opacity > 0.99) times.lastNavEnd ??= now;
        });
        const logout = document.querySelector<HTMLElement>("[data-sidebar-logout]");
        if (!door && logout && getComputedStyle(logout).opacity === "1" && !logout.style.opacity) times.sidebarGroupEnd ??= now;
        const lastHeader = Array.from(document.querySelectorAll<HTMLElement>("[data-dashboard-header] button")).at(-1);
        if (!door && lastHeader && getComputedStyle(lastHeader).opacity === "1" && !lastHeader.style.opacity) times.headerGroupEnd ??= now;
        if ((times.contentEnd && times.sidebarGroupEnd && times.headerGroupEnd) || now > 14000) resolve(); else requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
    return { times, leftDirection, rightDirection, doorWidth, doorHeight, sidebarHiddenUntilDoorEnd, sidebarFirstX };
  });
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  const trace = await tracePromise;
  console.log("LOGIN_CHOREOGRAPHY", JSON.stringify(trace));
  await info.attach("login-choreography.json", { body: JSON.stringify(trace, null, 2), contentType: "application/json" });
  expect(trace.doorWidth).toBe(1440); expect(trace.doorHeight).toBe(960);
  expect(trace.leftDirection).toBeLessThan(-690);
  expect(trace.rightDirection).toBeGreaterThan(690);
  expect(trace.times.dashboard).toBeLessThan(trace.times.doorEnd);
  expect(trace.times.motionEnd - trace.times.door).toBeGreaterThan(1300);
  expect(trace.times.motionEnd - trace.times.door).toBeLessThan(1900);
  expect(trace.sidebarHiddenUntilDoorEnd).toBe(true);
  // The first rAF may sample after the first tween tick. Verify visible travel,
  // rather than requiring the exact off-screen GSAP setup position (-256px).
  expect(trace.sidebarFirstX).toBeLessThan(-128);
  expect(trace.times.sidebarIn - trace.times.sidebarEntry).toBeGreaterThan(600);
  expect(trace.times.sidebarIn - trace.times.sidebarEntry).toBeLessThan(1000);
  expect(trace.times.sidebarEntry - trace.times.doorEnd).toBeLessThan(50);
  expect(trace.times.sidebar).toBeGreaterThanOrEqual(trace.times.sidebarPanelDone);
  expect(trace.times.sidebar - trace.times.sidebarEntry).toBeGreaterThan(950);
  expect(trace.times.sidebar - trace.times.sidebarEntry).toBeLessThan(1200);
  expect(trace.times.header - trace.times.sidebarEntry).toBeGreaterThan(300);
  expect(trace.times.header - trace.times.sidebarEntry).toBeLessThan(600);
  expect(trace.times.header).toBeLessThan(trace.times.sidebarGroupEnd);
  expect(trace.times.content - trace.times.header).toBeGreaterThan(250);
  expect(trace.times.content - trace.times.header).toBeLessThan(500);
  expect(trace.times.content).toBeLessThan(trace.times.headerGroupEnd);
  expect(trace.times.headerEnd - trace.times.header).toBeGreaterThan(400);
  expect(trace.times.contentEnd - trace.times.content).toBeGreaterThan(400);
  expect(trace.times.nav2 - trace.times.nav0).toBeGreaterThan(100);
  await expect.poll(() => page.locator("#dashboard-main [data-motion]").evaluateAll((items) => items.every((item) => Number(getComputedStyle(item).opacity) >= 0.99)), { timeout: 10000 }).toBe(true);
  await page.screenshot({ path: info.outputPath("dashboard-login.png"), fullPage: true });
  await page.getByRole("navigation", { name: "Navigasi dashboard" }).getByRole("link", { name: "Proyek Saya" }).click();
  await expect(page).toHaveURL(/\/dashboard\/projects$/);
  await expect(page.locator("[data-dashboard-shell]")).not.toHaveAttribute("data-login-intro");
  await expect(page.locator("[data-dashboard-header]")).toHaveCSS("opacity", "1");
  await page.getByRole("navigation", { name: "Navigasi dashboard" }).getByRole("link", { name: "Dashboard", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator("[data-dashboard-shell]")).not.toHaveAttribute("data-login-intro");
});

for (const width of [390, 1440]) test(`rolling never holds partway through slow authentication at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 960 });
  await page.goto("/masuk");
  await page.getByLabel("Email", { exact: true }).fill("dashboard@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("fixture-password");
  await page.route("**/api/auth/login", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2600));
    await route.continue();
  });
  await page.evaluate(() => {
    document.querySelector("button[type=submit]")?.addEventListener("click", () => { document.documentElement.dataset.loginClick = String(performance.now()); }, { once: true });
  });
  const trajectory = page.evaluate(async () => {
    const samples: { elapsed: number; travel: number }[] = [];
    await new Promise<void>((resolve) => {
      function frame() {
        const clicked = Number(document.documentElement.dataset.loginClick);
        const panel = document.querySelector("[data-door-panel]");
        if (clicked && panel) {
          const elapsed = performance.now() - clicked;
          const travel = Math.abs(new DOMMatrix(getComputedStyle(panel).transform).m41) / (innerWidth / 2);
          samples.push({ elapsed, travel });
          if (travel >= 0.999 || elapsed > 2400) { resolve(); return; }
        }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
    return { samples, path: location.pathname };
  });
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  const trace = await trajectory;
  await info.attach("uninterrupted-rolling.json", { body: JSON.stringify(trace, null, 2), contentType: "application/json" });
  console.log("UNINTERRUPTED_ROLLING", JSON.stringify({ width, end: trace.samples.at(-1), path: trace.path }));
  expect(trace.path).toBe("/masuk");
  expect(trace.samples.at(-1)?.travel).toBeGreaterThanOrEqual(0.999);
  expect(trace.samples.at(-1)?.elapsed).toBeLessThan(1900);
  for (let index = 1; index < trace.samples.length; index++) expect(trace.samples[index].travel).toBeGreaterThanOrEqual(trace.samples[index - 1].travel - 0.001);
  const checkpoints = [0.25, 0.5, 0.75].map((fraction) => trace.samples.find((sample) => sample.travel >= fraction)?.elapsed ?? Infinity);
  expect(checkpoints[1] - checkpoints[0]).toBeLessThan(350);
  expect(checkpoints[2] - checkpoints[1]).toBeLessThan(350);
  await expect(page.locator("[data-auth-loading]")).toHaveCount(0);
  await expect(page.locator("[data-dashboard-shell]")).toHaveCount(0);
  expect((await page.context().cookies()).some((cookie) => cookie.name === "vircuit-auth-entry")).toBe(false);
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator("[data-auth-door]")).toHaveCount(0);
  await expect(page.locator("[data-auth-screen-snapshot]")).toHaveCount(0);
  await expect(page.locator("[data-auth-loading]")).toHaveCount(0);
});

test("verified shell enters without an interstitial while slow page data streams; late content does not wait again", async ({ page, request }, info) => {
  await request.post(`${provider}/__fixture/reset`, { data: { count: 4, progressDelay: 3200 } });
  await page.goto("/masuk");
  await page.getByLabel("Email", { exact: true }).fill("dashboard@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("fixture-password");
  const tracePromise = page.evaluate(async () => {
    const times: Record<string, number> = {};
    const start = performance.now(); let seenDoor = false, loaderSeen = false;
    await new Promise<void>((resolve) => {
      function frame() {
        const now = performance.now() - start;
        const door = document.querySelector("[data-auth-door]");
        if (door) seenDoor = true;
        if (seenDoor && !door) times.doorEnd ??= now;
        loaderSeen ||= !!document.querySelector("[data-auth-loading]");
        const sidebar = document.querySelector("[data-dashboard-sidebar]");
        if (!door && sidebar && Number(getComputedStyle(sidebar).opacity) > 0) times.sidebar ??= now;
        const content = document.querySelector("[data-dashboard-content-ready]");
        if (content) times.contentReady ??= now;
        const item = content?.querySelector("[data-motion]");
        if (item && getComputedStyle(content!).visibility === "visible" && Number(getComputedStyle(item).opacity) > 0.025) times.contentVisible ??= now;
        if (times.contentVisible || now > 12000) resolve(); else requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
    return { times, loaderSeen };
  });
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  await expect(page.locator("[data-auth-door]")).toHaveCount(0);
  await expect(page.locator('[aria-label="Memuat dashboard"]')).toHaveCSS("visibility", "hidden");
  const trace = await tracePromise;
  console.log("STREAMED_DASHBOARD_ENTRY", JSON.stringify(trace));
  await info.attach("streamed-entry.json", { body: JSON.stringify(trace), contentType: "application/json" });
  expect(trace.loaderSeen).toBe(false);
  expect(trace.times.sidebar - trace.times.doorEnd).toBeLessThan(50);
  expect(trace.times.contentReady - trace.times.doorEnd).toBeGreaterThan(1000);
  expect(trace.times.contentVisible - trace.times.contentReady).toBeLessThan(150);
  await expect(page.getByRole("heading", { level: 1, name: "Halo, Astra!" })).toBeVisible();
});

for (const width of [390, 1440]) test(`refresh heading has no black outline and tab navigation has a light transition at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ colorScheme: width === 390 ? "dark" : "light" });
  await login(page);
  await page.reload();
  const heading = page.locator("#dashboard-main h1");
  await expect(heading).toBeFocused();
  await expect(heading).toHaveCSS("outline-style", "none");
  await expect(page.locator("[data-dashboard-shell]")).not.toHaveAttribute("data-login-intro");
  await expect(page.locator("[data-dashboard-page]")).toHaveCSS("transform", "none");
  await page.screenshot({ path: info.outputPath("refresh-heading.png") });
  await page.evaluate(() => {
    const observer = new MutationObserver((records) => {
      if (records.some((record) => record.target instanceof HTMLElement && record.target.matches("[data-dashboard-page]") && !!record.target.style.transform)) document.documentElement.dataset.pageMotionSeen = "true";
    });
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["style"] });
  });
  const navigation = page.getByRole("navigation", { name: width === 390 ? "Navigasi utama mobile" : "Navigasi dashboard" });
  const destinations = width === 390 ? ["Proyek Saya", "Belajar", "Dashboard"] : ["Proyek Saya", "Belajar", "Tantangan", "Progress", "Pengaturan", "Dashboard"];
  for (const destination of destinations) {
    await page.evaluate(() => { document.documentElement.dataset.pageMotionSeen = "false"; });
    await navigation.getByRole("link", { name: destination, exact: true }).click();
    await expect(page.locator("#dashboard-main h1")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-page-motion-seen", "true");
    await expect(page.locator("[data-dashboard-page]")).toHaveCSS("transform", "none");
    await expect(page.locator("[data-dashboard-page]")).toHaveCSS("opacity", "1");
    await expect(page.locator("[data-dashboard-shell]")).not.toHaveAttribute("data-login-intro");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  // Programmatically focused headings do not get a box, but interactive keyboard
  // focus still has its accessible indicator.
  await page.keyboard.press("Tab");
  await navigation.getByRole("link", { name: "Belajar", exact: true }).focus();
  await expect(navigation.getByRole("link", { name: "Belajar", exact: true })).toHaveCSS("outline-style", "solid");
});

test("reduced motion skips the lightweight tab transition", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await login(page);
  await page.evaluate(() => {
    document.documentElement.dataset.pageMotionSeen = "false";
    new MutationObserver((records) => {
      if (records.some((record) => record.target instanceof HTMLElement && record.target.matches("[data-dashboard-page]") && !!record.target.style.transform)) document.documentElement.dataset.pageMotionSeen = "true";
    }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["style"] });
  });
  await page.getByRole("navigation", { name: "Navigasi dashboard" }).getByRole("link", { name: "Proyek Saya" }).click();
  await expect(page).toHaveURL(/\/dashboard\/projects$/);
  await expect(page.locator("#dashboard-main h1")).toBeVisible();
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expect(page.locator("html")).toHaveAttribute("data-page-motion-seen", "false");
  await expect(page.locator("[data-dashboard-page]")).toHaveCSS("transform", "none");
});

test("login motion begins before slow authentication; failed or unverified requests restore the same form", async ({ page }, info) => {
  await page.goto("/masuk");
  await page.getByLabel("Email", { exact: true }).fill("dashboard@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("wrong-password");
  let requests = 0;
  await page.route("**/api/auth/login", async (route) => {
    requests++;
    await new Promise((resolve) => setTimeout(resolve, 1400));
    await route.fulfill({ status: 401, json: { error: "Email atau kata sandi tidak sesuai." } });
  });
  await page.evaluate(() => {
    document.querySelector("button[type=submit]")?.addEventListener("click", () => { document.documentElement.dataset.loginClick = String(performance.now()); }, { once: true });
  });
  const motionTrace = page.evaluate(async () => {
    return new Promise<{ delay: number; phase: string | null }>((resolve) => {
      const frame = () => {
        const clicked = Number(document.documentElement.dataset.loginClick);
        const door = document.querySelector("[data-auth-door]");
        const panel = door?.querySelector("[data-door-panel]");
        if (clicked && panel && Math.abs(new DOMMatrix(getComputedStyle(panel).transform).m41) > 0.1) resolve({ delay: performance.now() - clicked, phase: door?.getAttribute("data-phase") ?? null });
        else requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
  });
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  const trace = await motionTrace;
  // Repeating a physical click on the inert snapshot cannot submit a second login.
  const copiedButton = await page.locator("[data-auth-screen-snapshot] button[type=submit]").first().boundingBox();
  if (copiedButton) await page.mouse.click(copiedButton.x + copiedButton.width / 2, copiedButton.y + copiedButton.height / 2);
  console.log("LOGIN_CLICK_MOTION", JSON.stringify(trace));
  await info.attach("click-motion.json", { body: JSON.stringify(trace), contentType: "application/json" });
  expect(trace.delay).toBeLessThan(150);
  expect(trace.phase).toBe("authenticating");
  await expect(page).toHaveURL(/\/masuk$/);
  await expect(page.locator("[data-dashboard-shell]")).toHaveCount(0);
  expect((await page.context().cookies()).some((cookie) => cookie.name === "vircuit-auth-entry")).toBe(false);
  await page.screenshot({ path: info.outputPath("login-authenticating.png") });
  await expect(page.locator("[data-auth-door]")).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText("tidak sesuai");
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue("dashboard@example.test");
  await expect(page.getByLabel("Kata sandi", { exact: true })).toHaveValue("wrong-password");
  expect(requests).toBe(1);
  await page.unroute("**/api/auth/login");
  await page.route("**/api/auth/login", (route) => route.abort("failed"));
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  await expect(page.locator("[data-auth-door]")).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText("Koneksi gagal");
  await expect(page.getByLabel("Kata sandi", { exact: true })).toHaveValue("wrong-password");
  await page.unroute("**/api/auth/login");
  // A successful login response alone still cannot navigate without verified session.
  await page.route("**/api/auth/login", (route) => route.fulfill({ status: 200, json: { next: "/dashboard" } }));
  await page.route("**/api/auth/session", (route) => route.fulfill({ status: 200, json: { user: null } }));
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  await expect(page.locator("[data-auth-door]")).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText("Sesi belum dapat diverifikasi");
  await expect(page).toHaveURL(/\/masuk$/);
  await expect(page.locator("[data-dashboard-shell]")).toHaveCount(0);
});

test("mobile login opens a full-height door and keeps the one-time intro usable", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/masuk");
  await page.getByLabel("Email", { exact: true }).fill("dashboard@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  await expect(page.locator("[data-auth-door]")).toBeVisible();
  const doorBox = await page.locator("[data-auth-door]").boundingBox();
  expect(doorBox?.width).toBe(390); expect(doorBox?.height).toBe(844);
  await expect(page.locator("[data-auth-screen-snapshot]")).toHaveCount(2);
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator("[data-auth-door]")).toHaveCount(0);
  await expect(page.locator("[data-dashboard-shell]")).toHaveAttribute("data-login-intro", /.+/);
  await expect.poll(() => page.locator("#dashboard-main [data-motion]").evaluateAll((items) => items.every((item) => Number(getComputedStyle(item).opacity) >= 0.99)), { timeout: 10000 }).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("dashboard-mobile-login.png"), fullPage: true });
  await page.reload();
  await expect(page.locator("[data-dashboard-shell]")).not.toHaveAttribute("data-login-intro");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("sidebar preference, five-item dock, More, keyboard focus and safe swipe", async ({ page }, info) => {
  await login(page);
  await page.getByRole("button", { name: "Ciutkan sidebar", exact: true }).click();
  await expect(page.locator("[data-dashboard-sidebar]")).toHaveCSS("width", "80px");
  await expect.poll(async () => Math.round((await page.locator("[data-dashboard-header]").boundingBox())?.x ?? -1)).toBe(80);
  await expect(page.locator("[data-dashboard-header]")).toHaveCSS("position", "fixed");
  await expect(page.locator("[data-shell-indicator]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Perluas sidebar" }).getByRole("img", { name: "Vircuit" })).toBeVisible();
  await expect(page.locator("[data-shell-item]").last()).toHaveCSS("opacity", "1");
  const centers = await page.locator("[data-shell-icon]").evaluateAll((icons) => icons.map((icon) => { const box = icon.getBoundingClientRect(); return box.x + box.width / 2; }));
  expect(Math.max(...centers) - Math.min(...centers)).toBeLessThan(1);
  expect(centers[0]).toBe(40);
  await expect.poll(() => page.locator("#dashboard-main [data-motion]").evaluateAll((items) => items.every((item) => Number(getComputedStyle(item).opacity) >= 0.99)), { timeout: 10000 }).toBe(true);
  await page.screenshot({ path: info.outputPath("dashboard-collapsed.png"), fullPage: true });
  await page.getByRole("navigation", { name: "Navigasi dashboard" }).getByRole("link", { name: "Proyek Saya" }).click();
  await expect(page).toHaveURL(/\/dashboard\/projects$/);
  await page.reload();
  await expect(page.locator("[data-dashboard-sidebar]")).toHaveCSS("width", "80px");
  await page.getByRole("button", { name: "Perluas sidebar" }).click();
  await expect(page.locator("[data-dashboard-sidebar]")).toHaveCSS("width", "256px");
  await page.getByRole("button", { name: "Ciutkan sidebar", exact: true }).click();
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
  // Account preferences only become known after authentication. Anticipation may
  // start, but the full exit and dashboard intro must be skipped for this owner.
  await page.evaluate(() => { const observer = new MutationObserver(() => { if (document.querySelector('[data-auth-door][data-phase="opening"]')) document.documentElement.dataset.doorOpened = "true"; }); observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-phase"] }); });
  await page.getByLabel("Email", { exact: true }).fill("dashboard@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  await expect(page.locator("[data-dashboard-shell]")).toHaveAttribute("data-motion-preference", "reduced");
  await expect(page.locator("html")).not.toHaveAttribute("data-door-opened", "true");
  await expect(page.locator("[data-auth-door]")).toHaveCount(0);
  await expect(page.locator("[data-dashboard-shell]")).not.toHaveAttribute("data-login-intro");
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

test("system reduced motion clears the login screen and does not replay when motion is enabled", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await login(page);
  await expect(page.locator("[data-auth-screen-snapshot]")).toHaveCount(0);
  await expect(page.locator("[data-dashboard-shell]")).not.toHaveAttribute("data-login-intro");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expect(page.locator("[data-dashboard-shell]")).not.toHaveAttribute("data-login-intro");
  await expect(page.locator("[data-dashboard-shell]")).toHaveAttribute("data-intro-pending", "false");
});

test("guest draft is a compact continuation action, with its data preserved", async ({ page }) => {
  await page.goto("/masuk");
  const draft = { ...newDraft("guest", { ...fixture({ board: "uno" }, [], "void setup(){} void loop(){}"), metadata: { name: "Contoh: Serial · penghitung" } }), localRevision: 1 };
  await page.evaluate(async (draft) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("vircuit-projects", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("drafts", { keyPath: "scope" });
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => { const tx = db.transaction("drafts", "readwrite"); tx.objectStore("drafts").put(draft); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
    db.close();
  }, draft);
  await login(page);
  await expect(page.getByText(/tersedia di browser ini/)).toHaveCount(0);
  await expect(page.getByRole("complementary", { name: "Draft tamu tersedia" })).toHaveCount(0);
  const action = page.getByRole("link", { name: "Lanjutkan draft lokal: Contoh: Serial · penghitung", exact: true });
  await expect(action).toHaveAttribute("href", "/simulator");
  await expect(action).toHaveAttribute("title", draft.project.metadata.name);
  for (const width of [360, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await action.click();
  await expect(page).toHaveURL(/\/simulator$/);
  await expect(page.getByRole("heading", { name: "Simpan draft tamu ke akun?" })).toBeVisible();
  const id = await page.evaluate(async () => {
    const request = indexedDB.open("vircuit-projects", 1);
    const db = await new Promise<IDBDatabase>((resolve) => { request.onsuccess = () => resolve(request.result); });
    const value = await new Promise<{ id: string }>((resolve) => { const read = db.transaction("drafts").objectStore("drafts").get("guest"); read.onsuccess = () => resolve(read.result); });
    db.close(); return value.id;
  });
  expect(id).toBe(draft.id);
});
