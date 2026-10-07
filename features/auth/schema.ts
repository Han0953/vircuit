import { z } from "zod";
export const loginSchema = z.object({ email: z.email().max(254), password: z.string().min(1, "Masukkan kata sandi.").max(128, "Maksimal 128 karakter.") }).strict();
export const registerSchema = loginSchema.extend({ password: z.string().min(8, "Gunakan minimal 8 karakter.").max(128, "Maksimal 128 karakter.") });
