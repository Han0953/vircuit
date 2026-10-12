# Virtual Lab workspace upgrade — 12 Oktober 2026

## Library dan controls

Parts memakai compact SVG tiles dari renderer canvas yang sama (`ComponentVisual` + `visualLayout`), bukan gambar tiruan. Thumbnail memoized tidak subscribe tick runtime. Search mencakup nama, type dan kategori; tanpa search, chip kategori membatasi hasil. Setiap tile memiliki status dukungan, focus/pressed/drag feedback dan tetap bisa diklik atau diseret. Batas snapshot 100 komponen juga berlaku saat menambah/duplicate.

Controls memakai tokens, rounded surfaces dan menu Radix. Pilihan warna kabel, contoh program, board contoh dan mode Cirra memakai radio menu dengan selected indicator, keyboard navigation, icon/description serta feedback open/focus. Menu workspace beranimasi 180ms dengan reduced-motion branch. Mobile memakai sheet yang dapat scroll; tidak mengubah sidebar desktop atau sistem resize/Focus Mode.

## Selection dan history

Satu selection existing di canvas store memuat component IDs dan wire IDs. React Flow node/edge selection changes digabung secara batch; referensi terhapus dipangkas. Shift/Ctrl/Cmd-click, Shift-drag atau mode Pilih area, Ctrl/Cmd+A, Escape, Delete/Backspace tersedia pada canvas. Input, textarea, select, contenteditable dan Monaco tidak diambil alih shortcut canvas.

Delete Selected menghapus semua pilihan serta kabel yang terkait komponen terhapus dalam satu history entry. Delete All meminta konfirmasi, menghapus komponen/kabel dan melepaskan active board, tetapi mempertahankan source C++, metadata serta viewport. Undo/Redo memulihkan snapshot melalui history existing; empty operation tidak mengonsumsi history. Persistensi existing menyimpan perubahan project, bukan selection atau tick runtime.

## Audit catalog

Awal sesi: 13 entries (Uno, Nano, ESP32, tiga breadboard, LED, resistor, button, pot, DHT22, relay, fan). Ketujuh kandidat baru belum terdaftar, belum punya renderer atau runtime. Kini 20 entries memiliki thumbnail dari visual canvas aktual.

| Type stabil | Model / pin contract | Dukungan |
| --- | --- | --- |
| `uno`, `esp32` | Board abstraction existing | Runtime subset digital/analog/PWM/Serial; bukan MCU emulator |
| `nano` | Nano klasik existing | Visual-only; Run belum mendukung board ini |
| `breadboard-mini`, `breadboard-half`, `breadboard-full` | Hole/rail groups existing | Connectivity melalui explicit wiring, bukan overlap visual |
| `led`, `resistor`, `button`, `pot`, `dht22`, `relay`, `fan` | Existing model dipertahankan | Runtime edukatif existing |
| `ldr` | Module AO/DO: VCC, GND, DO, AO | Runtime: cahaya virtual 0–100%; AO menurun saat cahaya naik, DO LOW di atas threshold |
| `pir` | VCC, OUT, GND | Runtime: toggle gerakan → digital input; tanpa warm-up/retrigger fisik |
| `buzzer` | Active buzzer: +, − | Runtime on/off visual; tanpa audio/tone/noTone |
| `hcsr04` | VCC, TRIG, ECHO, GND | Visual-only, jarak pratinjau 2–400 cm; tanpa trigger/echo/pulseIn |
| `servo` | GND, VCC, SIG | Visual-only, horn property 0–180°; tanpa Servo library/pulse-control |
| `lcd16x2` | I2C backpack: GND, VCC, SDA, SCL | Runtime teks virtual 16×2, alamat/kontras; tanpa Wire/LiquidCrystal |
| `oled` | I2C: GND, VCC, SCL, SDA | Runtime teks virtual 21×8, alamat; tanpa Wire/SSD1306/graphics API |

