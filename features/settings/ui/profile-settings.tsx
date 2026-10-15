"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DashboardIdentity } from "@/features/dashboard/ui/user-menu";
import { profileSchema } from "../contracts";
import { settingsRequest } from "../request";
import { Feedback, SettingGroup, SettingsSection } from "./setting-controls";
import { AvatarSettings } from "./avatar-settings";

const subscribeHydration = () => () => {};
export function ProfileSettings({ user, onDirty }: { user: DashboardIdentity; onDirty: (dirty: boolean) => void }) {
  const hydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const router = useRouter();
  const locked = useRef(false);
  const [feedback, setFeedback] = useState({ message: "", error: false });
  const form = useForm({ resolver: zodResolver(profileSchema), defaultValues: { displayName: user.name === "Pengguna Vircuit" ? "" : user.name } });
  const { isDirty, isSubmitting, errors } = form.formState;
  useEffect(() => onDirty(isDirty), [isDirty, onDirty]);
  return <SettingsSection title="Profil Saya" description="Ubah nama dan foto profilmu.">
    <AvatarSettings user={user} />
    <form onSubmit={(event) => void form.handleSubmit(async (values) => {
      if (locked.current) return; locked.current = true; setFeedback({ message: "", error: false });
      try {
        const result = await settingsRequest("profile", "PATCH", values, user.id);
        if (typeof result.displayName !== "string") throw new Error("Konfirmasi profil tidak valid.");
        form.reset({ displayName: result.displayName });
        setFeedback({ message: "Nama profil berhasil disimpan.", error: false });
        const channel = new BroadcastChannel("vircuit-auth"); channel.postMessage("profile-updated"); channel.close();
        router.refresh();
      } catch (error) { setFeedback({ message: error instanceof Error ? error.message : "Profil belum tersimpan.", error: true }); }
      finally { locked.current = false; }
    })(event)} className="space-y-5">
      <SettingGroup><div className="space-y-2"><label htmlFor="display-name" className="text-sm font-medium">Nama tampilan</label><Input id="display-name" disabled={!hydrated || isSubmitting} autoComplete="nickname" maxLength={100} aria-invalid={!!errors.displayName} aria-describedby="name-help name-error" {...form.register("displayName")} /><p id="name-help" className="text-xs text-text-secondary">2–100 karakter. Nama ini digunakan di dashboard.</p><p id="name-error" role={errors.displayName ? "alert" : undefined} className="text-sm text-destructive">{errors.displayName?.message}</p></div><div className="space-y-2"><label htmlFor="profile-email" className="text-sm font-medium">Email akun</label><Input id="profile-email" value={user.email} readOnly type="email" /><p className="text-xs text-text-secondary">Kelola alamat email melalui Akun &amp; Keamanan.</p></div></SettingGroup>
      <div data-settings-motion className="flex flex-wrap items-center gap-3"><Button disabled={!hydrated || isSubmitting || !isDirty} type="submit">{isSubmitting ? "Menyimpan…" : "Simpan profil"}</Button><Button variant="outline" type="button" disabled={!isDirty || isSubmitting} onClick={() => { form.reset(); setFeedback({ message: "Perubahan profil dibatalkan.", error: false }); }}>Batalkan perubahan</Button><span className="text-xs text-text-secondary">{isDirty ? "Ada perubahan belum disimpan" : "Tidak ada perubahan formulir"}</span></div>
      <Feedback {...feedback} />
    </form>
  </SettingsSection>;
}
