"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { resetPasswordSchema } from "../schema";

export function RecoveryForm({ reset = false, valid = true }: { reset?: boolean; valid?: boolean }) {
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const form = useForm({ resolver: zodResolver(z.object({ email: z.email().max(254) })), defaultValues: { email: "" } });
  const password = useForm({ resolver: zodResolver(resetPasswordSchema), defaultValues: { password: "", confirmation: "" } });
  async function send(values: unknown) {
    setMessage("");
    try {
      const response = await fetch(`/api/auth/${reset ? "reset" : "recover"}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values), signal: AbortSignal.timeout(15000) });
      const data = await response.json();
      if (!response.ok) { setMessage(data.error ?? "Permintaan belum dapat diproses."); return; }
      if (reset) { password.reset(); window.location.replace("/masuk?password=updated"); }
      else { setDone(true); setMessage("Jika email tersebut terdaftar, tautan pemulihan akan dikirim. Periksa kotak masuk dan spam."); }
    } catch { setMessage("Koneksi gagal. Coba lagi."); }
  }
  const pending = form.formState.isSubmitting || password.formState.isSubmitting;
  return <section className="mx-auto max-w-md rounded-2xl border bg-surface p-6 sm:p-8"><h1 className="text-3xl font-semibold tracking-tight">{reset ? "Atur ulang kata sandi" : "Lupa kata sandi?"}</h1><p className="mt-3 text-sm leading-relaxed text-text-secondary">{reset ? "Gunakan kata sandi baru minimal 8 karakter." : "Masukkan email akunmu untuk menerima tautan pemulihan."}</p>
    {!valid ? <p role="alert" className="mt-5 text-sm">Tautan tidak valid atau sudah kedaluwarsa. <Link className="text-primary underline" href="/lupa-kata-sandi">Minta tautan baru</Link>.</p> : reset ? <form className="mt-6 space-y-4" noValidate onSubmit={password.handleSubmit(send)}>{(["password", "confirmation"] as const).map((name) => <div key={name}><label htmlFor={`reset-${name}`} className="text-sm font-medium">{name === "password" ? "Kata sandi baru" : "Konfirmasi kata sandi"}</label><PasswordInput className="mt-2 min-h-11" id={`reset-${name}`} autoComplete="new-password" disabled={pending} aria-invalid={!!password.formState.errors[name]} aria-describedby={`reset-error-${name}`} {...password.register(name)} /><p id={`reset-error-${name}`} className="mt-1 text-sm text-destructive">{password.formState.errors[name]?.message}</p></div>)}<Button disabled={pending} className="min-h-11 w-full">{pending ? "Menyimpan…" : "Simpan kata sandi"}</Button></form> : <form className="mt-6 space-y-4" noValidate onSubmit={form.handleSubmit(send)}><div><label htmlFor="recovery-email" className="text-sm font-medium">Email</label><Input className="mt-2 min-h-11 text-base" id="recovery-email" type="email" autoComplete="email" disabled={pending} aria-invalid={!!form.formState.errors.email} aria-describedby="recovery-error" {...form.register("email")} /><p id="recovery-error" className="mt-1 text-sm text-destructive">{form.formState.errors.email && "Masukkan email yang valid."}</p></div><Button disabled={pending} className="min-h-11 w-full">{pending ? "Mengirim…" : done ? "Kirim ulang tautan" : "Kirim tautan pemulihan"}</Button></form>}
    {message && <p role="status" className="mt-4 rounded-lg border p-3 text-sm leading-relaxed">{message}</p>}<Link href="/masuk" className="mt-6 inline-flex min-h-11 items-center text-sm text-primary hover:underline">Kembali masuk</Link>
  </section>;
}
