import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
export const recoveryCookie = "vircuit-password-recovery";
export function recoveryProof(accessToken: string) { return createHash("sha256").update(accessToken).digest("hex"); }
export function validRecoveryProof(cookie: string | undefined, accessToken: string) {
  return !!cookie && /^[a-f0-9]{64}$/.test(cookie) && timingSafeEqual(Buffer.from(cookie, "hex"), Buffer.from(recoveryProof(accessToken), "hex"));
}
