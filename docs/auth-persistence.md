# Authentication + Project Persistence

## Workspace route compatibility — 2026-10-08

Circuit `/simulator` and Code `/simulator/code` share one recovered draft/project/runtime through the simulator layout. Safe auth destinations allow both internal paths, normalize valid project/practice/save/new commands, and discard arbitrary redirects. Session refresh proxy covers both routes; learning commands are still verified server-side. Guest Save from Code returns to Code with its explicit draft intent.

JSON import/export is in the project menu. Import validates the existing v1 snapshot and backs up the active draft before replacement; draft ID, cloud identity and revision ownership are retained. Import marks meaningful project changes dirty. Cloud operations and snapshot format are unchanged.

## Konfigurasi lokal

Salin nama variable dari `.env.example` ke `.env.local`, lalu isi dari Supabase Connect/API settings. `.env.local` harus tetap di-ignore. Aplikasi menggunakan publishable key; tidak membutuhkan service role untuk CRUD.

## Migration remote

File: `supabase/migrations/20261007050923_auth_project_persistence.sql`.

Migration tersebut sudah diterapkan ke project remote yang sesuai environment melalui SQL Editor pada 2026-10-13, setelah catalog memastikan tabel/RPC/history belum ada. Versi dicatat pada `supabase_migrations.schema_migrations`. Jangan menerapkan ulang file ini. Untuk environment baru, jalankan migration sebagai transaksi atau gunakan workflow CLI berizin setelah meninjau daftar pending. Jangan mereset database produksi.

