# Mobile UX, navigation and 3D polish — 12 Oktober 2026

Status: UI dan integrasi fungsional selesai; validasi performa cold interaction PARTIAL. Tidak ada deployment, dependency baru, perubahan database/backend atau format project.

## Workspace

- Parts, Serial Monitor dan Problems tetap menjalankan fungsi semula melalui capsule navigation. Indikator bergerak, tombol minimum 44px, safe area dan padding konten menjaga ruang editor/canvas.
- Header mobile satu baris: Back, judul, Save/status, Run/Stop dan overflow. Proyek/cadangan, contoh, tema, reset dan logout menggunakan tindakan existing. Cirra tetap tersedia melalui bubble.
- Popover mempertahankan owner dialog/menu yang membuka portal; dialog proyek dan galeri tidak hilang ketika fokus berpindah ke portal.
- Parts membuka fokus pada judul, bukan search. Filter, kategori, SVG, drag/add dan state kategori tetap dipakai.
- Visual Viewport mengubah tinggi/top workspace. Keyboard mengecilkan area editor, menyembunyikan capsule/chrome/toolbars sekunder/konteks praktik, tanpa meng-unmount model atau state. Blur singkat tidak menampilkan kembali capsule sebelum viewport pulih; pinch zoom tidak dianggap keyboard.
- Monaco automaticLayout, reveal cursor dan context menu dipertahankan. Menu teks menyediakan Pilih semua, Salin pilihan/semua, Potong, Tempel dan Seleksi sentuh. Fallback readonly textarea memakai pemilihan native; penolakan clipboard tidak menghapus kode. Edit clipboard menggunakan undo stops dan memeriksa model/range sebelum cut.

## Marketing

- Header marketing transparan di posisi atas: tanpa border/divider/shadow yang terlihat. Setelah melewati ambang scroll existing, surface 92%, blur 8px dan border/shadow halus aktif. Tinggi tetap stabil; workspace/dashboard tidak mengikuti aturan ini.
- Theme icon berada pada header mobile; hover theme hanya desktop. Menu fullscreen masuk dari kanan selama 380ms, memakai scroll lock/focus trap/return Radix. Link berada di tengah; landscape pendek memiliki scroll internal. CTA Virtual Lab dihapus dari header/menu mobile, tetap tersedia pada konten utama/footer dan desktop.
- Reveal mobile 280ms, jarak/stagger diperkecil dan delay antrean dibatasi. Card/row mengikuti urutan, hover/focus/tap ringan menggunakan transform terpisah. Controller, reduced motion, no-JS, footer coverage dan Lenis desktop tetap dipakai.

## 3D

- Hero tetap SVG. Stage story dan board maksimal satu viewport mobile, rounded 20px dan memiliki ruang DOM overlay terpisah dari model.
- Caption board mengikuti board/progress. Framing berdasarkan aspect ratio; framing rangkaian learning mencakup Uno, breadboard, LED dan potentiometer tanpa pemotongan sisi seperti sebelumnya.
- HIGH/MEDIUM/LOW memilih DPR maksimum 1.5/1.25/0.75 berdasarkan hints CPU/memori/data saver. LOW mengurangi segmen geometri, SMD dekoratif, atlas ke 512px dan satu fill light. Material tetap teknikal; tidak ada postprocessing baru.
- Penurunan tier memakai latency request render, tidak menghitung idle demand frames. Setelah LOW masih tidak stabil, renderer kembali ke SVG. WebGL loss/reduced motion/unavailable tetap memakai fallback.
- Satu canvas aktif, demand rendering, resource disposal dan existing channel dipertahankan. Tidak ada RAF kontinu baru atau cap 60 FPS baru.
- Tinggi story/board dipesan sejak CSS SSR, termasuk sebelum lazy motion aktif, untuk menghilangkan layout shift besar yang ditemukan pada cold-load.

## File aplikasi

Workspace/project UI:
- `features/simulator/ui/workspace/workspace-shell.tsx`
- `features/simulator/ui/workspace/resizable-workspace.tsx`
- `features/simulator/ui/workspace/workspace-controls.module.css`
- `features/simulator/ui/workspace/use-workspace-viewport.ts`
- `features/simulator/ui/toolbar/workspace-topbar.tsx`
- `features/simulator/ui/panels/code-editor.tsx`
- `features/simulator/ui/panels/code-panel.tsx`
- `features/projects/ui/project-controls.tsx`

