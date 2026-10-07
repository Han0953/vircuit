"use client";
import { useState, useSyncExternalStore } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircuitBoard, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginSchema, registerSchema } from "../schema";
import { safeDestination } from "../redirect";
import { enterLocalDemo, exitLocalDemo } from "../demo";
const subscribeHydration = () => () => {};

export function AuthForm({ register = false, next: destination, callbackError = false }: { register?: boolean; next?: string; callbackError?: boolean }) {
  const router = useRouter();
  const hydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const next = safeDestination(destination);
  const [message, setMessage] = useState(callbackError ? "Autentikasi belum selesai atau tautan kedaluwarsa. Draft tetap tersedia." : "");
  const [googleLoading, setGoogleLoading] = useState(false);
  const form = useForm<{ email: string; password: string }>({ resolver: zodResolver(register ? registerSchema : loginSchema), defaultValues: { email: "", password: "" } });
  const busy = form.formState.isSubmitting || googleLoading;
  async function submit(credentials: { email: string; password: string }) {
    exitLocalDemo();
    setMessage("");
    try {
      const response = await fetch(`/api/auth/${register ? "register" : "login"}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credentials, next }) });
      const data = await response.json();
      if (!response.ok) { setMessage(data.error ?? "Autentikasi gagal."); return; }
      if (data.confirmation) { setMessage("Periksa email untuk konfirmasi akun, lalu kembali masuk. Draft lokal tetap disimpan."); return; }
      router.replace(safeDestination(data.next));
    } catch { setMessage("Koneksi gagal. Coba lagi; draft tetap aman di browser ini."); }
  }
  async function google() {
    exitLocalDemo();
    setGoogleLoading(true); setMessage("");
    try {
      const response = await fetch("/api/auth/google", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ next }) });
      const data = await response.json();
      if (!response.ok || typeof data.url !== "string") { setMessage(data.error ?? "Google belum tersedia."); return; }
      window.location.assign(data.url);
    } catch { setMessage("Google belum dapat diakses. Coba masuk dengan email."); }
    finally { setGoogleLoading(false); }
  }
  return <div className="mx-auto flex min-h-[calc(100svh-12rem)] max-w-md flex-col justify-center px-4 py-12">
    <div className="rounded-xl border bg-surface p-6 sm:p-8">
      <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold focus-visible:ring-2 focus-visible:ring-ring"><CircuitBoard aria-hidden className="text-primary" />Vircuit</Link>
      <h1 className="mt-5 text-2xl font-bold">{register ? "Daftar ke Vircuit" : "Masuk ke Vircuit"}</h1>
      <p className="mt-2 text-sm text-text-secondary">Simpan proyek dan lanjutkan rangkaianmu. Simulator tetap tersedia tanpa akun.</p>
      <form noValidate onSubmit={form.handleSubmit(submit)} className="mt-6 space-y-4">
        <div><label htmlFor="auth-email" className="text-sm font-medium">Email</label><Input id="auth-email" type="email" autoComplete="email" disabled={busy} aria-invalid={!!form.formState.errors.email} aria-describedby="email-error" {...form.register("email")} /><p id="email-error" className="mt-1 text-xs text-destructive">{form.formState.errors.email?.message && "Masukkan email yang valid."}</p></div>
        <div><label htmlFor="auth-password" className="text-sm font-medium">Kata sandi</label><Input id="auth-password" type="password" autoComplete={register ? "new-password" : "current-password"} disabled={busy} aria-invalid={!!form.formState.errors.password} aria-describedby="password-error" {...form.register("password")} /><p id="password-error" className="mt-1 text-xs text-destructive">{form.formState.errors.password?.message}</p></div>
        <Button type="submit" disabled={busy} className="min-h-11 w-full">{form.formState.isSubmitting && <LoaderCircle aria-hidden className="animate-spin" />}{register ? "Daftar dengan email" : "Masuk dengan email"}</Button>
      </form>
      <Button variant="outline" disabled={busy} onClick={() => void google()} className="mt-3 min-h-11 w-full">{googleLoading && <LoaderCircle aria-hidden className="animate-spin" />}Lanjutkan dengan Google</Button>
      {message && <p role="status" className="mt-4 text-sm leading-relaxed">{message}</p>}
      <p className="mt-6 text-sm"><Link className="text-primary underline focus-visible:ring-2 focus-visible:ring-ring" href={`${register ? "/masuk" : "/daftar"}?next=${encodeURIComponent(next)}`}>{register ? "Sudah punya akun? Masuk" : "Belum punya akun? Daftar"}</Link></p>
      <Button asChild variant="ghost" className="mt-3 w-full"><Link href="/simulator" onClick={() => exitLocalDemo()}>Lanjutkan sebagai tamu</Link></Button>
      {process.env.NODE_ENV === "development" && <Button disabled={!hydrated || busy} variant="outline" className="mt-3 w-full" onClick={() => { enterLocalDemo(); window.location.replace("/demo"); }}>Masuk sebagai akun testing lokal</Button>}
    </div>
  </div>;
}
