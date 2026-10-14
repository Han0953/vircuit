import { z } from "zod";
const schema = z.object({ url: z.url(), key: z.string().startsWith("sb_publishable_") });
export function supabaseEnv() {
  const result = schema.safeParse({ url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY });
  if (!result.success) throw new Error("Layanan akun belum tersedia.");
  return result.data;
}
