import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "./env";
export async function serverClient(readOnly = false) {
  const jar = await cookies();
  const { url, key } = supabaseEnv();
  return createServerClient(url, key, {
    cookieOptions: { sameSite: "lax", secure: process.env.NODE_ENV === "production" },
    cookies: { getAll: () => jar.getAll(), setAll: (values) => {
      // Proxy owns refresh cookies during Server Component rendering.
      if (readOnly) return;
      values.forEach(({ name, value, options }) => jar.set(name, value, options));
    } },
  });
}