Marketing:
- `components/marketing/public-navbar.tsx`
- `components/marketing/marketing-theme-toggle.tsx`
- `components/marketing/home-controls.module.css`
- `components/marketing/homepage.module.css`
- `components/marketing/public-pages.module.css`
- `components/marketing/scenes/board-showcase.tsx`
- `components/marketing/scenes/homepage-experience.tsx`
- `components/marketing/scenes/homepage-motion-manifest.ts`
- `components/marketing/scenes/public-motion-config.ts`
- `components/marketing/scenes/public-timelines.ts`
- `components/marketing/scenes/three/board-geometry.ts`
- `components/marketing/scenes/three/board-lettering.ts`
- `components/marketing/scenes/three/cinematic-world.tsx`
- `components/marketing/scenes/three/hardware-models.tsx`
- `components/marketing/scenes/three/learning-world.tsx`
- `components/marketing/scenes/three/quality-policy.ts`
- `components/marketing/scenes/three/use-hardware-quality.ts`

Tests: `tests/e2e/mobile-polish.spec.ts`, `cirra-ux.spec.ts`, `display-examples.spec.ts`, `marketing-theme-regression.spec.ts`, `wire-routing.spec.ts`, `homepage-performance.spec.ts`, dan `tests/unit/hardware-quality.test.ts`.

## Validasi checkpoint awal

- lint/typecheck/build: PASS.
- Vitest: 309 PASS, 6 skipped.
- Playwright: 104 skenario fungsional unik memiliki hasil terakhir PASS melalui beberapa batch; dua cold performance budget tests tetap FAIL. Batch layout terakhir: 28 PASS, 0 failed/flaky.
- Viewport: 360/390/430/768/1280/1440px, ditambah landscape 844×390. Light/Dark/System, native mobile scroll, focus, dropdown/dialog, viewport keyboard sintetis 460/240px dan recovery, cut/paste/selection/fallback clipboard diuji. Clipboard permissions/data disimulasikan; clipboard OS pengguna tidak dibaca/diubah.
- Regresi mencakup canvas/placement/wiring/selection, Run/Stop/runtime, project/draft recovery, Cirra, dashboard akun fixture, marketing dan satu canvas/fallback/reversible 3D.
- Snapshot: `playwright-report/workspace-island-390.png`, `fullscreen-menu-{360,390,430,768}.png`, `mobile-workspace-{360,390,430,768}.png`, dan `test-results/world-390-0.5.png`.

### Pengukuran checkpoint awal

Sampel spotlight scroll produksi lokal pada viewport 390 dan 1440: interval frame p95 16.8ms, 7 draw calls, 2,688 triangles pada board saat sampling. Budget per board diuji maksimal 7 calls dan kurang dari 6,000 triangles. Interval rAF bukan pengukuran GPU FPS atau bukti perangkat 120Hz.

Cold cache, CPU throttle 4×, 1.6Mbps, latency 40ms; hasil terakhir:

| Viewport | LCP | CLS | Interaksi maksimum teramati | Long tasks / maksimum |
| --- | --- | --- | --- | --- |
| 390 | 1,784ms | 0 | 1,176ms | 11 / 1,137ms |
| 1440 | 1,980ms | 0 | 272ms | 12 / 329ms |

LCP dan CLS memenuhi budget existing (2.5s / 0.1); interaksi melampaui 200ms. Ambang tidak dilonggarkan. Sebelum reservasi CSS SSR, CLS desktop terukur 0.634. Event timing ini sampel lab, bukan field INP. Pengukuran lengkap: `playwright-report/mobile-performance-final.json`; batch fungsional terakhir: `playwright-report/mobile-layout-final.json`.

## Batas verifikasi

Cold interaction masih perlu optimasi lanjutan pada startup/hydration sebelum budget tersebut dapat dinyatakan PASS. Android/iOS fisik, keyboard OS nyata, long-press selection handles, serta layar 120Hz belum diverifikasi. Pengujian menggunakan Edge lokal, touch/viewport/OS-theme emulation dan service fixtures. Tidak mengklaim 120 FPS pada semua perangkat.

Pada checkpoint awal, refinement terkait backlog existing VIR-020/031/033/043/133/422/424/445; TODO dan status task tidak diubah.

## Lanjutan optimasi startup — 12 Oktober 2026

