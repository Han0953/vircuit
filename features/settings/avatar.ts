import { RequestError } from "@/lib/request-security";

export const avatarBucket = "profile-avatars";
export const avatarLimit = 512 * 1024;
export const avatarPath = (owner: string) => `${owner}/avatar.webp`;

export async function avatarBytes(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError("Pilih foto terlebih dahulu.", 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > avatarLimit) { await reader.cancel(); throw new RequestError("Foto terlalu besar.", 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const result = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  validateAvatar(result);
  return result;
}

export function validateAvatar(bytes: Uint8Array) {
  const invalid = () => new RequestError("Foto tidak valid. Gunakan JPG, PNG, atau WebP melalui pemilih foto.", 400);
  const text = (offset: number) => String.fromCharCode(...bytes.slice(offset, offset + 4));
  if (bytes.length < 20 || bytes.length > avatarLimit || text(0) !== "RIFF" || text(8) !== "WEBP") throw invalid();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(4, true) + 8 !== bytes.length) throw invalid();
  let image = false;
  for (let offset = 12; offset < bytes.length;) {
    if (offset + 8 > bytes.length) throw invalid();
    const kind = text(offset), size = view.getUint32(offset + 4, true), start = offset + 8;
    if (start + size > bytes.length || !["VP8 ", "VP8L", "VP8X", "ALPH", "ICCP"].includes(kind)) throw invalid();
    if (kind === "ICCP" && (size < 128 || size > 4096 || view.getUint32(start, false) !== size || text(start + 36) !== "acsp")) throw invalid();
    let width = 0, height = 0;
    if (kind === "VP8 ") {
      if (size < 10 || bytes[start + 3] !== 0x9d || bytes[start + 4] !== 1 || bytes[start + 5] !== 0x2a) throw invalid();
      width = view.getUint16(start + 6, true) & 0x3fff; height = view.getUint16(start + 8, true) & 0x3fff; image = true;
    } else if (kind === "VP8L") {
      if (size < 5 || bytes[start] !== 0x2f) throw invalid();
      const bits = view.getUint32(start + 1, true);
      width = (bits & 0x3fff) + 1; height = ((bits >>> 14) & 0x3fff) + 1; image = true;
    } else if (kind === "VP8X") {
      if (size !== 10 || (bytes[start] & 0x02)) throw invalid();
      width = 1 + bytes[start + 4] + (bytes[start + 5] << 8) + (bytes[start + 6] << 16);
      height = 1 + bytes[start + 7] + (bytes[start + 8] << 8) + (bytes[start + 9] << 16);
    }
    if (kind !== "ALPH" && kind !== "ICCP" && (width < 1 || height < 1 || width > 512 || height > 512)) throw invalid();
    offset = start + size + (size & 1);
    if (offset > bytes.length) throw invalid();
  }
  if (!image) throw invalid();
}
