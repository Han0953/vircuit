# Product copy cleanup

Pembersihan mencakup 50 kemunculan copy UI pada 25 file aplikasi. Jumlah ini mencakup teks metadata, CTA, pesan error, label statistik, dan fallback data; tidak menghitung test atau perubahan lebar progress bar.

## Hasil

- CTA Virtual Lab memakai ajakan membuka produk, bukan kesan mode percobaan.
- Premium tetap berstatus dalam perencanaan dan belum dapat dibeli.
- Batas kapasitas Cirra dan evaluasi tetap ditampilkan tanpa istilah MVP.
- Enam proyek terbaru tidak lagi diberi label sebagai jumlah seluruh proyek tersimpan.
- Jumlah topik kurikulum tidak lagi ditampilkan sebagai kompetensi yang telah diperoleh pengguna.
- Kegagalan memuat progress menampilkan data tidak tersedia, bukan angka nol.
- Progress bar memakai persentase aktual, termasuk lebar nol untuk 0%.
- Sidebar tidak mengklaim draft lokal aktif tanpa memeriksa draft.
- Nano visual-only, Arduino C/C++ subset, pratinjau konsep proyek, dan contoh ilustratif tetap dijelaskan.

## File aplikasi yang berubah

- `app/(marketing)/page.tsx`
- `app/(marketing)/fitur/page.tsx`
- `app/(marketing)/harga/page.tsx`
- `app/api/auth/[action]/route.ts` — pesan error saja
- `app/dashboard/page.tsx`
- `app/dashboard/progress/page.tsx`
- `app/dashboard/learn/page.tsx`
- `app/dashboard/learn/error.tsx`
- `app/dashboard/learn/not-found.tsx`
- `app/layout.tsx`
- `components/marketing/coming-soon-action.tsx`
- `components/marketing/final-cta-section.tsx`
- `components/marketing/landing-hero.tsx`
- `components/marketing/public-footer.tsx`
- `components/marketing/public-navbar.tsx`
- `components/marketing/scenes/learning-roadmap.tsx`
- `features/ai/context.ts` — pesan batas kapasitas saja
- `features/challenges/evaluate.ts` — pesan batas kapasitas saja
- `features/challenges/pending.ts` — pesan error saja
- `features/challenges/server.ts` — pesan error saja
- `features/dashboard/ui/dashboard-shell.tsx`
- `features/dashboard/ui/overview-kpi-grid.tsx`
- `features/dashboard/ui/project-collection.tsx`
- `features/progress/ui/learning-summary.tsx`
- `features/projects/ui/project-controls.tsx`

Test yang berubah: `tests/e2e/homepage.spec.ts`, `tests/e2e/public-pages.spec.ts`, dan `tests/e2e/product-copy.spec.ts` yang baru.

## Cakupan pemeriksaan

Seluruh 16 pola route halaman diperiksa pada source dan browser: `/`, `/fitur`, `/belajar`, `/jelajahi`, `/harga`, `/masuk`, `/daftar`, `/simulator`, `/simulator/code`, `/dashboard`, `/dashboard/projects`, `/dashboard/progress`, `/dashboard/challenges`, `/dashboard/learn`, `/dashboard/learn/[course]`, dan `/dashboard/learn/[course]/[lesson]`. Course yang dipublikasikan dan seluruh tujuh lesson diuji, menghasilkan 22 URL konkret. Dialog proyek serta Cirra diperiksa sebagai tamu dan akun fixture.

Istilah teknis pada selector/class `demo*`, fixture/mocks test, atribut HTML `placeholder`, identifier `preview`, dan instruksi internal AI tetap dipertahankan. Istilah tersebut tidak menjadi label produk. Dokumentasi historis tidak diubah.

## Validasi

- `pnpm lint`: PASS.
- `pnpm typecheck`: PASS.
- `pnpm test`: 304 PASS, 6 SKIPPED.
- `pnpm build`: PASS.
- Playwright homepage/public-pages: 26 PASS.
- Playwright product-copy: 4 PASS setelah memperbaiki locator label aksesibilitas pada test pagination.
- Pemeriksaan browser mencakup halaman publik, akun fixture lokal, simulator, tampilan mobile 390px dalam dark theme, serta regresi tanpa JavaScript, reduced motion, dan navigasi publik.
- Screenshot lokal: `playwright-report/product-copy-cirra.png`, `playwright-report/product-copy-dashboard-error.png`, dan `playwright-report/product-copy-mobile-dashboard.png`.

Pengujian akun menggunakan fixture lokal; Supabase/Gemini remote dan perangkat mobile fisik tidak diverifikasi. Tidak ada perubahan database, RLS, data pengguna, kontrak persistence, atau logika autentikasi/runtime. Tidak ada commit atau deploy.
