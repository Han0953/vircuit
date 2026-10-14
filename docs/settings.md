# VIRCUIT SETTINGS IMPLEMENTATION RESULT

Tanggal: 14 Oktober 2026. Task utama: VIR-246; Google: VIR-212 / VIR-463.

## Status aktual

Fitur aplikasi Settings yang diminta sudah diimplementasikan dan diuji: profil, avatar privat, kontrol password, logout sidebar, preferensi, data lokal, serta penghapusan akun email/password. **Google login belum aktif di remote**: pengguna mengonfirmasi OAuth Client ID/Secret belum dimiliki. Integrasi aplikasi/PKCE sudah tersedia; aktivasi provider dan consent Google masih external blocker. Jangan menganggap seluruh integrasi Auth produksi sudah terverifikasi.

## Fitur dan bukti

| Fitur | Implementasi | Verifikasi |
|---|---|---|
| Nama tampilan | RPC kanonis `update_my_profile(text)` → profiles | Lokal + remote, save/reload/offline retry, dua akun |
| Foto profil | Upload/ganti/hapus, potong tengah 256×256 WebP; fallback inisial | Browser lokal + remote, dua warna berbeda benar-benar mengganti bytes; reload + sesi mobile baru |
| Privasi avatar | Bucket profile-avatars privat, owner-only SELECT/INSERT/UPDATE/DELETE | PostgreSQL role tests + akun A/B remote; public read ditolak |
| Password visibility | Login, daftar, password sekarang/baru/konfirmasi dan hapus akun | Browser toggle text/password, nilai tetap terjaga |
| Ubah email/password | Auth existing, validasi dan reauthentication | Lokal/API; pengiriman/konfirmasi email serta perubahan password akun existing remote belum diuji |
| Google | signInWithOAuth, pilih akun, PKCE callback, safe next, guest intent existing | Unit enabled/disabled branches; provider nyata belum dikonfigurasi |
| Logout | Footer sidebar/drawer, konfirmasi draft, cache owner, cross-tab | Lokal + remote; menu profil kanan atas tanpa Logout |
| Hapus akun email/password | Konfirmasi HAPUS AKUN, reauth, revoke sessions, hapus avatar, Auth delete dengan FK cascade | Akun disposable remote: password salah ditolak; Auth/profil/proyek/snapshot terhapus; sesi lama ditolak |
| Hapus akun OAuth | Kirim kode email own-session + verifyOtp, lalu alur penghapusan sama | Unit/API; delivery OTP remote belum diverifikasi |
| Theme/motion/density | Provider existing + preferences scoped akun | Browser Light/Dark/System dan computed styles |
| Grid/snap/layout | Consumer canvas/layout existing | Browser drag snap + reset antar-tab tanpa kehilangan proyek |
| Ukuran materi | Consumer lesson existing | Browser computed font size |
| Data lokal | Export snapshot v1, confirmed archive deletion, reset preferences | Browser; guest draft tidak dihapus oleh purge akun |

Copy teknis seperti "Kebijakan keamanan tambahan mengikuti akun Supabase", "penyedia autentikasi", dan pesan konfigurasi backend di UI terkait sudah diganti/hapus. Batas minimum 8 karakter dan feedback keamanan yang berguna tetap dipertahankan.

## Avatar architecture

- Tidak menambah tabel atau identifier profil kedua. Object path deterministik: `<auth-user-id>/avatar.webp`; identity tetap dari getUser() server.
- Input JPG/PNG/WebP maksimum 5 MB, decode browser, maksimum 16 MP, center crop dan resize, metadata EXIF/XMP tidak diteruskan. Server membatasi streaming body 512 KiB, MIME WebP, RIFF/chunk/dimensi maksimum 512px, dan ICC standar yang dibatasi. SVG/animasi/metadata arbitrer ditolak.
- Foto dibaca melalui `/api/settings/avatar`, no-store/private + nosniff, tanpa URL publik atau token storage di browser. SDK cacheNonce menghindari CDN mengembalikan foto lama setelah update/delete.
- Display header dan Settings membaca sumber yang sama. Router refresh serta BroadcastChannel existing memperbarui identitas antar-tab. Semua fallback inisial tetap tersedia jika gambar gagal dibaca.

## Database

- `supabase/migrations/20261014051844_settings_profile.sql`: sudah diterapkan dan history lokal/remote cocok (whitespace-normalized checksum `be7208813824572c8a1ec0b4ad0c63c1`). File pending lama hanya penunjuk.
- `supabase/migrations/20261014054612_settings_avatar_storage.sql`: sudah diterapkan, bucket privat 524288 bytes, image/webp, empat policy owner. Helper avatar_account_active() membatasi JWT akun yang sudah dihapus. Function memakai empty search path dan execute authenticated-only; tidak menerima user ID.
- Tidak mereset database, memodifikasi RLS proyek, atau menerapkan migration domain lain. Snapshot proyek tetap schemaVersion 1.

