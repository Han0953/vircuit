"use client";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import type { DashboardIdentity } from "@/features/dashboard/ui/user-menu";
import { LogoutButton } from "@/features/dashboard/ui/logout-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { accountInformation, emailSchema, passwordSchema } from "../contracts";
import { settingsRequest } from "../request";
import { Feedback, SettingGroup, SettingsSection } from "./setting-controls";

export function AccountSettings({ user, account, onDirty, anyDirty }: { user: DashboardIdentity; account: ReturnType<typeof accountInformation>; onDirty: (dirty: boolean) => void; anyDirty: boolean }) {
  const router = useRouter();
  const email = useForm({ resolver: zodResolver(emailSchema), defaultValues: { email: "" } });
  const password = useForm({ resolver: zodResolver(passwordSchema), defaultValues: { currentPassword: "", password: "", confirmation: "", nonce: "" } });
  const dirty = email.formState.isDirty || password.formState.isDirty;
  useEffect(() => onDirty(dirty), [dirty, onDirty]);
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState({ message: "", error: false });
  const [requestedEmail, setPendingEmail] = useState<string | null>(null);
  const pendingEmail = account.email === requestedEmail ? account.pendingEmail : requestedEmail ?? account.pendingEmail;
  async function send(body: unknown): Promise<boolean> {
    if (lock.current) return false;
    lock.current = true; setBusy(true); setFeedback({ message: "", error: false });
    try {
      const result = await settingsRequest("account", "POST", body, user.id);
      setFeedback({ message: typeof result.message === "string" ? result.message : "Permintaan selesai.", error: false });
      if (typeof result.pendingEmail === "string") setPendingEmail(result.pendingEmail);
      router.refresh(); return true;
    } catch (error) { setFeedback({ message: error instanceof Error ? error.message : "Permintaan belum berhasil.", error: true }); return false; }
    finally { lock.current = false; setBusy(false); }
  }
  return <SettingsSection title="Akun & Keamanan" description="Kelola akses akunmu melalui autentikasi aman Vircuit.">
    <SettingGroup><dl className="grid gap-4 text-sm sm:grid-cols-2">{[["Email terdaftar", account.email || "Tidak tersedia"], ["Metode masuk", account.providers.join(", ") || "Tidak tersedia"], ["Dibuat pada", account.createdAt ? new Date(account.createdAt).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "long" }) : "Tidak tersedia"], ["Verifikasi email", account.verified ? "Terverifikasi" : "Belum terverifikasi"]].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-text-secondary">{label}</dt><dd className="mt-1 break-words font-medium">{value}</dd></div>)}</dl>{pendingEmail && <p role="status" className="break-words text-sm">Menunggu konfirmasi: {pendingEmail}. Email akun berubah setelah konfirmasi selesai.</p>}</SettingGroup>
    <form className="space-y-4" onSubmit={(event) => void email.handleSubmit(async (values) => { if (await send({ action: "email", ...values })) email.reset(); })(event)}><SettingGroup><h3 className="font-medium">Ubah alamat email</h3><p className="text-sm text-text-secondary">Ikuti tautan konfirmasi yang dikirim ke emailmu. Perubahan belum selesai sampai email dikonfirmasi.</p><label className="block space-y-2"><span className="text-sm">Email baru</span><Input type="email" autoComplete="email" aria-invalid={!!email.formState.errors.email} aria-describedby="email-error" {...email.register("email")} /></label><p id="email-error" role={email.formState.errors.email ? "alert" : undefined} className="text-sm text-destructive">{email.formState.errors.email?.message}</p><Button disabled={busy} type="submit">Kirim konfirmasi email</Button></SettingGroup></form>
    <form className="space-y-4" onSubmit={(event) => void password.handleSubmit(async (values) => { if (await send({ action: "password", values })) password.reset(); })(event)}><SettingGroup><h3 className="font-medium">{account.hasPassword ? "Ubah kata sandi" : "Atur kata sandi"}</h3><p className="text-sm text-text-secondary">{account.hasPassword ? "Konfirmasi kata sandi saat ini. Jika akun meminta verifikasi tambahan, gunakan kode dari email." : "Masuk melalui Google? Verifikasi emailmu sebelum mengatur kata sandi."}</p>{([...(account.hasPassword ? [{ name: "currentPassword" as const, label: "Kata sandi saat ini", autocomplete: "current-password" }] : []), { name: "password" as const, label: "Kata sandi baru", autocomplete: "new-password" }, { name: "confirmation" as const, label: "Konfirmasi kata sandi", autocomplete: "new-password" }, { name: "nonce" as const, label: "Kode verifikasi keamanan", autocomplete: "one-time-code" }]).map(({ name, label, autocomplete }) => <div key={name} className="space-y-2"><label htmlFor={name} className="text-sm">{label}</label>{name === "nonce" ? <Input id={name} type="text" inputMode="numeric" autoComplete={autocomplete} maxLength={10} aria-invalid={!!password.formState.errors[name]} aria-describedby={`${name}-error`} {...password.register(name)} /> : <PasswordInput id={name} visibilityLabel={label.toLowerCase()} autoComplete={autocomplete} maxLength={128} disabled={busy} aria-invalid={!!password.formState.errors[name]} aria-describedby={`${name}-error`} {...password.register(name)} />}<p id={`${name}-error`} role={password.formState.errors[name] ? "alert" : undefined} className="text-sm text-destructive">{password.formState.errors[name]?.message}</p></div>)}<p className="text-xs text-text-secondary">Minimal 8 karakter.</p><div className="flex flex-wrap gap-3"><Button variant="outline" disabled={busy} type="button" onClick={() => void send({ action: "reauthenticate" })}>Kirim kode keamanan</Button><Button disabled={busy} type="submit">{busy ? "Memproses…" : "Simpan kata sandi"}</Button></div></SettingGroup></form>
    <Feedback {...feedback} />
    <SettingGroup><h3 className="font-medium">Sesi akun</h3><p className="text-sm text-text-secondary">Keluar memakai alur pemulihan draft yang sama dengan sidebar. Unduh cadangan yang diperlukan sebelum cache akun dibersihkan.</p><LogoutButton user={user} disabled={anyDirty || busy} />{anyDirty && <p className="text-xs text-text-secondary">Simpan atau batalkan perubahan formulir sebelum keluar.</p>}<Button variant="ghost" disabled={!dirty || busy} onClick={() => { email.reset(); password.reset(); }}>Batalkan perubahan akun</Button></SettingGroup>
  </SettingsSection>;
}
