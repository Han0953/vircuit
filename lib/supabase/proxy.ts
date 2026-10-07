import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "./env";
export async function updateSession(request: NextRequest) {
  // Overwrite incoming values: this header only carries a redirect destination, never identity.
  request.headers.set("x-vircuit-path", request.nextUrl.pathname + request.nextUrl.search);
  let response = NextResponse.next({ request });
  let environment: ReturnType<typeof supabaseEnv>;
  try { environment = supabaseEnv(); } catch { return response; }
  const { url, key } = environment;
  const supabase = createServerClient(url, key, {
    cookieOptions: { sameSite: "lax", secure: request.nextUrl.protocol === "https:" },
    cookies: { getAll: () => request.cookies.getAll(), setAll: (values) => {
      values.forEach(({ name, value }) => request.cookies.set(name, value));
      response = NextResponse.next({ request });
      values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
    } },
  });
  try { await supabase.auth.getClaims(); } catch { /* Public simulator remains available when Auth is unreachable. */ }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
