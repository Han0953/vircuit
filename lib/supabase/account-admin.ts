import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";
import { RequestError } from "@/lib/request-security";

export function accountAdmin() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key?.startsWith("sb_secret_")) throw new RequestError("Penghapusan akun belum dapat diproses. Coba lagi nanti.", 503);
  return createClient(supabaseEnv().url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
