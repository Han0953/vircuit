import { z } from "zod";
import { serverClient } from "@/lib/supabase/server";
import { errorResponse, limitedJson, RequestError, requireSameOrigin } from "@/lib/request-security";
import { loginSchema, registerSchema, resetPasswordSchema } from "@/features/auth/schema";
import { cookies } from "next/headers";
import { recoveryCookie, validRecoveryProof } from "@/features/auth/recovery";
import { safeDestination } from "@/features/auth/redirect";
import { supabaseEnv } from "@/lib/supabase/env";

export async function POST(request: Request, context: { params: Promise<{ action: string }> }) {
  try {
    requireSameOrigin(request);
    const { action } = await context.params;
    const body = await limitedJson(request, 4096);
    const supabase = await serverClient();
    if (action === "recover") {
      const input = z.object({ email: z.email().max(254) }).strict().safeParse(body);
      if (!input.success) throw new RequestError("Masukkan email yang valid.", 400);
      const callback = new URL("/auth/callback?flow=recovery", request.url);
      const { error } = await supabase.auth.resetPasswordForEmail(input.data.email, { redirectTo: callback.href });
      if (error && error.status !== 400 && error.status !== 422) throw new RequestError("Pemulihan belum dapat diproses. Coba lagi nanti.", error.status === 429 ? 429 : 503);
      return Response.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
    }
    if (action === "reset") {
      const input = resetPasswordSchema.safeParse(body);
      if (!input.success) throw new RequestError("Periksa kata sandi baru dan konfirmasinya.", 400);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();
      const jar = await cookies();
      if (userError || !user || !session || !validRecoveryProof(jar.get(recoveryCookie)?.value, session.access_token)) throw new RequestError("Tautan pemulihan tidak valid atau sudah kedaluwarsa.", 401);
      const { error } = await supabase.auth.updateUser({ password: input.data.password });
      if (error) throw new RequestError("Kata sandi belum dapat diperbarui. Minta tautan baru jika kedaluwarsa.", 400);
      jar.delete(recoveryCookie);
      await supabase.auth.signOut({ scope: "local" });
      return Response.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
    }
    if (action === "logout") {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw new RequestError("Keluar gagal. Coba lagi.", 503);
      return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    }
    if (action === "google") {
      const parsed = z.object({ next: z.string().max(300).optional() }).strict().safeParse(body);
      if (!parsed.success) throw new RequestError("Permintaan tidak valid.", 400);
      const { url, key } = supabaseEnv();
      const settingsResponse = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key }, cache: "no-store", signal: AbortSignal.timeout(5000) });
      const settings = z.object({ external: z.object({ google: z.boolean() }) }).safeParse(await settingsResponse.json());
      if (!settingsResponse.ok || !settings.success || !settings.data.external.google) throw new RequestError("Login Google belum tersedia untuk saat ini. Gunakan email untuk masuk.", 503);
      const redirectTo = new URL("/auth/callback", request.url);
      redirectTo.searchParams.set("next", safeDestination(parsed.data.next));
      const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo.href, skipBrowserRedirect: true, queryParams: { prompt: "select_account" } } });
      if (error || !data.url) throw new RequestError("Google belum tersedia. Gunakan email atau coba lagi.", 503);
      return Response.json({ url: data.url }, { headers: { "Cache-Control": "no-store" } });
    }
    if (action !== "login" && action !== "register") throw new RequestError("Route tidak ditemukan.", 404);
    const envelope = z.object({ credentials: z.unknown(), next: z.string().max(300).optional() }).strict().safeParse(body);
    if (!envelope.success) throw new RequestError("Form tidak valid.", 400);
    const parsed = (action === "register" ? registerSchema : loginSchema).safeParse(envelope.data.credentials);
    if (!parsed.success) throw new RequestError("Periksa email dan kata sandi (pendaftaran minimal 8 karakter).", 400);
    const next = safeDestination(envelope.data.next);
    if (action === "register") {
      const callback = new URL("/auth/callback", request.url); callback.searchParams.set("next", next);
      const { data, error } = await supabase.auth.signUp({ ...parsed.data, options: { emailRedirectTo: callback.href } });
      if (error) throw new RequestError("Pendaftaran belum berhasil. Periksa data atau coba lagi nanti.", 400);
      return Response.json({ confirmation: !data.session, next, ...(data.session && data.user ? { user: { id: data.user.id } } : {}) }, { headers: { "Cache-Control": "no-store" } });
    }
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) throw new RequestError("Email atau kata sandi tidak sesuai, atau email belum dikonfirmasi.", 401);
    if (!data.user || !data.session) throw new RequestError("Sesi belum dapat diverifikasi. Coba masuk kembali.", 401);
    // Auth's password exchange has already verified these credentials. Return
    // only the identity needed for local motion preferences, never the tokens.
    // The navigation action and destination still verify the cookie session.
    return Response.json({ next, user: { id: data.user.id } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
