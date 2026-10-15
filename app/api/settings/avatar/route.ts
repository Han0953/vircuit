import { authenticatedClient } from "@/features/projects/server/service";
import { avatarBucket, avatarBytes, avatarPath } from "@/features/settings/avatar";
import { errorResponse, RequestError, requireSameOrigin, limitedJson } from "@/lib/request-security";
import { z } from "zod";

export async function GET() {
  try {
    const { client, user } = await authenticatedClient();
    const { data, error } = await client.storage.from(avatarBucket).download(avatarPath(user.id), { cacheNonce: crypto.randomUUID() });
    if (error || !data) throw new RequestError("Foto tidak ditemukan.", 404);
    return new Response(data, { headers: { "Content-Type": "image/webp", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; sandbox" } });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    if (request.headers.get("origin") !== new URL(request.url).origin) throw new RequestError("Asal permintaan tidak diizinkan.", 403);
    if (request.headers.get("content-type") !== "image/webp") throw new RequestError("Format foto tidak didukung.", 415);
    const { client, user } = await authenticatedClient();
    if (request.headers.get("x-vircuit-owner") !== user.id) throw new RequestError("Sesi berubah. Muat ulang pengaturan.", 409);
    const bytes = await avatarBytes(request);
    const { error } = await client.storage.from(avatarBucket).upload(avatarPath(user.id), bytes, { upsert: true, contentType: "image/webp", cacheControl: "0" });
    if (error) throw new RequestError("Foto belum tersimpan. Periksa koneksi lalu coba lagi.", 503);
    return Response.json({ avatarUrl: `/api/settings/avatar?v=${Date.now()}` }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: Request) {
  try {
    requireSameOrigin(request);
    const { client, user } = await authenticatedClient();
    if (request.headers.get("x-vircuit-owner") !== user.id) throw new RequestError("Sesi berubah. Muat ulang pengaturan.", 409);
    if (!z.object({}).strict().safeParse(await limitedJson(request, 256)).success) throw new RequestError("Permintaan tidak valid.", 400);
    const { error } = await client.storage.from(avatarBucket).remove([avatarPath(user.id)]);
    if (error) throw new RequestError("Foto belum dapat dihapus. Coba lagi.", 503);
    return Response.json({ removed: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return errorResponse(error); }
}
