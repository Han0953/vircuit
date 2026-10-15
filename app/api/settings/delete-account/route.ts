import { z } from "zod";
import { authenticatedClient } from "@/features/projects/server/service";
import { accountAdmin } from "@/lib/supabase/account-admin";
import { avatarBucket, avatarPath } from "@/features/settings/avatar";
import { errorResponse, limitedJson, RequestError, requireSameOrigin } from "@/lib/request-security";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("code") }).strict(),
  z.object({ action: z.literal("delete"), confirmation: z.literal("HAPUS AKUN"), password: z.string().max(128).optional(), code: z.string().regex(/^\d{6,10}$/).optional() }).strict(),
]);
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const { client, user } = await authenticatedClient();
    if (request.headers.get("x-vircuit-owner") !== user.id) throw new RequestError("Sesi berubah. Muat ulang pengaturan.", 409);
    const parsed = schema.safeParse(await limitedJson(request, 2048));
    if (!parsed.success || !user.email) throw new RequestError("Periksa konfirmasi dan verifikasi akun.", 400);
    if (user.factors?.some((factor) => factor.status === "verified")) throw new RequestError("Akun ini memakai verifikasi dua langkah. Hubungi dukungan untuk penghapusan yang aman.", 403);
    if (parsed.data.action === "code") {
      const { error } = await client.auth.signInWithOtp({ email: user.email, options: { shouldCreateUser: false } });
      if (error) throw new RequestError("Kode belum dapat dikirim. Coba lagi nanti.", 400);
      return Response.json({ message: "Periksa emailmu untuk kode konfirmasi penghapusan." }, { headers: { "Cache-Control": "private, no-store" } });
    }
    const input = parsed.data;
    if (!input.password && !input.code) throw new RequestError("Verifikasi akun terlebih dahulu.", 400);
    const verified = input.password
      ? await client.auth.signInWithPassword({ email: user.email, password: input.password })
      : await client.auth.verifyOtp({ email: user.email, token: input.code!, type: "email" });
    if (verified.error || verified.data.user?.id !== user.id || !verified.data.session) throw new RequestError("Verifikasi akun tidak sesuai atau kedaluwarsa.", 403);
    const admin = accountAdmin();
    const revoked = await admin.auth.admin.signOut(verified.data.session.access_token, "global");
    if (revoked.error) throw new RequestError("Sesi belum dapat diamankan. Akun belum dihapus.", 503);
    const photo = await admin.storage.from(avatarBucket).remove([avatarPath(user.id)]);
    if (photo.error) throw new RequestError("Berkas akun belum dapat dibersihkan. Akun belum dihapus.", 503);
    const deleted = await admin.auth.admin.deleteUser(user.id);
    if (deleted.error) throw new RequestError("Akun belum dapat dihapus. Masuk kembali dan coba lagi.", 503);
    await client.auth.signOut({ scope: "local" });
    return Response.json({ deleted: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return errorResponse(error); }
}
