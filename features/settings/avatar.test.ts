import { describe, it, expect } from "vitest";
import { avatarBytes, avatarLimit, validateAvatar } from "./avatar";

function webp(width = 256, height = 256) {
  const bytes = new Uint8Array(30), view = new DataView(bytes.buffer);
  bytes.set(new TextEncoder().encode("RIFF")); view.setUint32(4,22,true);
  bytes.set(new TextEncoder().encode("WEBPVP8 "),8); view.setUint32(16,10,true);
  bytes.set([0x9d,1,0x2a],23); view.setUint16(26,width,true); view.setUint16(28,height,true);
  return bytes;
}
describe("avatar file boundary", () => {
  it("accepts bounded WebP dimensions and rejects scripts, metadata, animation and oversized dimensions", () => {
    expect(() => validateAvatar(webp())).not.toThrow();
    for (const bytes of [new TextEncoder().encode("<svg onload='alert(1)'/>"), webp(513), webp(0), new Uint8Array(avatarLimit + 1)]) expect(() => validateAvatar(bytes)).toThrow();
    const metadata = webp(); metadata.set(new TextEncoder().encode("EXIF"),12);
    expect(() => validateAvatar(metadata)).toThrow();
  });
  it("bounds streaming bytes without trusting content length", async () => {
    await expect(avatarBytes(new Request("https://vircuit.test", { method: "POST", body: new Uint8Array(avatarLimit + 1) }))).rejects.toMatchObject({ status: 413 });
  });
});