Migration forward-only `20261012183635_project_revision_conflict_http.sql` juga sudah diterapkan dan dicatat. Migration ini mempertahankan tabel, data, signature, ACL, dan ownership checks; hanya mengganti kode konflik bisnis RPC dari `40001` ke `PT409`, lalu meminta reload schema cache. `40001` dapat memicu infinite transaction retries pada PostgREST 14: [Supabase troubleshooting](https://supabase.com/docs/guides/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions-77326b). API mengenali `PT409` serta kode lama untuk compatibility. Jangan memakai serialization failure sebagai kode konflik bisnis baru.

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

Request pending disimpan sebelum request cloud. Retry/reload memakai operation ID dan payload yang sama. Respons lama hanya menandai revision yang dikirim sebagai saved; edit baru tetap dirty, termasuk edit saat acknowledgement ditulis ke disk. Autosave cloud berjalan 1,8 detik setelah perubahan berhenti untuk proyek akun existing maupun draft akun baru yang sudah diedit. Draft kosong tanpa edit tidak membuat proyek cloud. Runtime tick dan selection tidak memicu autosave. Koneksi pulih memicu replay request pending setelah error jaringan; konflik revisi tetap memerlukan pilihan pengguna. Tombol Simpan menyediakan retry manual. Save berulang pada proyek bersih tidak membuat snapshot tambahan.

## Cloud primary / recovery hardening — 2026-10-13

Supabase tetap satu-satunya penyimpanan proyek akun lintas perangkat. IndexedDB menjadi recovery journal untuk akun serta penyimpanan utama guest; snapshot v1 tidak berubah. Login biasa menampilkan pemberitahuan draft guest di dashboard, lalu menawarkan migrasi di workspace. Nanti saja tidak mengubah draft guest. Persetujuan eksplisit memakai draft ID stabil dan RPC existing; backup draft akun selesai sebelum adopsi. Guest dihapus hanya setelah acknowledgement cloud dan flush lokal berhasil.

Envelope draft memiliki field tambahan backward-compatible `cloudPaused` (default false). Delete mempertahankan rangkaian sebagai draft lokal dengan autosave cloud dihentikan, termasuk setelah edit/refresh, agar proyek terhapus tidak diciptakan ulang. Simpan manual atau Simpan sebagai proyek baru dapat membuat proyek akun baru secara eksplisit. Logout menahan autosave selama sign-out/cache cleanup. Existing guest scope dan draft akun lain tidak ikut dibersihkan.

Konflik save menampilkan akses Selesaikan konflik: Buka versi cloud dengan konfirmasi dan backup, atau Simpan sebagai proyek baru. Menu open dan URL handoff sama-sama melindungi perubahan lokal proyek yang sama. Load gagal tidak mengganti project aktif. Pergantian draft saat request load berjalan membatalkan penerapan respons lama.

Baseline sebelum perbaikan remote: Auth health HTTP 200, projects HTTP 404/PGRST205 dan save RPC HTTP 404/PGRST202; dua akun uji belum dikonfigurasi. Pemeriksaan SQL sesudahnya membuktikan tabel/RPC/history memang belum ada. Hasil remote terbaru ada pada bagian berikut; pengujian local provider sebelumnya tetap bukan bukti remote.

Cloud Save mengirim header binding akun yang diharapkan. Server tetap menentukan owner dari `getUser()` dan menolak header yang berbeda, agar pergantian session saat request berjalan tidak mengunggah draft akun sebelumnya ke akun baru. Header tersebut bukan sumber authorization dan tidak memberi hak akses tambahan.

Menu Proyek menyediakan create, rename, list terbaru (maksimal 100), open, delete, export, dan arsip draft lokal. Perubahan belum tersimpan diarsipkan sebelum pergantian proyek dan dapat dipulihkan. Failed/invalid load tidak mengganti rangkaian aktif. Delete cloud mempertahankan rangkaian aktif sebagai draft baru lokal.

Logout menghapus session dan cache draft account termasuk arsip, membersihkan state private, dan memberi tahu tab lain. User diminta meninjau arsip dan mengunduh cadangan perubahan aktif yang belum tersimpan. Draft guest tidak dihapus. Session yang kedaluwarsa membersihkan state private di layar; draft account tetap scoped untuk recovery setelah login lagi. Local storage tidak terenkripsi dan bukan pengganti backup pada komputer bersama.

## Validasi

`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm exec playwright test`.

Unit tests menjalankan migration pada PostgreSQL PGlite dengan role `anon` dan dua authenticated contexts, tanpa service role untuk assertions. E2E mencakup IndexedDB/browser nyata, auth/cloud mock untuk workflow dan failure, serta regresi simulator. Ini **bukan** bukti konfigurasi RLS/session/OAuth remote.

Remote verification: gunakan dua akun test berbeda dengan email terkonfirmasi. Isi `.env.test.local` (di-ignore) dengan `RLS_USER_A_EMAIL`, `RLS_USER_A_PASSWORD`, `RLS_USER_B_EMAIL`, `RLS_USER_B_PASSWORD`. Jalankan `pnpm test:rls`. Suite membuat proyek sementara milik A dan B, menguji akses silang dua arah/anon, dan menghapus hanya proyek uji melalui session pemilik. Error SQLSTATE harus cocok; timeout/network error tidak dianggap bukti isolasi. Secret/server key tidak dipakai untuk assertions RLS.

Untuk browser remote, jalankan build kemudian `pnpm test:e2e --config=playwright.remote.config.ts`. Config opt-in ini memakai port 3003 tanpa network preload/mock provider pada config Playwright default. Jangan menjalankan server fixture pada port ini. Kredensial tidak masuk trace/screenshot; trace dimatikan.

### Hasil validasi lokal sebelum perbaikan remote — 2026-10-13

- Lint, typecheck, production build: PASS.
- Vitest: 319 PASS, 6 skipped; termasuk PostgreSQL PGlite RLS user A/B/anon dan API ownership/session binding.
- Playwright: 24 skenario unik PASS setelah rerun. Batch terakhir 23 PASS dan satu browser-closed error; tes yang terdampak diulang terisolasi dan PASS (30,5 detik). Selector dashboard lama diperbarui sesuai source aktual tanpa mengubah UI untuk menyesuaikan tes.
- Cloud local-provider flow: create otomatis setelah edit, no blank create, offline pending replay + newer edit, reload, fresh browser context 390px, konflik dua sesi, cloud resolve + backup, delete tanpa resurrection, logout/cache cleanup, login kembali, serta guest offer/decline/failure/retry.
- Regression: Blink/Serial/Run/Stop worker, button/PWM input, Monaco, wiring, mixed selection/delete/Undo/Redo, desktop resize/collapse/Focus Mode, mobile sheets, Light/Dark/System dashboard.
- Pada baseline ini remote authenticated CRUD/cross-user RLS belum terverifikasi. Status tersebut digantikan hasil remote berikut.
- Pada baseline ini `.env.local` ignored dan belum ada perubahan database remote.

### Hasil verifikasi remote final — 2026-10-13

- URL/reference environment cocok dengan project Vircuit pada Supabase Dashboard; schema `public` terkonfirmasi. Tidak ada perubahan URL/key atau deployment.
- History remote berisi `20261007050923` dan `20261012183635`. Migration challenge/progress dan Cirra lokal tidak diterapkan dalam scope persistence ini.
- Catalog remote: `profiles`, `projects`, `project_snapshots` memiliki RLS aktif; authenticated SELECT tersedia, direct INSERT/UPDATE/DELETE ditolak; anon tidak memiliki SELECT. RPC save `(uuid, uuid, integer, uuid, jsonb)` dan delete `(uuid, integer)` memiliki EXECUTE authenticated, bukan anon, security definer dengan search path kosong dan explicit ownership checks. Kedua fungsi memakai PT409 dan tidak lagi memakai 40001.
- `pnpm test:rls`: PASS, 20 assertions menggunakan publishable client + session A/B dan anon. Mencakup create/read/update/delete, replay idempotent, akses proyek/snapshot silang dua arah, ownership escalation, invalid schema, stale save/delete dengan kode konflik tepat, serta cleanup proyek uji.
- Browser Edge ke Supabase remote asli: PASS, 1 alur lengkap (31,8 detik; suite 34,8 detik). Autosave create revision 1, exact snapshot comparison (components/positions/rotation/wires/code/viewport/settings/metadata), reload, Dashboard, Run/Stop/LED, offline pending retry, fresh mobile context, update revision 3, konflik 409 tanpa overwrite, API cross-user denied, rename revision 4, confirmed delete, logout/cache cleanup dan login kembali.
- Bukti proyek pada run final: `fe1cf634-aab4-4e43-845c-bb3a0aaa80b6`; proyek tersebut sudah dihapus oleh workflow uji. Saved status diuji dengan menahan response HTTP setelah remote commit: browser belum menampilkan Tersimpan di akun sebelum menerima acknowledgement.
- Screenshot nyata: `test-results/cloud-persistence-real-rem-35531-ct-ownership-and-management/remote-saved-workspace.png` dan `remote-dashboard-project.png`. Viewport desktop 1440×1000 dan sesi terpisah 390×844; ini bukan pengujian dua perangkat fisik atau deployment Vercel.
- Lint/typecheck/build PASS; unit tests 320 PASS, 6 skipped. Dua akun uji terkonfirmasi tersedia untuk rerun; konfigurasi hanya di `.env.test.local` yang di-ignore. Server key hanya digunakan untuk setup akun uji, bukan pembuktian RLS. Tidak ada commit/deploy, reset, atau penghapusan data pengguna existing.
