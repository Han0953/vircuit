import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";
import { RequestError } from "@/lib/request-security";

export function progressWriter() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret?.startsWith("sb_secret_")) throw new RequestError("Sinkronisasi progress belum dikonfigurasi. Hasil lokal tetap tersedia untuk dicoba lagi.", 503);
  return createClient(supabaseEnv().url, secret, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
