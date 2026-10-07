# Dashboard + My Projects

Dashboard authenticated berada di `/dashboard` dan `/dashboard/projects`, terpisah dari marketing dan workspace. Guard memverifikasi user di server; rendering memakai Supabase client read-only, sedangkan proxy melakukan session refresh. Login tanpa tujuan kembali menuju dashboard. Save guest tetap mempertahankan return ke simulator beserta draft intent.

## Data dan actions

Recent Projects mengambil enam item terbaru melalui service Supabase existing. My Projects menggunakan pencarian judul server-side, urutan `updated_at DESC` dengan ID sebagai tie-breaker, dan pagination 24 item. Endpoint `/api/projects?page=...&search=...` mengembalikan `items`, `page`, dan `hasMore`; request tanpa parameter tetap kompatibel dengan menu workspace existing.

Rename menggunakan PATCH existing dan menghasilkan revision baru. Delete menggunakan DELETE existing dengan expected revision, confirmation, dan hard delete. UI diperbarui setelah konfirmasi server. Konflik meminta user memuat versi terbaru, tanpa overwrite otomatis. Delete mempertahankan draft aktif lokal dan melepaskan cloud identity; tab workspace lain menerima pemberitahuan melalui BroadcastChannel.

## Handoff workspace

- `/simulator?new=<uuid>`: intent menjadi ID draft lokal account. Marker sessionStorage dan ID draft mencegah pengulangan pada refresh/back. Cloud project dibuat hanya saat Save pertama.
- `/simulator?project=<uuid>`: setelah recovery, snapshot cloud divalidasi sebelum mengganti proyek. Draft lama disimpan/diarsipkan. Draft dirty untuk proyek yang sama memerlukan pilihan lokal atau cloud.
- Setelah berhasil, parameter command dibersihkan dengan replace navigation. Handoff terpisah dari early return session initialization sehingga navigasi dengan user yang sama tetap diproses.
- Selama handoff, autosave ditahan. Kegagalan load tidak mengganti circuit lokal.

Logout dashboard tidak memerlukan workspace initialized. Draft/arsip account dapat diunduh sebelum session dan private cache dibersihkan. Draft guest tetap dipertahankan. Session expiry tidak menghapus draft account di disk.

## Validasi dan batas

Vitest mencakup cookie boundary, pagination/search/ownership, rename, handoff, local deletion recovery, dan logout independen. Playwright menjalankan aplikasi build dengan Supabase transport fixture lokal melalui Node preload khusus proses test; tidak ada mock project source atau auth bypass di aplikasi production. Browser SDK pada test dashboard diarahkan ke fixture yang sama. Fixture tidak membuktikan RLS remote.

Remote auth/persistence/RLS masih memerlukan migration terpasang dan dua akun test terkonfirmasi. Gunakan workflow `docs/auth-persistence.md`; jangan menyatakan remote security PASS berdasarkan fixture lokal. Learning, progress, challenges, AI, dan full settings tidak termasuk milestone ini.