Pin order adalah contract modul yang ditampilkan; bukan klaim semua varian hardware mempunyai urutan sama. LDR adalah module empat pin, bukan bare photoresistor. Visual-only items diberi label di Parts, Properties dan warning Problems; tidak menghasilkan output program palsu. Semua tambahan memakai numeric properties dan snapshot v1 existing; tidak ada migration, synthetic wire atau format project baru.

## Runtime audit dan perbaikan

Program dijalankan melalui `SimulationEngine`, lalu alur utama diverifikasi melalui worker browser asli. Matriks A–H:

| Test | Bukti yang diperiksa |
| --- | --- |
| A Blink | setup sekali, loop/while, variable, delay, LED wired HIGH/LOW dan virtual time |
| B Button | INPUT_PULLUP, digitalRead dan ground button mengendalikan LED |
| C Analog | Pot → analogRead → integer brightness → PWM; endpoint 0/100% |
| D Serial | begin/print/println memuat nilai program, buffer dibatasi 20.000 karakter |
| E Invalid code | Syntax, pin invalid dan pembagian nol menghasilkan diagnostic |
| F Unsupported API | tone, pulseIn, fetch, Servo.write dan include ditolak eksplisit |
| G Stop/Restart | Worker lama diterminasi, state berhenti, restart bersih dan hanya satu worker aktif |
| H Wiring error | Short power/GND menghalangi Run; LED terbalik/terputus tidak menyala |

Bug ditemukan dan diperbaiki: interpreter membuang declaration type sehingga `int brightness = analogRead(A0)/4` menghasilkan 255.75 dan ditolak PWM. Integer assignment kini truncate, float/double tetap pecahan, bool dinormalisasi dan const tidak dapat ditulis ulang. Ini tetap subset edukatif: belum menyediakan native C++ type promotion, integer-width/overflow semantics, `for`, arrays, arbitrary functions, includes atau library Arduino.

Worker construction/postMessage failures menjadi runtime diagnostics. Pesan/error worker lama diabaikan setelah restart. Instruction budget 20.000 per step dan watchdog 65 detik tetap berlaku. Source dibatasi 20.000 karakter/5.000 tokens; tidak ada unrestricted eval, DOM atau network dari user code.

## Validation suites

- Unit: `component-thumbnails`, `selection-history`, `extended-components`, `runtime-audit`, `worker-lifecycle`, beserta suite existing.
- Browser: `workspace-upgrade`, `runtime-audit`, `simulator`, `workspace`, `workspace-visuals`, `component-realism`, `wire-routing`, `persistence`.
- Browser menggunakan Edge lokal dan fixture persistence existing; bukan bukti koneksi Supabase production atau RLS remote.
- Mobile berupa touch emulation, termasuk 360/390/430px; bukan verifikasi perangkat Android/iOS fisik.

Hasil lokal: lint, typecheck dan build PASS; unit suite 257 PASS / 6 skipped. Delapan browser suites menghasilkan 36 PASS / 0 failed; suite upgrade 7/7 diuji ulang setelah pemisahan label HC-SR04. Screenshot tersedia di `playwright-report/workspace-gallery-{Terang,Gelap}.png` dan `workspace-{light-360,dark-390,system-430}.png`. Pergantian tema dua arah juga diperiksa.

Profil routing/drag existing pada Edge lokal (bukan benchmark lintas perangkat):

| Scene | Komponen / kabel | Max routing batch | Max drag frame |
| --- | --- | --- | --- |
| Small | 8 / 10 | 1,6 ms | 33,3 ms |
| Medium | 40 / 200 | 4,0 ms | 50,2 ms |
| Stress | 100 / 500 | 13,3 ms | 83,3 ms |

Tidak ada fallback pada tiga fixture tersebut. Stress scene masih memiliki frame spike; tidak diklaim 60fps atau dibandingkan terhadap baseline sebelum upgrade.

## Hardware references

