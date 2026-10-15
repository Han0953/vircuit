import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authenticatedClient, listProjectPage } from "@/features/projects/server/service";
import { RequestError } from "@/lib/request-security";
import type { ProjectPage } from "@/features/projects/contracts";
import { safeDestination } from "@/features/auth/redirect";
import { safeProfileName } from "@/features/settings/contracts";
import { avatarBucket } from "@/features/settings/avatar";

export const dashboardGuard = cache(async () => {
  try { return await authenticatedClient(true); }
  catch (error) {
    if (error instanceof RequestError && error.status === 401) {
      const target = safeDestination((await headers()).get("x-vircuit-path") ?? "/dashboard");
      redirect(`/masuk?next=${encodeURIComponent(target)}`);
    }
    throw error;
  }
});
export const dashboardIdentity = cache(async () => {
  try {
    const { client, user } = await dashboardGuard();
    const { data } = await client.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
    const name = safeProfileName(data?.display_name, user.user_metadata);
    const avatar = await client.storage.from(avatarBucket).list(user.id, { limit: 1, search: "avatar.webp" });
    const photo = avatar.data?.find((file) => file.name === "avatar.webp");
    return { id: user.id, name, email: user.email ?? "", ...(photo ? { avatarUrl: `/api/settings/avatar?v=${encodeURIComponent(photo.updated_at ?? "")}` } : {}) };
  } catch (error) {
    if (error instanceof RequestError && error.status === 401) {
      const target = safeDestination((await headers()).get("x-vircuit-path") ?? "/dashboard");
      redirect(`/masuk?next=${encodeURIComponent(target)}`);
    }
    throw error;
  }
});
export async function dashboardProjects(query: unknown, limit = 24): Promise<{ data: ProjectPage | null; error: string | null }> {
  await dashboardIdentity();
  try { return { data: await listProjectPage(query, true, limit), error: null }; }
  catch (error) {
    if (error instanceof RequestError && error.status === 401) redirect("/masuk?next=/dashboard");
    return { data: null, error: error instanceof RequestError ? error.message : "Proyek belum dapat dimuat. Coba lagi." };
  }
}
