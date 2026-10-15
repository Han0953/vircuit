import { profileSchema } from "@/features/settings/contracts";
import { authenticatedClient } from "@/features/projects/server/service";
import { errorResponse, limitedJson, RequestError, requireSameOrigin } from "@/lib/request-security";

export async function PATCH(request: Request) {
  try {
    requireSameOrigin(request);
    const { client, user } = await authenticatedClient();
    if (request.headers.get("x-vircuit-owner") !== user.id) throw new RequestError("Sesi berubah. Muat ulang pengaturan.", 409);
    const input = profileSchema.safeParse(await limitedJson(request, 2048));
    if (!input.success) throw new RequestError("Periksa nama: gunakan 2–100 karakter tanpa karakter kontrol atau markup.", 400);
    const { data, error } = await client.rpc("update_my_profile", { p_display_name: input.data.displayName });
    if (error) throw new RequestError("Profil belum dapat disimpan. Periksa koneksi lalu coba lagi.", 503);
    if (typeof data !== "string") throw new RequestError("Konfirmasi penyimpanan tidak valid. Muat ulang untuk memeriksa profil.", 503);
    return Response.json({ displayName: data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return errorResponse(error); }
}