## Account deletion safety

Endpoint POST `/api/settings/delete-account` memeriksa same-origin JSON, bounded strict payload, getUser(), owner binding, konfirmasi literal dan autentikasi ulang ke user yang sama sebelum memakai server-only admin client. Sesi global dicabut sebelum menghapus object avatar dan Auth user; FK profil → proyek → snapshot melakukan cascade. Keberhasilan hanya dikirim setelah server mengonfirmasi delete. Cache akun dibersihkan setelah acknowledgement; draft tamu dipertahankan.

Pengguna telah memberi izin eksplisit untuk membuat lalu menghapus akun disposable dalam workflow tes. Akun pribadi dan dua akun uji existing tidak dihapus atau diubah password-nya. Test irreversible memakai opt-in `RUN_DISPOSABLE_ACCOUNT_DELETION=1`; jangan menjalankannya tanpa otorisasi yang sesuai. Percobaan awal diblokir automatic approval review, kemudian dijalankan setelah izin diterima.

Akun dengan MFA terverifikasi sengaja ditolak dari penghapusan mandiri sampai reauthentication MFA khusus tersedia. Jika account memiliki object storage lain di luar avatar yang belum dapat dibersihkan, penghapusan dapat ditolak provider; API tidak memberikan success palsu.

## Validasi aktual

| Command / scope | Hasil |
|---|---|
| pnpm.cmd lint | PASS |
| pnpm.cmd typecheck | PASS |
| pnpm.cmd test | 342 PASS, 6 SKIPPED; 74 files PASS, 1 SKIPPED |
| pnpm.cmd build | PASS, 29 pages, route avatar/delete-account tersedia |
| Playwright lokal Settings + Dashboard + Cloud persistence | 15/15 PASS, 2.1 menit |
| Playwright remote Settings + Cloud persistence | 4/4 PASS, 1.4 menit |
| Remote avatar tambahan: beda foto, sesi mobile baru, cache/delete | 1/1 PASS, final rerun 20.4 detik |
| Remote account deletion dengan foto + cascade snapshot | 1/1 PASS, 15.7 detik |
| pnpm.cmd test:rls | 20/20 PASS, authenticated A/B + anon, tanpa service role untuk assertions |
| git diff --check | PASS |

Playwright memakai entrypoint `node node_modules/@playwright/test/cli.js` sesuai setup existing. Fixture hanya pada suite lokal; remote config tidak menggunakan preload fixture. Service credential hanya dipakai server dan setup/cleanup akun disposable, bukan pembuktian RLS.

Browser memeriksa 360/390/430/768/1024/1280/1440px, keyboard/focus, reduced motion, tema, Sidebar mobile, dan simulator persistence. Bukan pengujian perangkat fisik atau keyboard virtual OS. Screenshot aktual: `test-results/settings-remote-private-av-de25d-r-denial-reload-and-removal/remote-avatar-profile.png` dan `remote-avatar-mobile.png`.

Bug yang ditemukan/diperbaiki: validator awal menolak ICCP canvas WebP; input file tersembunyi menyebabkan overflow mobile; CDN download sempat stale sesudah delete; broadcast logout menimpa redirect keberhasilan account deletion. Assertions akhir tidak mengabaikan kegagalan tersebut.

## Area perubahan

- components/ui/password-input.tsx; features/auth/ui/auth-form.tsx; app/(marketing)/masuk/page.tsx; app/api/auth/[action]/route.ts.
- features/dashboard/server.ts; features/dashboard/ui/dashboard-shell.tsx, user-menu.tsx, logout-button.tsx.
- features/settings/avatar.ts, UI avatar/profile/account/data/delete-account, contracts existing, API routes avatar/profile/account/delete-account.
- lib/supabase/account-admin.ts (server only), lib/supabase/env.ts (copy error).
- Dua migration Settings, fixtures/test suites Settings/Auth/ownership/dashboard/cloud, docs/settings.md, docs/google-oauth-setup.md, serta agent/docs/TODO.md (ignored).

Tidak ada dependency aplikasi baru, commit, deploy, perubahan engine simulator atau perubahan format snapshot.

## Konfigurasi eksternal yang masih diperlukan

Baca [Google OAuth setup](C:/vircuit/docs/google-oauth-setup.md). Client ID/Secret harus dibuat dan dipasang langsung ke provider Supabase. Redirect origins/URI, audience/test users, dan consent Google harus sesuai domain nyata. Jangan kirim secret ke chat. OTP deletion OAuth memerlukan template email yang menampilkan Token; SMTP/delivery/confirmation dan akun MFA belum dibuktikan end-to-end. Scope tersebut tidak diklaim DONE.
