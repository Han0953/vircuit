import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authenticatedClient, listProjectPage } from "@/features/projects/server/service";
import { RequestError } from "@/lib/request-security";
import type { ProjectPage } from "@/features/projects/contracts";
import { safeDestination } from "@/features/auth/redirect";

export const dashboardIdentity = cache(async () => {
  try {
    const { client, user } = await authenticatedClient(true);
    const { data } = await client.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
    const name = typeof data?.display_name === "string" && data.display_name.trim()
      ? data.display_name.trim() : user.email ?? "Pengguna Vircuit";
    return { id: user.id, name, email: user.email ?? "" };
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
