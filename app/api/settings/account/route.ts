import { accountActionSchema, accountInformation } from "@/features/settings/contracts";
import { authenticatedClient } from "@/features/projects/server/service";
import { errorResponse, limitedJson, RequestError, requireSameOrigin } from "@/lib/request-security";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const { client, user } = await authenticatedClient();
    if (request.headers.get("x-vircuit-owner") !== user.id) throw new RequestError("Sesi berubah. Muat ulang pengaturan.", 409);
    const parsed = accountActionSchema.safeParse(await limitedJson(request, 4096));
    if (!parsed.success) throw new RequestError("Periksa email, kata sandi, dan konfirmasi yang diisi.", 400);
    const input = parsed.data;
    if (input.action === "reauthenticate") {
      const { error } = await client.auth.reauthenticate();
      if (error) throw new RequestError("Kode belum dapat dikirim. Coba lagi nanti atau masuk kembali.", 400);
      return Response.json({ message: "Periksa email untuk kode verifikasi keamanan." }, { headers: { "Cache-Control": "private, no-store" } });
    }
    if (input.action === "email") {
      if (input.email.toLowerCase() === user.email?.toLowerCase()) throw new RequestError("Gunakan email yang berbeda.", 400);
      const callback = new URL("/auth/callback", request.url);
      callback.searchParams.set("next", "/dashboard/pengaturan");
      const { data, error } = await client.auth.updateUser({ email: input.email }, { emailRedirectTo: callback.href });
      if (error) throw new RequestError("Perubahan email belum berhasil. Periksa alamat atau coba lagi nanti.", 400);
      return Response.json({ message: data.user?.email === input.email ? "Email dikonfirmasi oleh penyedia autentikasi." : "Permintaan dikirim. Ikuti konfirmasi di email lama dan baru sesuai pengaturan keamanan akun.", pendingEmail: data.user?.new_email ?? "" }, { headers: { "Cache-Control": "private, no-store" } });
    }
    const { currentPassword, password, nonce } = input.values;
    const passwordAccount = accountInformation(user).hasPassword;
    if (passwordAccount) {
      if (!currentPassword || !user.email) throw new RequestError("Masukkan kata sandi saat ini.", 400);
      const verified = await client.auth.signInWithPassword({ email: user.email, password: currentPassword });
      if (verified.error || verified.data.user?.id !== user.id) throw new RequestError("Kata sandi saat ini tidak sesuai atau autentikasi ulang diperlukan.", 403);
    } else if (!nonce) throw new RequestError("Kirim dan masukkan kode verifikasi terlebih dahulu.", 400);
    const { error } = await client.auth.updateUser({ password, ...(passwordAccount ? { current_password: currentPassword } : {}), ...(nonce ? { nonce } : {}) });
    if (error) throw new RequestError("Kata sandi belum berubah. Periksa persyaratan akun; kirim kode verifikasi atau masuk kembali, lalu coba lagi.", 400);
    return Response.json({ message: "Kata sandi berhasil diperbarui." }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return errorResponse(error); }
}
