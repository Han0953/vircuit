import { Suspense, type ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { serverClient } from "@/lib/supabase/server";
import { safeDestination } from "@/features/auth/redirect";
import { AuthExperience } from "@/features/auth/ui/auth-experience";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const url = new URL((await headers()).get("x-vircuit-path") ?? "/masuk", "https://vircuit.invalid");
  let authenticated = false;
  if (["/masuk", "/daftar"].includes(url.pathname)) {
    try {
      const { data: { user }, error } = await (await serverClient(true)).auth.getUser();
      authenticated = !error && !!user;
    } catch { /* Keep the form available when Auth cannot be reached. */ }
  }
  if (authenticated) redirect(safeDestination(url.searchParams.get("next")));
  // Verify/redirect before streaming: a cached login fallback must not become
  // the destination after the authenticated navigation leaves this layout.
  // Suspense is only for the client search-params boundary, never the guard.
  return <Suspense fallback={null}><AuthExperience>{children}</AuthExperience></Suspense>;
}
