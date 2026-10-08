# Authentication + Project Persistence

## Workspace route compatibility — 2026-10-08

Circuit `/simulator` and Code `/simulator/code` share one recovered draft/project/runtime through the simulator layout. Safe auth destinations allow both internal paths, normalize valid project/practice/save/new commands, and discard arbitrary redirects. Session refresh proxy covers both routes; learning commands are still verified server-side. Guest Save from Code returns to Code with its explicit draft intent.

JSON import/export is in the project menu. Import validates the existing v1 snapshot and backs up the active draft before replacement; draft ID, cloud identity and revision ownership are retained. Import marks meaningful project changes dirty. Cloud operations and snapshot format are unchanged.

## Konfigurasi lokal

Salin nama variable dari `.env.example` ke `.env.local`, lalu isi dari Supabase Connect/API settings. `.env.local` harus tetap di-ignore. Aplikasi menggunakan publishable key; tidak membutuhkan service role untuk CRUD.

## Migration remote (belum diterapkan oleh sesi implementasi)

File: `supabase/migrations/20261007050923_auth_project_persistence.sql`.

Di Supabase SQL Editor, tinjau lalu jalankan seluruh file sekali sebagai satu transaksi. Alternatif: gunakan workflow migration CLI yang terhubung dan berizin, tinjau daftar migration pending sebelum `supabase db push`. Jangan menerapkan ulang file yang sama melalui dua workflow atau mereset database produksi.

Migration hanya mencakup `profiles`, `projects`, `project_snapshots`. Tabel learning/challenge/payment tidak termasuk milestone ini. Tidak ada akses anonim. User authenticated dapat SELECT baris miliknya dengan RLS; semua write langsung ditolak. Write melalui RPC `save_project` dan `delete_project`, dengan identity dari `auth.uid()`, ownership check, search path kosong, dan execute grant terbatas. Security definer diperlukan agar client tidak dapat melewati atomic revision checks melalui direct table writes.

Save mengunci row proyek, memeriksa expected revision, menyimpan snapshot immutable dan metadata secara atomik. `(user_id, draft_id)` mencegah proyek duplikat; `(project_id, operation_id)` menjamin replay request yang sama. Replay dengan payload berbeda ditolak. Zod di API memvalidasi snapshot v1; SQL membatasi ukuran/schema/struktur utama. Jangan melemahkan grants atau RLS ketika debugging.

## Supabase Auth

- Aktifkan email/password; tentukan email confirmation dan SMTP/rate limits yang sesuai.
- Atur Site URL ke origin aplikasi dan tambahkan origin development yang digunakan.
- Allowlist redirect aplikasi `/auth/callback` pada setiap origin yang digunakan. Untuk redirect query `next`, gunakan pola callback yang terbatas pada origin itu (bukan wildcard semua host).
- Email confirmation memakai PKCE callback `code`. Untuk konfirmasi lintas browser, email template dapat memakai `/auth/callback?token_hash={{ .TokenHash }}&type=email&next=%2Fsimulator`; draft tetap berada di browser asal dan Save dapat diulang di sana.
- Google: buat OAuth Web Client di Google Cloud, isi authorized origins aplikasi dan redirect URI provider Supabase `/auth/v1/callback` yang ditampilkan Dashboard. Aktifkan Google provider di Supabase dan isi Client ID/Secret **di Dashboard**, bukan source atau frontend env.
- Callback aplikasi dan callback provider adalah dua URL berbeda. Jangan membebaskan redirect ke host mana pun.

Cookie session ditangani `@supabase/ssr`; proxy memverifikasi claims dan memperbarui cookie request/response. API private menggunakan `getUser()` server-side, `Cache-Control: private, no-store`, validasi Origin, dan body byte limit. Cookie SameSite Lax, Secure pada production; cookie browser-readable diperlukan oleh SSR browser client. Gunakan HTTPS production. Rate limits Auth berasal dari Supabase; penerapan rate limit terdistribusi untuk API save bergantung hosting dan dapat ditambahkan tanpa mengubah RLS.

## Draft dan migration guest

Snapshot simulator v1 tidak berubah. IndexedDB menyimpan envelope lokal terpisah: stable draft ID, local revision, cloud revision, pending request, scope, dan explicit Save intent. Recovery selesai sebelum autosave. Transaksi compare-and-swap mencegah tab lama menimpa draft baru; konflik memerlukan reload atau export JSON.

Save tamu menunggu flush IndexedDB sebelum menuju `/masuk`. Login/Google kembali ke `/simulator?save=1&draft=<id>` yang di-allowlist. Hanya draft dengan ID dan explicit intent yang cocok diadopsi ke scope account. Guest tidak dihapus sebelum server acknowledge dan penyimpanan ack lokal berhasil. Guest yang diedit di tab lain dipertahankan. Login biasa menuju `/dashboard` dan tidak mengunggah semua draft. Allowlist juga menerima `/dashboard/projects` serta handoff simulator dengan UUID project/new yang valid. Lihat `docs/dashboard.md`.

Request pending disimpan sebelum request cloud. Retry/reload memakai operation ID dan payload yang sama. Respons lama hanya menandai revision yang dikirim sebagai saved; edit baru tetap dirty. Autosave cloud 1,8 detik setelah perubahan berhenti, hanya untuk proyek cloud existing, tidak untuk runtime tick. Network/conflict errors menghentikan autosave sampai retry/resolve; perubahan lokal tetap ada. Konflik dapat diselesaikan dengan membuka versi cloud atau Simpan sebagai proyek baru.

Menu Proyek menyediakan create, rename, list terbaru (maksimal 100), open, delete, export, dan arsip draft lokal. Perubahan belum tersimpan diarsipkan sebelum pergantian proyek dan dapat dipulihkan. Failed/invalid load tidak mengganti rangkaian aktif. Delete cloud mempertahankan rangkaian aktif sebagai draft baru lokal.

Logout menghapus session dan cache draft account termasuk arsip, membersihkan state private, dan memberi tahu tab lain. User diminta meninjau arsip dan mengunduh cadangan perubahan aktif yang belum tersimpan. Draft guest tidak dihapus. Session yang kedaluwarsa membersihkan state private di layar; draft account tetap scoped untuk recovery setelah login lagi. Local storage tidak terenkripsi dan bukan pengganti backup pada komputer bersama.

## Validasi

`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm exec playwright test`.

Unit tests menjalankan migration pada PostgreSQL PGlite dengan role `anon` dan dua authenticated contexts, tanpa service role untuk assertions. E2E mencakup IndexedDB/browser nyata, auth/cloud mock untuk workflow dan failure, serta regresi simulator. Ini **bukan** bukti konfigurasi RLS/session/OAuth remote.

Remote verification: setelah migration, sediakan dua akun test yang berbeda dengan email terkonfirmasi. Isi `.env.test.local` (di-ignore) dengan `RLS_USER_A_EMAIL`, `RLS_USER_A_PASSWORD`, `RLS_USER_B_EMAIL`, `RLS_USER_B_PASSWORD`. Jalankan `pnpm test:rls`. Test membuat satu proyek sementara menggunakan session user A, menguji akses user B/anon, lalu menghapus hanya proyek test tersebut. Jangan memakai service role atau akun produksi berisi data penting. Tanpa kedua akun atau migration, hasil remote tetap NOT VERIFIED.
