"use client";
import { useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { resetWorkspaceLayout } from "@/features/simulator/ui/workspace/layout-preferences";
import { usePreferences, savePreferences } from "../preferences";
import type { Preferences } from "../contracts";
import { Choices, Feedback, SettingGroup, SettingsSection } from "./setting-controls";

const subscribe = () => () => {};
export function PreferenceSettings({ owner, category }: { owner: string; category: "appearance" | "lab" | "learning" }) {
  const values = usePreferences(owner);
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const [feedback, setFeedback] = useState({ message: "", error: false });
  function update(patch: Partial<Preferences>) {
    try { savePreferences(owner, { ...values, ...patch }); setFeedback({ message: "Pilihan disimpan di browser ini.", error: false }); }
    catch { setFeedback({ message: "Browser tidak dapat menyimpan preferensi. Periksa izin penyimpanan lalu coba lagi.", error: true }); }
  }
  return <SettingsSection title={category === "appearance" ? "Tampilan & Personalisasi" : category === "lab" ? "Preferensi Virtual Lab" : "Preferensi Pembelajaran"} description={category === "appearance" ? "Pilih tema dan animasi yang nyaman buatmu. Perubahan langsung terlihat." : category === "lab" ? "Atur grid dan ukuran panel di Virtual Lab." : "Pilih ukuran teks yang enak dibaca saat belajar."}>
    {category === "appearance" && <><SettingGroup>{mounted ? <Choices label="Tema aplikasi" value={theme ?? "system"} options={[{ value: "light", label: "Terang" }, { value: "dark", label: "Gelap" }, { value: "system", label: "Sistem" }]} onChange={(value) => { try { setTheme(value); setFeedback({ message: "Tema berhasil diganti.", error: false }); } catch { setFeedback({ message: "Tema belum dapat disimpan.", error: true }); } }} /> : <p role="status">Memuat pilihan tema…</p>}</SettingGroup><SettingGroup><Choices label="Animasi antarmuka" value={values.motion} options={[{ value: "system", label: "Ikuti sistem" }, { value: "full", label: "Animasi penuh" }, { value: "reduced", label: "Kurangi animasi" }]} onChange={(motion) => update({ motion })} /><p className="text-xs leading-relaxed text-text-secondary">Berlaku di dashboard dan pengaturan. Animasi halaman utama dan 3D mengikuti pengaturan perangkatmu.</p></SettingGroup><SettingGroup><Choices label="Kepadatan dashboard" value={values.density} options={[{ value: "comfortable", label: "Nyaman", description: "Lebih banyak ruang antar konten" }, { value: "compact", label: "Ringkas", description: "Kartu dan daftar lebih padat" }]} onChange={(density) => update({ density })} /></SettingGroup></>}
    {category === "lab" && <><SettingGroup>{([{ key: "grid", title: "Tampilkan grid canvas", description: "Tampilkan titik bantu saat menyusun komponen." }, { key: "snap", title: "Snap ke grid", description: "Komponen mengikuti jarak grid saat digeser." }] as const).map(({ key, title, description }) => <label key={key} className="flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-lg border p-3 has-focus-visible:ring-2 has-focus-visible:ring-ring"><span><span className="block text-sm font-medium">{title}</span><span className="mt-1 block text-xs text-text-secondary">{description}</span></span><input type="checkbox" checked={values[key]} onChange={(event) => update({ [key]: event.target.checked })} className="size-5 shrink-0 accent-primary" /></label>)}<p className="text-xs leading-relaxed text-text-secondary">Pilihan ini disimpan di browser ini. Rangkaian dan kode proyekmu tetap sama.</p></SettingGroup><SettingGroup><h3 className="font-medium">Pulihkan layout workspace</h3><p className="text-sm text-text-secondary">Kembalikan panel komponen, properti, dan monitor ke ukuran awal. Rangkaianmu tidak dihapus.</p><Button variant="outline" onClick={() => { try { resetWorkspaceLayout(); setFeedback({ message: "Layout workspace dipulihkan ke ukuran bawaan.", error: false }); } catch { setFeedback({ message: "Layout tidak dapat disimpan. Periksa izin penyimpanan browser.", error: true }); } }}>Reset layout workspace</Button></SettingGroup></>}
    {category === "learning" && <SettingGroup><Choices label="Ukuran bacaan pelajaran" value={values.reading} options={[{ value: "standard", label: "Standar", description: "Ukuran bacaan bawaan" }, { value: "large", label: "Lebih besar", description: "Teks materi lebih mudah dibaca" }]} onChange={(reading) => update({ reading })} /><p className="text-xs text-text-secondary">Ukuran teks berubah di halaman materi. Progres belajarmu tetap tersimpan.</p></SettingGroup>}
    <Feedback {...feedback} />
  </SettingsSection>;
}
