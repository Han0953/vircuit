export async function settingsRequest(path: "profile" | "account", method: "PATCH" | "POST", body: unknown, owner: string): Promise<Record<string, unknown>> {
  let response: Response;
  try {
    response = await fetch(`/api/settings/${path}`, { method, cache: "no-store", signal: AbortSignal.timeout(20000), headers: { "Content-Type": "application/json", "x-vircuit-owner": owner }, body: JSON.stringify(body) });
  } catch { throw new Error("Koneksi gagal. Perubahan belum dikonfirmasi; periksa koneksi lalu coba lagi."); }
  let data: unknown;
  try { data = await response.json(); } catch { throw new Error("Respons tidak valid. Periksa koneksi lalu coba lagi."); }
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Respons tidak valid. Coba lagi.");
  if (!response.ok) throw new Error("error" in data && typeof data.error === "string" ? data.error : "Permintaan belum berhasil.");
  return Object.fromEntries(Object.entries(data));
}
