import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

test("real Supabase progress loads across dashboard pages on desktop and mobile", async ({ page }, info) => {
  test.skip(!process.env.RLS_USER_A_EMAIL || !process.env.RLS_USER_A_PASSWORD, "Requires an existing remote test account");
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/masuk");
  await page.getByLabel("Email", { exact: true }).fill(process.env.RLS_USER_A_EMAIL!);
  await page.getByLabel("Kata sandi", { exact: true }).fill(process.env.RLS_USER_A_PASSWORD!);
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator("[data-auth-transition]")).toHaveCount(0);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/dashboard", "/dashboard/learn", "/dashboard/challenges", "/dashboard/progress", "/dashboard/projects"]) {
      await page.goto(path);
      await expect(page.locator("#dashboard-main h1")).toBeVisible();
      await expect(page.getByText(/Data tidak tersedia|Progress gagal dimuat|Progress belum dapat dimuat|Proyek gagal dimuat/)).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Coba lagi", exact: true })).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (path === "/dashboard") await page.screenshot({ path: info.outputPath(`remote-dashboard-${width}.png`) });
    }
  }
});

test("lesson activity and completion persist through the real server writer and reload", async ({ page }, info) => {
  test.skip(!process.env.SUPABASE_SECRET_KEY || !process.env.RLS_USER_A_EMAIL || !process.env.RLS_USER_A_PASSWORD, "Requires existing remote test account and server writer");
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const reader = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, options);
  const setup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, options);
  const signed = await reader.auth.signInWithPassword({ email: process.env.RLS_USER_A_EMAIL!, password: process.env.RLS_USER_A_PASSWORD! });
  expect(signed.error).toBeNull();
  const owner = signed.data.user!.id;
  const lessonId = "lesson.tegangan-ground";
  const previous = await reader.from("learning_progress").select("*").eq("user_id", owner).eq("lesson_id", lessonId).maybeSingle();
  expect(previous.error).toBeNull();
  try {
    await page.goto("/masuk?next=%2Fdashboard%2Flearn%2Fdasar-iot%2Ftegangan-ground");
    await page.getByLabel("Email", { exact: true }).fill(process.env.RLS_USER_A_EMAIL!);
    await page.getByLabel("Kata sandi", { exact: true }).fill(process.env.RLS_USER_A_PASSWORD!);
    await page.getByRole("button", { name: "Masuk dengan email" }).click();
    await expect(page.locator("[data-auth-transition]")).toHaveCount(0);
    const status = page.getByRole("region", { name: "Status belajar" });
    await expect(status).toContainText(/Sedang dipelajari|Materi selesai/);
    if (previous.data?.status !== "completed") {
      const saved = page.waitForResponse((response) => response.url().endsWith("/api/progress") && response.request().method() === "POST" && response.request().postDataJSON()?.action === "complete");
      await status.getByRole("button", { name: "Selesaikan materi" }).click();
      expect((await saved).status()).toBe(200);
    }
    await expect(status).toContainText("Materi selesai");
    await page.reload();
    await expect(status).toContainText("Materi selesai");
    const actual = await reader.from("learning_progress").select("status,completion_source").eq("user_id", owner).eq("lesson_id", lessonId).single();
    expect(actual.error).toBeNull();
    expect(actual.data).toMatchObject({ status: "completed", completion_source: "manual" });
    await page.goto("/dashboard");
    await expect(page.getByText("Data tidak tersedia")).toHaveCount(0);
    await page.screenshot({ path: info.outputPath("remote-completed-progress.png") });
  } finally {
    // Restore only this existing test account's original lesson record.
    const restored = previous.data ? await setup.from("learning_progress").upsert(previous.data) : await setup.from("learning_progress").delete().eq("user_id", owner).eq("lesson_id", lessonId);
    expect(restored.error).toBeNull();
    await reader.auth.signOut({ scope: "local" });
  }
});
