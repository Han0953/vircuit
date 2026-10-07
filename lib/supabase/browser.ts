import { createBrowserClient } from "@supabase/ssr";
import { supabaseEnv } from "./env";
export function browserClient() {
  const { url, key } = supabaseEnv();
  return createBrowserClient(url, key, { cookieOptions: { sameSite: "lax", secure: process.env.NODE_ENV === "production" && typeof location !== "undefined" && location.protocol === "https:" } });
}
