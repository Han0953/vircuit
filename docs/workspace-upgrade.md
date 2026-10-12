# Virtual Lab workspace upgrade — 12 Oktober 2026

## Library dan controls

Parts memakai compact SVG tiles dari renderer canvas yang sama (`ComponentVisual` + `visualLayout`), bukan gambar tiruan. Thumbnail memoized tidak subscribe tick runtime. Search mencakup nama, type dan kategori; tanpa search, chip kategori membatasi hasil. Setiap tile memiliki status dukungan, focus/pressed/drag feedback dan tetap bisa diklik atau diseret. Batas snapshot 100 komponen juga berlaku saat menambah/duplicate.

Controls memakai tokens, rounded surfaces, menu Radix dan native wire-color select. Menu workspace beranimasi 180ms dengan reduced-motion branch. Mobile memakai sheet yang dapat scroll; tidak mengubah sidebar desktop atau sistem resize/Focus Mode.

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
| `lcd16x2` | I2C backpack: GND, VCC, SDA, SCL | Visual-only, alamat/kontras pratinjau; tanpa Wire/LiquidCrystal |
| `oled` | I2C: GND, VCC, SCL, SDA | Visual-only, alamat pratinjau; tanpa Wire/SSD1306 |

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
