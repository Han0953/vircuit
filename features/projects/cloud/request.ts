export class CloudError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export async function cloudRequest(path: string, method = "GET", body?: unknown, headers: Record<string, string> = {}) {
  let response: Response;
  let data: unknown;
  try {
    response = await fetch(path, { method, cache: "no-store", signal: AbortSignal.timeout(20000), headers: { ...headers, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    data = await response.json();
  } catch { throw new CloudError("Koneksi cloud gagal. Draft lokal tetap tersedia. Coba lagi.", 0); }
  if (!response.ok) {
    const message = data && typeof data === "object" && "error" in data && typeof data.error === "string" ? data.error : "Permintaan gagal.";
    throw new CloudError(message, response.status);
  }
  return data;
}
