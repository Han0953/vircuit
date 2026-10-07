# Akun testing lokal

Jalankan `pnpm dev`, buka `/masuk`, lalu pilih **Masuk sebagai akun testing lokal**. Tidak perlu email, password, atau koneksi Supabase.

Identitas demo: **Pengguna Testing Lokal**. Dashboard demo berada di `/demo` dan `/demo/projects`. Simulator tetap memakai `/simulator` dengan draft terpisah dari guest dan akun Supabase.

Simpan, buka, ubah nama, hapus, dan autosave memakai IndexedDB browser. Data dipertahankan saat keluar demo; menghapus data browser menghapus proyek lokal. Demo tidak menguji login, penyimpanan cloud, atau RLS.

Mode hanya tersedia ketika `NODE_ENV=development`. Build production mengembalikan 404 untuk route demo dan tidak menampilkan tombol testing. Demo tidak membuat session Supabase atau melewati authorization server. Request cloud ditolak di client selama demo aktif.
