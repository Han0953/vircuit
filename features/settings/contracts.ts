import { z } from "zod";
import type { User } from "@supabase/supabase-js";

export const displayNameSchema = z.string().trim().min(2, "Gunakan 2–100 karakter.").max(100, "Maksimal 100 karakter.").refine((value) => !/[\p{Cc}\p{Cf}<>@]/u.test(value), "Gunakan nama tanpa alamat email, markup, atau karakter kontrol.");
export const profileSchema = z.object({ displayName: displayNameSchema }).strict();
export const emailSchema = z.object({ email: z.email("Masukkan email yang valid.").max(254) }).strict();
export const passwordSchema = z.object({
  currentPassword: z.string().max(128).default(""),
  password: z.string().min(8, "Gunakan minimal 8 karakter.").max(128),
  confirmation: z.string().max(128),
  nonce: z.string().regex(/^\d{6,10}$/, "Kode verifikasi tidak valid.").or(z.literal("")),
}).strict().refine((v) => v.password === v.confirmation, { message: "Kata sandi tidak cocok.", path: ["confirmation"] });
export const accountActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("email"), ...emailSchema.shape }).strict(),
  z.object({ action: z.literal("password"), values: passwordSchema }).strict(),
  z.object({ action: z.literal("reauthenticate") }).strict(),
]);
export const preferencesSchema = z.object({
  motion: z.enum(["system", "full", "reduced"]),
  density: z.enum(["comfortable", "compact"]),
  grid: z.boolean(),
  snap: z.boolean(),
  reading: z.enum(["standard", "large"]),
  dashboardSidebar: z.enum(["expanded", "collapsed"]).default("expanded"),
}).strict();
export type Preferences = z.infer<typeof preferencesSchema>;
export const defaultPreferences: Preferences = { motion: "system", density: "comfortable", grid: true, snap: false, reading: "standard", dashboardSidebar: "expanded" };
export function safeProfileName(saved: unknown, metadata: Record<string, unknown>): string {
  for (const value of [saved, metadata.display_name, metadata.full_name, metadata.name]) {
    const result = displayNameSchema.safeParse(value);
    if (result.success && !result.data.includes("@")) return result.data;
  }
  return "Pengguna Vircuit";
}
export function accountInformation(user: User) {
  const providers = [...new Set((user.identities ?? []).map((identity) => identity.provider))];
  return { email: user.email ?? "", pendingEmail: user.new_email ?? "", providers, hasPassword: providers.includes("email"), createdAt: user.created_at, verified: !!user.email_confirmed_at };
}
