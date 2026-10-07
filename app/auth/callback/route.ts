import { NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase/server";
import { safeDestination } from "@/features/auth/redirect";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeDestination(url.searchParams.get("next"));
  const code = url.searchParams.get("code");
  const hash = url.searchParams.get("token_hash");
  let success = false;
  try {
    const supabase = await serverClient();
    if (code && code.length <= 4096) success = !(await supabase.auth.exchangeCodeForSession(code)).error;
    else if (hash && hash.length <= 4096 && url.searchParams.get("type") === "email") success = !(await supabase.auth.verifyOtp({ token_hash: hash, type: "email" })).error;
  } catch { /* Never echo OAuth credentials or provider text. */ }
  const target = new URL(success ? next : `/masuk?error=callback&next=${encodeURIComponent(next)}`, url.origin);
  const response = NextResponse.redirect(target);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
