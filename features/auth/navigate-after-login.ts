"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { serverClient } from "@/lib/supabase/server";
import { safeDestination } from "./redirect";

export async function navigateAfterLogin(destination: string): Promise<void> {
  const { data: { user }, error } = await (await serverClient()).auth.getUser();
  if (error || !user) throw new Error("Sesi belum dapat diverifikasi.");
  // Login's Route Handler writes cookies, but cannot invalidate the browser's
  // prefetched anonymous redirect. Send invalidation and a fresh destination
  // tree in one Server Action, without a competing client refresh.
  revalidatePath("/dashboard", "layout");
  revalidatePath("/simulator", "layout");
  redirect(safeDestination(destination), RedirectType.replace);
}