- [SunFounder photoresistor module](https://docs.sunfounder.com/projects/umsk/en/latest/01_components_basic/11-component_photoresistor.html): contract AO/DO dan arah response cahaya.
- [HC-SR04 datasheet](https://cdn.sparkfun.com/datasheets/Sensors/Proximity/HCSR04.pdf): power, trigger, echo, ground.
- [Adafruit PIR connection](https://learn.adafruit.com/pir-passive-infrared-proximity-motion-sensor/connecting-to-a-pir): power/output/ground.
- [Arduino servo motors](https://docs.arduino.cc/learn/electronics/servo-motors/): power/ground/signal.
- [Adafruit monochrome OLED](https://learn.adafruit.com/monochrome-oled-breakouts?view=all): I2C variant distinction.

Tidak ada asset hardware eksternal yang disalin.

## Cirra identity dan workspace exit — 12 Oktober 2026

Tombol, floating bubble dan header Cirra tetap memakai ikon Lucide. Foto profil dari asset user `public/Cirra.webp` muncul di samping bubble sapaan, indikator menunggu dan balasan assistant, melalui Next Image dengan crop wajah dan dimensi tetap. Pesan user rata kanan dan lebarnya mengikuti isi hingga maksimum 85% area log; balasan rata kiri, dengan surface/border berdasarkan token tema. Tombol kembali workspace menyimpan draft lokal terlebih dahulu, kemudian menuju `/` untuk guest atau `/dashboard` untuk akun aktif, tanpa mengikuti browser history. Storage failure tetap menampilkan error dan menahan navigation. Banner informasi umum di bawah topbar dihapus; runtime diagnostics tetap berada di Problems.

Selama request, indikator tiga titik dan label “Cirra sedang berpikir…” berada di log percakapan tepat setelah pesan user, bukan di atas composer. Setelah respons tervalidasi diterima, jawaban baru muncul bertahap melalui opacity reveal pada maksimal 80 kelompok kata, lalu poin tambahan ikut fade in. Durasi total dibatasi 2,54 detik, dengan fade lebih lembut untuk jawaban pendek. Tinggi teks akhir sudah dialokasikan agar posisi baca tidak berubah. Teks penuh tetap ada pada DOM untuk aksesibilitas, copy dan tanpa JavaScript. Ini animasi presentasi, bukan streaming token dari backend. Riwayat lama tidak dianimasikan ulang. Animasi selesai langsung ketika panel disembunyikan atau reduced motion aktif; cleanup membatalkan animasi tanpa mengubah conversation state. Lifecycle tidak menandai animasi selesai saat cleanup sementara React Strict Mode, sehingga setup ulang tetap dapat menampilkan animasi.

Validasi refinement: lint/typecheck/build PASS, seluruh unit suite 304 PASS / 6 skipped (19 tes terkait PASS), 17 browser tests PASS / 0 failed / 0 flaky (`workspace-identity`, `workspace`, `cirra`, `cirra-ux`). Delapan tes `cirra-ux` juga PASS setelah setup Light/Dark/System diperiksa memakai storage key aplikasi. Browser memastikan ikon entry/header, PP dan bubble sapaan/balasan, lebar pesan pendek, typing tepat setelah user, reveal jawaban/poin tambahan, riwayat tidak diputar ulang, perubahan reduced motion, posisi baca, draft guest tersimpan sebelum keluar, tujuan back dan mobile tanpa overflow. Tema System diuji saat preferensi OS berubah. Screenshot lokal: `playwright-report/cirra-response-desktop.png`, `cirra-typing-in-thread.png`, `cirra-greeting-{light-360,dark-390,system-430}.png` dan `cirra-bubbles-{light-360,dark-390,system-430}.png`. Tes memakai respons AI fixture dan mobile emulation pada Edge lokal; bukan pengujian request Gemini production atau perangkat fisik.

## Display dan contoh rangkaian — refinement 12 Oktober 2026

LCD/OLED kini menampilkan data program dari worker, bukan teks demo statis. API subset eksplisit: `LCD.begin(39)`, `LCD.clear()`, `LCD.setCursor(kolom, baris)`, `LCD.print(teks/angka)`; OLED memakai nama `OLED` dan alamat default desimal 60. Alamat mengikuti Properties, harus unik pada bus. SDA/SCL terhubung ke A4/A5 pada Uno atau GPIO21/GPIO22 pada ESP32, dengan VCC dan GND. Bus terputus, tertukar, short, alamat salah, cursor di luar batas atau pemanggilan sebelum begin menghasilkan diagnostic. Tidak mendukung library Arduino native atau grafis OLED.

Buffer dibatasi dimensi layar; print terpotong pada akhir baris tanpa wrap. Clear mengosongkan layar/cursor. Stop mempertahankan output terakhir; Reset atau runtime baru mengosongkan buffer. Output hanya berada di runtime store dan tidak masuk snapshot, history, autosave atau IndexedDB. Bridge mempertahankan object identity jika isi display tidak berubah.

Galeri berisi 12 contoh executable untuk Uno dan ESP32: Blink, LED, Button, Potentiometer/PWM, DHT22/Relay/Fan, Traffic Light, LDR, PIR, active Buzzer, LCD/analog, OLED/DHT22 dan Serial counter. Thumbnail SVG berasal dari snapshot komponen/pin/kabel aktual, memakai renderer canvas yang sama. Tidak menambahkan asset gambar atau dependency.

Opsi **Gunakan rangkaian contoh juga** membuka snapshot v1 sebagai draft lokal baru setelah mengarsipkan project aktif, termasuk clean cloud draft. Cloud identity tidak dipindahkan ke contoh dan tidak ada cloud write otomatis. Arsip tersedia di menu Proyek. Bila opsi dimatikan, hanya kode diganti sesuai board aktif; circuit/draft identity tetap, dan Undo dapat memulihkan kode. Penggantian kode langsung di Code Workspace juga meminta konfirmasi. Recovery/storage failure tidak boleh menimpa draft aktif secara diam-diam.

Tambahan suite: `display-runtime` menguji API, dimensi, wiring, alamat, reset dan isolation buffer; `examples` menjalankan seluruh 24 kombinasi contoh/board melalui SimulationEngine, round-trip serialization, sensor/output behavior dan draft safety; browser `display-examples` memeriksa data LCD/OLED nyata, archive/reload, code-only/Undo, keyboard menus dan galeri 360/390/430px dalam Light/Dark/System.

Validasi refinement lokal: lint/typecheck/build PASS; Vitest 302 PASS / 6 skipped; sembilan browser suites (`display-examples`, `runtime-audit`, `simulator`, `workspace`, `workspace-upgrade`, `persistence`, `wire-routing`, `cirra`, `cirra-ux`) 40 PASS / 0 failed / 0 flaky. Pengujian mobile mencakup focus trap menu Cirra yang dipindahkan ke portal. Tema dashboard pada suite existing memakai radio semantics actual; browser assertions menunggu navigasi selesai sebelum shortcut Undo. Screenshot: `playwright-report/examples-gallery-desktop.png`, `examples-program-dropdown.png`, `lcd-live-data.png`, `oled-live-data.png`, `examples-{light-360,dark-390,system-430}.png`. Ini Edge lokal/fixture services dan mobile emulation, bukan bukti perangkat fisik atau remote Supabase/Gemini.

## Focus styling — 12 Oktober 2026

Ring biru pada klik/tap tombol tutup Dialog/Sheet dihapus; indikator keyboard memakai outline netral melalui focus-visible. Tombol tutup Cirra pada workspace dan lesson memakai treatment yang sama. Composer Cirra tidak lagi memberi ring pada seluruh kotak saat textarea atau kontrolnya fokus; border netral mengikuti theme. Focus trap, autofocus, Escape dan input tidak diubah.

Validasi: lint/typecheck/build PASS; Vitest 304 PASS, 6 skipped; suite browser cirra-ux 11 PASS termasuk klik/tap pada 1440/360/430px, composer tanpa box-shadow, dialog close tanpa ring saat pointer-down, serta outline keyboard tetap terlihat. Screenshot: playwright-report/cirra-focus-{1440,360,430}.png. Mobile menggunakan emulasi touch Edge, bukan perangkat fisik.
