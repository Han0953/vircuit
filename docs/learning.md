# Learning System Foundation

## Content dan authoring

Materi MVP menggunakan JSON terstruktur di `features/learning/content/`, dengan types dan validasi Zod di `features/learning/schema.ts`. Pilihan ini mengikuti brief Learning Foundation dan opsi structured lesson JSON di ARCHITECTURE.md: authoring sederhana, tidak memerlukan MDX dependency, CMS, query Supabase, atau migration learning.

Learning Path dan Course adalah satu entitas untuk MVP. Course memiliki module grouping dan lesson berurutan; lesson dapat memiliki satu practice. Course pertama `course.dasar-iot` berisi empat module dan tujuh lesson:

1. Tegangan dan Ground
2. LED, Resistor, dan Polaritas
3. Arduino Uno dan Blink
4. Push Button dan digitalRead
5. Potentiometer dan analogRead
6. Debugging Wiring dan Kode
7. Mini Project: Traffic Light

Untuk menambah materi:

- Tambahkan JSON course dan daftarkan import-nya di `registry.ts`, atau tambahkan lesson ke course existing.
- Gunakan ID stabil untuk course, module, lesson, dan practice. Jangan mengganti ID karena judul berubah. ID harus unik di seluruh catalog; slug course unik, slug lesson unik dalam course.
- Metadata mencakup title, summary/description, level, version, order, moduleId, objectives, duration, prerequisites, concepts, dan published. Order eksplisit menentukan urutan; prerequisites hanya mereferensikan lesson sebelumnya.
- Body menggunakan block paragraph, heading, list, callout, code, atau diagram. React merender teks tanpa raw HTML atau evaluasi kode. Code block hanya contoh yang bisa dibaca.
- Practice memiliki ID, template key, version, goal, daftar komponen, instruksi Build/Wire/Code/Simulate/Debug, dan pengamatan yang diharapkan. Template baru memerlukan enum schema dan factory di `templates.ts`; template existing dapat digunakan ulang.
- Jalankan unit tests untuk memvalidasi catalog, urutan, snapshot, dan dukungan runtime sebelum mempublikasikan materi.

Stable IDs dapat direferensikan Progress dan Challenge pada milestone berikutnya. Tidak ada status completion, skor, attempt, atau AI service pada foundation ini.

## Routes dan authentication

- `/belajar` tetap public marketing. CTA login membawa tujuan `/dashboard/learn`.
- `/dashboard/learn` adalah overview authenticated.
- `/dashboard/learn/[course]` menampilkan module dan lesson course.
- `/dashboard/learn/[course]/[lesson]` adalah reader, dengan outline desktop, Sheet mobile, serta previous/next lesson.
- Module tidak memiliki route tersendiri; grouping dan identitasnya tetap tervalidasi.
- Unknown course/lesson ditangani not-found. Kesalahan content ditangani learning error boundary dengan retry.

Dashboard layout dan pages memverifikasi user server-side memakai helper existing. Proxy menimpa header tujuan internal sebelum render, dan redirect helper hanya menerima path learning yang dikenal serta command simulator yang tervalidasi. Local demo account bukan Supabase session sehingga tidak membuka learning protected routes.

## Practice handoff dan perlindungan draft

CTA menghasilkan UUID intent stabil dan membuka `/simulator?lesson=<lesson-id>&practice=<uuid>`. URL tidak memuat snapshot atau arbitrary return destination. Simulator biasa tetap public; URL practice memerlukan authenticated user.

Endpoint GET `/api/learning/practice` memverifikasi session dan mengembalikan manifest template snapshot v1 dengan `private, no-store`. Client memvalidasi payload, owner, lesson, dan intent sebelum menawarkan konfirmasi. Cancel atau request gagal mempertahankan draft aktif.

Setelah konfirmasi, controller existing menyelesaikan recovery/flush dan membuat backup draft aktif, termasuk draft cloud yang clean. Template menjadi draft account baru tanpa identitas cloud; snapshot project v1 tidak berubah. IndexedDB compare-and-swap tetap melindungi perubahan tab lain. Jika backup/replacement gagal, draft tersimpan dipulihkan. Autosave cloud ditahan selama handoff.

Intent menjadi draft ID dan disimpan dalam learning context; sessionStorage acknowledgement mencegah replay pada tab yang sama. Jika sessionStorage tidak tersedia, identitas draft IndexedDB tetap mencegah replay untuk praktik aktif. Setelah berhasil, query command dibersihkan. Arsip draft lama dapat dipulihkan melalui menu proyek existing.

Learning context berada di envelope draft lokal yang backward-compatible, bukan cloud project payload. Context menyimpan lesson ID, practice ID, template version, dan intent. Simulator menampilkan panduan ringkas serta tombol kembali ke lesson yang menyelesaikan local flush terlebih dahulu. Membuka cloud snapshot pada perangkat lain tidak mengembalikan context lesson; circuit dan code tetap memakai format project existing.

## Simulator scope

Enam practice menggunakan Arduino Uno, LED, resistor, push button, potentiometer, dan rangkaian Traffic Light. Blink, button input, dan analog/PWM memiliki starter executable. LED wiring dimulai tanpa wires; debugging memiliki pin mismatch yang disengaja; Traffic Light menyediakan circuit dan skeleton program untuk dilengkapi learner. Tidak ada evaluator otomatis atau simulator rewrite.

Materi menjelaskan educational simulation dan Arduino-style subset. PWM menggunakan integer 0–255 secara eksplisit sesuai interpreter existing; library Arduino umum dan full C++ tidak diklaim didukung.

## Verification boundary

Vitest mencakup validation/ordering, snapshot compatibility, output Blink/button/pot/Traffic Light, confirmation, clean-cloud backup, recovery/replay, storage/network failure, owner mismatch, dan redirect contracts. Playwright menjalankan production build dengan Supabase transport fixture lokal: protected routes, login destination, public marketing, lesson navigation/404, practice Run/Stop, backup restore, failure recovery, mobile Sheet/focus, Light/Dark/System, dan regresi dashboard/persistence/workspace.

Fixture lokal tidak membuktikan remote Supabase Auth atau RLS. Tidak ada perubahan database atau verifikasi remote cloud pada milestone ini.
