import { redirect } from "next/navigation";
import { authenticatedClient } from "./service";
import { RequestError } from "@/lib/request-security";
import { safeDestination } from "@/features/auth/redirect";
export async function verifyWorkspaceAccess(searchParams: Promise<Record<string, string | string[] | undefined>>, path: "/simulator" | "/simulator/code") {
  const params = await searchParams;
  if (params.lesson !== undefined || params.practice !== undefined) {
    try { await authenticatedClient(true); }
    catch (error) {
      if (!(error instanceof RequestError && error.status === 401)) throw error;
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) if (typeof value === "string") query.set(key, value);
      redirect(`/masuk?next=${encodeURIComponent(safeDestination(`${path}?${query}`))}`);
    }
  }
  return null;
}


