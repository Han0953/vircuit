import { NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase/server";
import { safeDestination } from "@/features/auth/redirect";
import { recoveryCookie, recoveryProof } from "@/features/auth/recovery";
import { authEntryCookie } from "@/features/auth/motion/transition-contract";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeDestination(url.searchParams.get("next"));
  const code = url.searchParams.get("code");
  const hash = url.searchParams.get("token_hash");
  let success = false;
  let proof = "";
  let verified = false;
  const recovery = url.searchParams.get("flow") === "recovery" || url.searchParams.get("type") === "recovery";
  try {
    const supabase = await serverClient();
    if (code && code.length <= 4096) success = !(await supabase.auth.exchangeCodeForSession(code)).error;
    else if (hash && hash.length <= 4096) {
      const type = url.searchParams.get("type");
      if (type === "email" || type === "email_change" || type === "recovery") success = !(await supabase.auth.verifyOtp({ token_hash: hash, type })).error;
    }
    if (success) {
      const { data: { user }, error } = await supabase.auth.getUser();
      verified = !!user && !error;
      success = verified;
      if (success && recovery) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) proof = recoveryProof(session.access_token); else success = false;
      }
    }
  } catch { success = false; verified = false; }
  const target = new URL(success ? recovery ? "/atur-ulang-kata-sandi" : next : `/masuk?error=callback&next=${encodeURIComponent(next)}`, url.origin);
  const response = NextResponse.redirect(target);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  if (success && recovery) response.cookies.set(recoveryCookie, proof, { httpOnly: true, sameSite: "lax", secure: url.protocol === "https:", path: "/", maxAge: 600 });
  else if (success && verified && next.startsWith("/dashboard")) response.cookies.set(authEntryCookie, encodeURIComponent(JSON.stringify({ id: crypto.randomUUID(), target: next, expires: Date.now() + 60_000 })), { sameSite: "lax", secure: url.protocol === "https:", path: "/", maxAge: 60 });
  return response;
}
