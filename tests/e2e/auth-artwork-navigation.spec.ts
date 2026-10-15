import { expect, test, type Page } from "@playwright/test";

const provider = "http://127.0.0.1:3031";
type ArtworkTrace = { moves: number; draws: number };
async function artworkTrace(page: Page) {
  return page.evaluate(() => (window as unknown as { artworkTrace: ArtworkTrace }).artworkTrace);
}
async function login(page: Page) {
  await page.goto("/masuk");
  await page.getByLabel("Email", { exact: true }).fill("dashboard@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  await expect(page.getByRole("heading", { name: "Halo, Astra" })).toBeVisible();
  await expect(page.locator("[data-auth-door]")).toHaveCount(0);
}
test.beforeEach(async ({ page, request }) => {
  await request.post(`${provider}/__fixture/reset`, { data: { count: 4 } });
  await page.route("https://*.supabase.co/auth/v1/**", async (route) => {
    const url = new URL(route.request().url());
    await route.fulfill({ response: await route.fetch({ url: `${provider}${url.pathname}${url.search}` }) });
  });
  await page.addInitScript(() => {
    const trace = { moves: 0, draws: 0 };
    (window as unknown as { artworkTrace: ArtworkTrace }).artworkTrace = trace;
    new MutationObserver((records) => {
      for (const { target } of records) {
        if (!(target instanceof Element)) continue;
        const style = target.getAttribute("style") ?? "";
        if (target.matches("[data-auth-art], [data-auth-art-copy]") && /transform:|opacity: 0/.test(style)) trace.moves++;
        if (target.matches("[data-auth-trace]") && /stroke-dash/.test(style)) trace.draws++;
      }
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ["style"] });
  });
});

test("PCB stays static on entry, refresh and logout; only Login/Daftar switches animate it", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  for (const path of ["/masuk", "/daftar"]) {
    await page.goto(path);
    await expect(page.locator("[data-auth-panel]:not([hidden])")).toHaveCSS("opacity", "1");
    expect(await artworkTrace(page)).toEqual({ moves: 0, draws: 0 });
    await page.reload();
    await expect(page.locator("[data-auth-panel]:not([hidden])")).toHaveCSS("opacity", "1");
    expect(await artworkTrace(page)).toEqual({ moves: 0, draws: 0 });
  }
  await page.getByRole("link", { name: "Sudah punya akun? Masuk" }).click();
  await expect.poll(async () => (await artworkTrace(page)).moves).toBeGreaterThan(0);
  await expect.poll(async () => (await artworkTrace(page)).draws).toBeGreaterThan(0);
  await expect(page.locator("[data-auth-art]")).toHaveCSS("transform", "none");
  await page.getByRole("link", { name: "Belum punya akun? Daftar" }).click();
  await expect(page.getByRole("heading", { name: "Daftar ke Vircuit" })).toBeVisible();
  await expect(page.locator("[data-auth-art]")).toHaveCSS("transform", "none");
  await login(page);
  await page.locator("aside").getByRole("button", { name: "Keluar akun", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Keluar akun", exact: true }).click();
  await expect(page).toHaveURL(/\/masuk/);
  await expect(page.locator("[data-auth-panel]:not([hidden])")).toHaveCSS("opacity", "1");
  expect(await artworkTrace(page)).toEqual({ moves: 0, draws: 0 });
});

test("motion preference changes never replay PCB; reduced mode switches remain static", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/masuk");
  await page.getByRole("link", { name: "Belum punya akun? Daftar" }).click();
  await expect(page.getByRole("heading", { name: "Daftar ke Vircuit" })).toBeVisible();
  expect(await artworkTrace(page)).toEqual({ moves: 0, draws: 0 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("[data-auth-panel]:not([hidden])")).toHaveCSS("opacity", "1");
  expect(await artworkTrace(page)).toEqual({ moves: 0, draws: 0 });
});

for (const width of [390, 1440]) {
  test(`full dashboard prefetch avoids a visible loading flash at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 960 });
    let prepared = false;
    page.on("response", (response) => {
      const request = response.request();
      // Next 16 separates its /_tree prefetch and dynamic full-page stream;
      // only the tree request carries next-router-prefetch. Streams may stay
      // open, so consuming response.text() is not a readiness signal.
      prepared ||= new URL(response.url()).pathname === "/dashboard/projects" && request.headers().rsc === "1" && !request.headers()["next-router-segment-prefetch"] && response.status() === 200;
    });
    await login(page);
    await expect.poll(() => prepared, { timeout: 15000 }).toBe(true);
    // Once the real route is prepared, a slow subsequent network cannot block
    // the click. No synthetic page data or authorization bypass is used.
    await page.route("**/dashboard/projects?*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.continue();
    });
    const sample = page.evaluate(async () => {
      let visibleSkeletonFrames = 0;
      return new Promise<{ elapsed: number; visibleSkeletonFrames: number }>((resolve) => {
        // Measure the real click, excluding Playwright's actionability wait
        // while the separately tested one-time login choreography settles.
        const click = (event: MouseEvent) => {
          if (!(event.target instanceof Element) || event.target.closest("a")?.getAttribute("href") !== "/dashboard/projects") return;
          document.removeEventListener("click", click, true);
          const started = performance.now();
          function frame() {
            const skeleton = document.querySelector<HTMLElement>('[data-dashboard-page] > [role="status"]');
            if (skeleton && getComputedStyle(skeleton).visibility !== "hidden" && Number(getComputedStyle(skeleton).opacity) > 0.05) visibleSkeletonFrames++;
            if (document.querySelector("#dashboard-main h1")?.textContent?.trim() === "Proyek Saya" || performance.now() - started > 2500) resolve({ elapsed: performance.now() - started, visibleSkeletonFrames });
            else requestAnimationFrame(frame);
          }
          requestAnimationFrame(frame);
        };
        document.addEventListener("click", click, true);
      });
    });
    const navigation = page.getByRole("navigation", { name: width < 1024 ? "Navigasi utama mobile" : "Navigasi dashboard" });
    await navigation.getByRole("link", { name: "Proyek Saya", exact: true }).click();
    const result = await sample;
    await expect(page.getByRole("heading", { name: "Proyek Saya", level: 1, exact: true })).toBeVisible();
    expect(result.elapsed).toBeLessThan(700);
    expect(result.visibleSkeletonFrames).toBe(0);
    console.log("WARM_DASHBOARD_NAVIGATION", JSON.stringify({ width, ...result }));
    await info.attach(`navigation-${width}.json`, { body: JSON.stringify(result), contentType: "application/json" });
  });
}

test("a confirmed rename invalidates the prefetched My Projects data", async ({ page }) => {
  let prepared = false;
  page.on("response", (response) => {
    const headers = response.request().headers();
    prepared ||= new URL(response.url()).pathname === "/dashboard/projects" && headers.rsc === "1" && !headers["next-router-segment-prefetch"] && response.status() === 200;
  });
  await login(page);
  await expect.poll(() => prepared, { timeout: 15000 }).toBe(true);
  await page.getByRole("button", { name: "Tindakan Proyek 001" }).click();
  await page.getByRole("menuitem", { name: "Ubah nama" }).click();
  await page.getByLabel("Nama proyek", { exact: true }).fill("Proyek terbaru setelah prefetch");
  await page.getByRole("button", { name: "Simpan nama" }).click();
  await expect(page.getByRole("heading", { name: "Proyek terbaru setelah prefetch" })).toBeVisible();
  await page.getByRole("navigation", { name: "Navigasi dashboard" }).getByRole("link", { name: "Proyek Saya", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Proyek terbaru setelah prefetch" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Proyek 001", exact: true })).toHaveCount(0);
});