- Profil CPU cold-load menemukan setup homepage berulang akibat perubahan portal canvas, pekerjaan GSAP dalam hydration, serta permintaan refresh terpisah dari beberapa scene.
- Portal canvas sekarang dibaca melalui ref oleh controller; pembuatannya tidak mengulang setup seluruh homepage. State renderer dan single-canvas ownership tetap dipakai.
- Setup dekoratif homepage, scene dan hero dijadwalkan sesudah paint berikutnya, dengan pembatalan frame/task saat unmount. Konten SSR tetap lengkap.
- Metadata reveal detail dan background timelines dibuat ketika elemen mendekati viewport. Background tetap statis sebelum itu; observer, GSAP context dan refresh dibersihkan pada pergantian route/media query.
- Scene/background/public timelines memakai antrean refresh bersama. Permintaan digabung, menunggu anchor scroll selesai dan memberi kesempatan interaksi tampil sebelum pengukuran layout.
- Hero tidak lagi membuat tween reset pointer ketika belum pernah diarahkan/dimiringkan.
- Benchmark kini menunggu pengiriman Event Timing setelah interaksi, merekam sumber CLS, dan dapat menghasilkan CPU profile melalui `VIRCUIT_PROFILE_HOMEPAGE=1`. Budget existing tidak diubah. Test tanpa JavaScript mencakup seluruh section dan FAQ native.
- Percobaan Suspense per section dibatalkan karena menghilangkan konten pada mode tanpa JavaScript; route/layout/source konten tidak berubah.

Status tetap PARTIAL sampai cold interaction memenuhi budget. VIR-445 menjadi IN PROGRESS; tidak ditandai DONE.

### Validasi lanjutan

- `pnpm lint`, `pnpm typecheck`, `pnpm build`: PASS pada versi akhir.
- `pnpm test`: 312 PASS, 6 skipped. Tiga test baru memeriksa penggabungan refresh, pembatalan owner, serta penundaan/cancellation ketika anchor scroll belum selesai.
- Playwright batch `motion-regression`: 81 PASS, 2 FAIL, 0 flaky; kedua kegagalan hanya budget cold interaction. Meliputi hero/autoplay/pointer, single-canvas ownership, 3D/fallback/reverse scroll, Light/Dark/System, lima marketing routes, mobile navigation/workspace/keyboard sintetis/clipboard mock, native scroll dan no-JS.
- Test no-JS dijalankan ulang pada versi akhir dengan assertion tambahan untuk SVG Uno dan ketiga board showcase: 1 PASS. Tidak dihitung sebagai skenario unik tambahan.
- Screenshot hasil batch yang benar-benar ditinjau: `test-results/hero-hover-uno.png` dan `test-results/home-1440-system-final.png`.
- Profil cold yang sama seperti checkpoint awal, hasil batch final:

| Viewport | LCP | CLS | Interaksi maksimum teramati |
| --- | --- | --- | --- |
| 390 | 1,212ms | 0 | 376ms |
| 1440 | 1,464ms | 0 | 456ms |

Kedua interaksi masih melampaui 200ms. Hasil antarrun bervariasi; satu run desktop 176ms tidak dijadikan bukti bahwa masalah telah selesai. LCP/CLS memenuhi budget. Pengiriman Event Timing kini ditunggu 300ms setelah input agar entry yang belum dikirim tidak dianggap interaksi nol. Tidak ada penundaan interaksi sebelum pengukuran atau pelonggaran ambang.

Scroll warm produksi lokal terukur p95 rAF 16.8ms pada 390/1440px. Spotlight board: 7 draw calls, 2,688 triangles; world learning: 33 draw calls, 6,880 triangles untuk seluruh rangkaian. Ini bukan GPU FPS, field INP, atau pembuktian 120Hz. Android/iOS fisik dan keyboard/native selection handles tetap belum diverifikasi.

Laporan mesin: `playwright-report/motion-regression.json`. Spike startup/hydration masih membutuhkan profiling lanjutan. Tidak ada perubahan simulator/dashboard/auth/backend, dependency, commit atau deployment.

File lanjutan: `components/marketing/backgrounds/background-motion.ts`, `components/marketing/scenes/{homepage-experience,hero-showcase,motion-scene,public-timelines,scene-refresh}`, `tests/e2e/homepage-performance.spec.ts`, `tests/unit/scene-refresh.test.ts`, dokumen ini dan `agent/docs/TODO.md`.
