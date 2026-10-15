import { Suspense, type ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { serverClient } from "@/lib/supabase/server";
import { safeDestination } from "@/features/auth/redirect";
import { AuthExperience } from "@/features/auth/ui/auth-experience";

async function AuthContent({ children }: { children: ReactNode }) {
  const url = new URL((await headers()).get("x-vircuit-path") ?? "/masuk", "https://vircuit.invalid");
  let authenticated = false;
  if (["/masuk", "/daftar"].includes(url.pathname)) {
    try { authenticated = !!(await (await serverClient(true)).auth.getUser()).data.user; } catch { /* Keep the form available when Auth cannot be reached. */ }
  }
  if (authenticated) redirect(safeDestination(url.searchParams.get("next")));
  return <AuthExperience>{children}</AuthExperience>;
}
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<main className="flex min-h-dvh items-center justify-center p-6"><p role="status">Menyiapkan halaman akun…</p></main>}><AuthContent>{children}</AuthContent></Suspense>;
}
