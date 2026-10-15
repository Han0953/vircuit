# Google login — konfigurasi yang diperlukan

Integrasi aplikasi sudah memakai Supabase Auth, PKCE callback, redirect allowlist, serta pilihan akun Google. Provider remote belum aktif karena OAuth Client ID/Secret belum dibuat. Tidak ada login Google palsu atau bypass autentikasi.

1. Buka Google Cloud Console, pilih/buat project untuk Vircuit, lalu buka **Google Auth Platform**.
2. Isi **Branding** (nama aplikasi dan email dukungan), **Audience**, serta kontak developer. Untuk tahap Testing, tambahkan email yang akan dipakai menguji login ke daftar Test users.
3. Di **Data Access**, gunakan hanya `openid`, `userinfo.email`, dan `userinfo.profile`.
4. Di **Clients**, buat **OAuth client ID → Web application**. Authorized JavaScript origins memakai origin aplikasi, misalnya `http://localhost:3000` untuk development dan origin domain produksi yang sebenarnya. Jangan memasukkan path ke field origin.
5. Di Supabase Dashboard → **Authentication → Sign In / Providers → Google**, salin **Callback URL** yang ditampilkan. Masukkan URL itu sebagai **Authorized redirect URI** di Google Cloud. Ini callback Supabase (`/auth/v1/callback`), bukan route callback Next.js.
6. Masukkan Client ID dan Client Secret yang baru dibuat langsung ke provider Google di Supabase, aktifkan provider, lalu Save. Jangan memasukkan secret ke chat, frontend, Git, atau environment publik.
7. Di Supabase **URL Configuration**, tetapkan Site URL aplikasi. Tambahkan URL aplikasi `/auth/callback` ke Redirect URLs, termasuk origin development yang digunakan. Route `/auth/callback` aplikasi akan menukar code menjadi session lalu kembali ke tujuan internal yang sudah divalidasi.
8. Uji **Lanjutkan dengan Google** dari `/masuk` dan `/daftar`, pilih akun uji yang diizinkan, dan pastikan kembali ke dashboard. Uji juga guest Save → Google → simulator agar draft tetap tersedia.

Client ID/Secret Google tidak diperlukan di kode browser Vircuit. Tombol akan menampilkan error yang jujur sampai provider diaktifkan. Testing Google consent, email confirmation/SMTP, serta OTP email membutuhkan akses ke akun/email asli dan tidak dibuktikan oleh fixture lokal.

Untuk penghapusan akun OAuth melalui kode email, template Magic Link harus menampilkan `{{ .Token }}` agar pengguna menerima kode OTP yang dapat dimasukkan ke dialog. Jangan melemahkan konfirmasi email, nonce, atau keamanan provider untuk mempercepat pengujian. Akun dengan MFA terverifikasi ditolak dari penghapusan mandiri sampai alur MFA penghapusan tersedia.

Referensi: [Supabase — Sign in with Google](https://supabase.com/docs/guides/auth/social-login/auth-google).
