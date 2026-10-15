"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { readPreferences } from "@/features/settings/preferences";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { loginSchema, registerSchema } from "../schema";
import { safeDestination } from "../redirect";
import { useAuthTransition } from "../motion/auth-transition";

const subscribeHydration = () => () => {};
export function AuthForm({ register = false, active = true, switching = false, next: destination, callbackError = false, accountDeleted = false, passwordUpdated = false, onBusy }: { register?: boolean; active?: boolean; switching?: boolean; next?: string; callbackError?: boolean; accountDeleted?: boolean; passwordUpdated?: boolean; onBusy?: (mode: "login" | "register", value: boolean) => void }) {
  const hydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const transition = useAuthTransition();
  const router = useRouter();
  const next = safeDestination(destination);
  const mode = register ? "register" : "login";
  const [message, setMessage] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const alive = useRef(true);
  const form = useForm<{ email: string; password: string }>({ resolver: zodResolver(register ? registerSchema : loginSchema), defaultValues: { email: "", password: "" } });
  const busy = form.formState.isSubmitting || googleLoading;
  useEffect(() => { onBusy?.(mode, busy); }, [onBusy, mode, busy]);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  async function submit(credentials: { email: string; password: string }) {
    setMessage("");
    try {
      const response = await fetch(`/api/auth/${register ? "register" : "login"}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credentials, next }), signal: AbortSignal.timeout(15000) });
      const data = await response.json();
      if (!alive.current) return;
      if (!response.ok) { setMessage(data.error ?? "Autentikasi gagal."); return; }
      if (data.confirmation) { setMessage("Periksa email untuk konfirmasi akun, lalu kembali masuk. Draft lokal tetap disimpan."); return; }
      const session = await fetch("/api/auth/session", { cache: "no-store", signal: AbortSignal.timeout(5000) });
      const value = await session.json();
      if (!alive.current) return;
      if (!session.ok || typeof value.user?.id !== "string") { setMessage("Sesi belum dapat diverifikasi. Coba masuk kembali."); return; }
      form.reset();
      if (readPreferences(value.user.id).motion === "reduced") router.replace(safeDestination(data.next));
      else transition.start(safeDestination(data.next));
    } catch { if (alive.current) setMessage("Koneksi gagal. Coba lagi; draft tetap aman di browser ini."); }
  }
  async function google() {
    setGoogleLoading(true); setMessage("");
    try {
      const response = await fetch("/api/auth/google", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ next }), signal: AbortSignal.timeout(10000) });
      const data = await response.json();
      if (!alive.current) return;
      if (!response.ok || typeof data.url !== "string") { setMessage(data.error ?? "Login Google belum tersedia untuk saat ini. Gunakan email untuk masuk."); return; }
      window.location.assign(data.url);
    } catch { if (alive.current) setMessage("Google belum dapat diakses. Coba masuk dengan email."); }
    finally { if (alive.current) setGoogleLoading(false); }
  }
  const notice = message || (passwordUpdated ? "Kata sandi berhasil diperbarui. Silakan masuk kembali." : callbackError ? "Autentikasi belum selesai atau tautan kedaluwarsa. Draft tetap tersedia." : accountDeleted ? "Akun berhasil dihapus. Kamu bisa masuk dengan akun lain atau membuat akun baru." : "");
  return <section data-auth-panel className="auth-panel" hidden={!active} inert={!active || switching} aria-label={register ? "Pendaftaran" : "Login"}>
    <p data-auth-motion className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">{register ? "Mulai di sini" : "Selamat datang kembali"}</p>
    <h1 data-auth-motion tabIndex={-1} className="mt-3 text-3xl font-semibold tracking-tight outline-none sm:text-4xl">{register ? "Daftar ke Vircuit" : "Masuk ke Vircuit"}</h1>
    <p data-auth-motion className="mt-3 text-sm leading-relaxed text-text-secondary">Simpan proyek dan lanjutkan rangkaianmu. Simulator tetap tersedia tanpa akun.</p>
    <form noValidate onSubmit={(event) => void form.handleSubmit(submit)(event)} className="mt-7">
      <fieldset disabled={!hydrated || busy || !active || switching} className="space-y-4">
        <div data-auth-motion><label htmlFor={`${mode}-email`} className="text-sm font-medium">Email</label><Input id={`${mode}-email`} aria-label={active ? undefined : "Email nonaktif"} type="email" autoComplete="email" className="mt-2" aria-invalid={!!form.formState.errors.email} aria-describedby={`${mode}-email-error`} {...form.register("email")} /><p id={`${mode}-email-error`} className="mt-1 text-xs text-destructive">{form.formState.errors.email?.message && "Masukkan email yang valid."}</p></div>
        <div data-auth-motion><label htmlFor={`${mode}-password`} className="text-sm font-medium">Kata sandi</label><div className="mt-2"><PasswordInput key={`${mode}-${active}`} id={`${mode}-password`} aria-label={active ? undefined : "Kata sandi nonaktif"} autoComplete={register ? "new-password" : "current-password"} aria-invalid={!!form.formState.errors.password} aria-describedby={`${mode}-password-error`} {...form.register("password")} /></div><p id={`${mode}-password-error`} className="mt-1 text-xs text-destructive">{form.formState.errors.password?.message}</p></div>
        {!register && <p data-auth-motion className="text-right text-sm"><Link href="/lupa-kata-sandi" className="text-primary hover:underline">Lupa kata sandi?</Link></p>}
        <Button data-auth-motion type="submit" className="w-full">{form.formState.isSubmitting && <LoaderCircle aria-hidden className="animate-spin" />}{register ? "Daftar dengan email" : "Masuk dengan email"}</Button>
      </fieldset>
    </form>
    <Button data-auth-motion variant="outline" disabled={!hydrated || busy || switching} onClick={() => void google()} className="mt-3 w-full">{googleLoading ? <LoaderCircle aria-hidden className="animate-spin" /> : <span aria-hidden className="font-semibold">G</span>}Lanjutkan dengan Google</Button>
    {notice && <p role="status" data-auth-feedback className="mt-4 rounded-lg border bg-surface-muted p-3 text-sm leading-relaxed">{notice}</p>}
    <p data-auth-motion className="mt-6 text-sm text-text-secondary"><Link aria-disabled={busy} tabIndex={busy ? -1 : undefined} onClick={(event) => { if (busy) event.preventDefault(); }} className="text-primary hover:underline" href={`${register ? "/masuk" : "/daftar"}?next=${encodeURIComponent(next)}`}>{register ? "Sudah punya akun? Masuk" : "Belum punya akun? Daftar"}</Link></p>
    <Button data-auth-motion asChild variant="ghost" className="mt-2 w-full"><Link href="/simulator">Lanjutkan sebagai tamu</Link></Button>
  </section>;
}
