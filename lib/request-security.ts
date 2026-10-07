export class RequestError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export function requireSameOrigin(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) throw new RequestError("Asal permintaan tidak diizinkan.", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new RequestError("Gunakan JSON.", 415);
}
export async function limitedJson(request: Request, limit: number): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError("Body kosong.", 400);
  let size = 0; const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new RequestError("Payload terlalu besar.", 413); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new RequestError("JSON tidak valid.", 400); }
  } finally { reader.releaseLock(); }
}
export function errorResponse(error: unknown) {
  return Response.json({ error: error instanceof RequestError ? error.message : "Layanan belum dapat diakses. Coba lagi." }, { status: error instanceof RequestError ? error.status : 503, headers: { "Cache-Control": "private, no-store" } });
}
