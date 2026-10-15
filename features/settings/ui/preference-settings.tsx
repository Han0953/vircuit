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
    try { savePreferences(owner, { ...values, ...patch }); setFeedback({ message: "Preferensi disimpan di browser ini untuk akunmu.", error: false }); }
    catch { setFeedback({ message: "Browser tidak dapat menyimpan preferensi. Periksa izin penyimpanan lalu coba lagi.", error: true }); }
  }
  return <SettingsSection title={category === "appearance" ? "Tampilan & Personalisasi" : category === "lab" ? "Preferensi Virtual Lab" : "Preferensi Pembelajaran"} description={category === "appearance" ? "Buat ruang kerja terasa nyaman. Perubahan diterapkan langsung." : category === "lab" ? "Sesuaikan interaksi canvas tanpa mengubah rangkaian atau proyek tersimpan." : "Sesuaikan keterbacaan materi. Penyelesaian pelajaran dan tantangan tetap mengikuti aktivitas belajarmu."}>
    {category === "appearance" && <><SettingGroup>{mounted ? <Choices label="Tema aplikasi" value={theme ?? "system"} options={[{ value: "light", label: "Terang" }, { value: "dark", label: "Gelap" }, { value: "system", label: "Sistem" }]} onChange={(value) => { try { setTheme(value); setFeedback({ message: "Tema diterapkan. Pilihan tema tersinkronisasi dengan header.", error: false }); } catch { setFeedback({ message: "Tema belum dapat disimpan.", error: true }); } }} /> : <p role="status">Memuat pilihan tema…</p>}</SettingGroup><SettingGroup><Choices label="Animasi antarmuka" value={values.motion} options={[{ value: "system", label: "Ikuti sistem" }, { value: "full", label: "Animasi penuh" }, { value: "reduced", label: "Kurangi animasi" }]} onChange={(motion) => update({ motion })} /><p className="text-xs leading-relaxed text-text-secondary">Mengatur animasi dashboard dan Settings. Pembatasan gerak sistem untuk efek CSS tetap dihormati. Halaman publik dan 3D masih mengikuti sistem.</p></SettingGroup><SettingGroup><Choices label="Kepadatan dashboard" value={values.density} options={[{ value: "comfortable", label: "Nyaman", description: "Lebih banyak ruang antar konten" }, { value: "compact", label: "Ringkas", description: "Kartu dan daftar lebih padat" }]} onChange={(density) => update({ density })} /></SettingGroup></>}
    {category === "lab" && <><SettingGroup>{([{ key: "grid", title: "Tampilkan grid canvas", description: "Titik bantu untuk membaca posisi komponen." }, { key: "snap", title: "Snap ke grid", description: "Selaraskan perpindahan komponen ke grid 20 unit." }] as const).map(({ key, title, description }) => <label key={key} className="flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-lg border p-3 has-focus-visible:ring-2 has-focus-visible:ring-ring"><span><span className="block text-sm font-medium">{title}</span><span className="mt-1 block text-xs text-text-secondary">{description}</span></span><input type="checkbox" checked={values[key]} onChange={(event) => update({ [key]: event.target.checked })} className="size-5 shrink-0 accent-primary" /></label>)}<p className="text-xs leading-relaxed text-text-secondary">Grid dan snap adalah preferensi interaksi lokal. Komponen, kabel, warna kabel existing, board, kode, dan viewport proyek tidak diubah saat preferensi diterapkan.</p></SettingGroup><SettingGroup><h3 className="font-medium">Pulihkan layout workspace</h3><p className="text-sm text-text-secondary">Kembalikan ukuran panel Parts, Properties, dan panel bawah serta tampilkan kembali panel desktop. Proyek aktif dan data rangkaian tetap tersedia.</p><Button variant="outline" onClick={() => { try { resetWorkspaceLayout(); setFeedback({ message: "Layout workspace dipulihkan ke ukuran bawaan.", error: false }); } catch { setFeedback({ message: "Layout tidak dapat disimpan. Periksa izin penyimpanan browser.", error: true }); } }}>Reset layout workspace</Button></SettingGroup></>}
    {category === "learning" && <SettingGroup><Choices label="Ukuran bacaan pelajaran" value={values.reading} options={[{ value: "standard", label: "Standar", description: "Ukuran bacaan bawaan" }, { value: "large", label: "Lebih besar", description: "Teks materi lebih mudah dibaca" }]} onChange={(reading) => update({ reading })} /><p className="text-xs text-text-secondary">Berlaku pada teks materi pelajaran di dashboard. Tidak mengubah kesulitan atau progres.</p></SettingGroup>}
    <Feedback {...feedback} />
  </SettingsSection>;
}
