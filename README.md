<div align="center">

  <!-- Dynamic Animated Header Wave -->
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:090d16,40:0052cc,80:0088ff,100:00d2ff&height=220&section=header&text=VIRCUIT&fontSize=72&fontColor=ffffff&fontAlignY=38&desc=Virtual%20Circuit%20%26%20IoT%20Learning%20Laboratory&descAlignY=58&descSize=20" width="100%" alt="Vircuit Header" />

  <!-- Animated Typing Tagline -->
  <a href="https://vircuit.vercel.app">
    <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=600&size=21&duration=2800&pause=1200&color=00B4D8&center=true&vCenter=true&width=650&height=50&lines=Learn+%E2%86%92+Build+%E2%86%92+Wire+%E2%86%92+Code+%E2%86%92+Simulate;Simulasi+IoT+Interaktif+Langsung+di+Browser;Arduino+%26+ESP32+Sandbox+dengan+Web+Worker;Didampingi+Cirra+-+Asisten+Belajar+AI+Pintar" alt="Typing SVG" />
  </a>

  <br />

  <!-- Technology Badges with modern styles -->
  <p align="center">
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js%2016-Turbopack-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" /></a>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React%2019-UI%20Library-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript%206-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind%20CSS%20v4-Styling-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" /></a>
    <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-Auth%20%26%20Postgres-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" /></a>
    <a href="https://ai.google.dev/"><img src="https://img.shields.io/badge/Google%20Gemini-Cirra%20AI-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" /></a>
    <a href="https://threejs.org/"><img src="https://img.shields.io/badge/Three.js-3D%20Showcase-049EF4?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js" /></a>
    <a href="https://vitest.dev/"><img src="https://img.shields.io/badge/Tests-320%2B%20Passing-10B981?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest" /></a>
  </p>

  <p align="center">
    <b>Platform pembelajaran Internet of Things (IoT) interaktif pertama berbasis kanvas sirkuit vektor, simulasi mikrokontroler real-time, dan bimbingan AI kontekstual.</b>
  </p>

  <p align="center">
    <a href="#-fitur-unggulan">✨ Fitur Unggulan</a> •
    <a href="#-cirra--asisten-belajar-ai">🤖 Cirra AI</a> •
    <a href="#-arsitektur--alur-sistem">⚡ Alur Sistem</a> •
    <a href="#-katalog-hardware">🔌 Hardware</a> •
    <a href="#-panduan-instalasi">🚀 Instalasi</a> •
    <a href="#-dokumentasi">📖 Dokumentasi</a>
  </p>

</div>

---

## 💡 Filosofi: Belajar IoT Lewat Praktik & Eksperimen

> [!NOTE]
> **Vircuit** bukan sekadar kanvas menggambar diagram kabel statis. Platform ini dirancang untuk menciptakan siklus belajar aktif: membuat kesalahan, memahami penyebab kegagalan sirkuit, memperbaiki kode, dan melihat hasil simulasi secara nyata tanpa risiko kerusakan alat fisik.

```mermaid
flowchart LR
    A["📘 1. LEARN<br/>Modul Teori"] --> B["🧩 2. BUILD<br/>Pasang Komponen"]
    B --> C["⚡ 3. WIRE<br/>Kabel Ortogonal"]
    C --> D["💻 4. CODE<br/>C++ / Arduino"]
    D --> E["⚙️ 5. SIMULATE<br/>Web Worker Engine"]
    E --> F{"🔍 6. DEBUG<br/>Korsleting / Bug?"}
    F -- "Ada Error" --> G["🤖 CIRRA AI<br/>Analisis Root-Cause"]
    G --> D
    F -- "Normal" --> H["🏆 7. CHALLENGE<br/>Evaluasi Otomatis"]
    H --> I["📈 8. EVALUATE<br/>Progress & KPI"]

    classDef step fill:#0c192c,stroke:#0070f3,stroke-width:2px,color:#fff;
    classDef ai fill:#1e1435,stroke:#a855f7,stroke-width:2px,color:#fff;
    classDef success fill:#062319,stroke:#10b981,stroke-width:2px,color:#fff;
    class A,B,C,D,E,F step;
    class G ai;
    class H,I success;
```

---

## ✨ Fitur Unggulan

<table width="100%">
  <tr>
    <td width="50%" valign="top">
      <h3>⚡ 1. Virtual Circuit Lab & Smart Wiring</h3>
      <ul>
        <li><b>Kanvas Vektor Bebas</b>: Bebas geser, pan, zoom halus, seleksi multi-komponen, dan rotasi pin 90°.</li>
        <li><b>Orthogonal Wire Routing</b>: Jalur kabel otomatis siku 90° yang menghindari tabrakan bodi komponen dan tetap menjaga identitas endpoint kelistrikan.</li>
        <li><b>Fisika Rangkaian Real-Time</b>: Deteksi resistor pembatas arus, polaritas anoda/katoda LED, hingga proteksi bypass daya.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>💻 2. In-Browser C++ Engine Sandbox</h3>
      <ul>
        <li><b>Monaco Editor Kelas Industri</b>: Syntax highlighting lengkap C++/Arduino dengan template siap pakai dan Serial Monitor interaktif.</li>
        <li><b>Non-Blocking Web Worker</b>: Loop simulasi mikrokontroler dijalankan pada thread terpisah sehingga antarmuka browser tetap 60 FPS tanpa jeda.</li>
        <li><b>Dukungan Core Arduino API</b>: <code>pinMode</code>, <code>digitalWrite</code>, <code>digitalRead</code>, <code>analogRead</code>, <code>analogWrite</code>, <code>delay</code>, <code>Serial</code>, dsb.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>🎯 3. Challenge Arena & Evaluasi Otomatis</h3>
      <ul>
        <li><b>Tantangan Berjenjang</b>: Skenario interaktif dari level pemula (LED Blink, Tombol Interaktif) hingga sistem IoT kompleks (Smart Incubator).</li>
        <li><b>Validasi Deterministik</b>: Pengujian otomatis berbasis sidik jari kelistrikan (electrical fingerprint) untuk menilai ketepatan kabel dan logika kode secara objektif.</li>
        <li><b>Pelacakan Progres</b>: Dashboard capaian, persentase kelulusan tantangan, dan KPI penguasaan materi.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>☁️ 4. Cloud Autosave & Guest Mode</h3>
      <ul>
        <li><b>Mode Tamu Instan (No-Auth)</b>: Langsung merakit dan menguji rangkaian tanpa wajib login; draf tersimpan lokal di IndexedDB.</li>
        <li><b>Autosave Cloud Cerdas</b>: Sinkronisasi draf otomatis ke database Supabase dengan resolusi konflik revisi berbasis timestamp.</li>
        <li><b>Migrasi Draf Sekali Klik</b>: Pengguna tamu dapat memigrasikan seluruh draf lokal ke akun cloud saat mendaftar tanpa kehilangan data.</li>
      </ul>
    </td>
  </tr>
</table>

---

## 🤖 Cirra — Asisten Belajar AI Pintar

<div align="center">
  <table>
    <tr>
      <td width="30%" align="center">
        <img src="public/Cirra.webp" alt="Cirra AI Avatar" width="180" style="border-radius: 16px;" /><br />
        <b>Cirra</b><br />
        <i>AI IoT Learning Companion</i>
      </td>
      <td width="70%" valign="middle">
        <p><b>Cirra</b> bukan chatbot biasa. Cirra dapat <i>melihat</i> topologi rangkaian, kabel yang Anda pasang, kode yang Anda tulis di Monaco Editor, serta log kegagalan evaluasi secara langsung menggunakan <b>Google Gemini API</b>.</p>
        <details open>
          <summary><b>🎯 3 Mode Spesialisasi Cirra:</b></summary>
          <ol>
            <li><b>🎓 Mode Tutor</b>: Menjelaskan konsep elektro, rumus hukum Ohm, dan cara kerja sensor tanpa langsung membocorkan jawaban kode.</li>
            <li><b>🐞 Mode Debugger</b>: Memeriksa pinpoint kabel yang salah colok, port yang tertukar, atau timing loop yang membuat sensor hang.</li>
            <li><b>🛠️ Mode Project Assistant</b>: Merekomendasikan diagram pengkabelan, spesifikasi mikrokontroler, dan arsitektur proyek IoT baru.</li>
          </ol>
        </details>
      </td>
    </tr>
  </table>
</div>

---

## 🔌 Katalog Perangkat Keras & Komponen

Semua komponen dirender menggunakan **High-Craft Vector SVG** dan model **3D Three.js** untuk tampilan crisp di semua resolusi:

| Kategori | Komponen | Visual & Status Interaktif |
| :--- | :--- | :--- |
| **Microcontrollers** | **Arduino Uno R3**, **ESP32 DevKit**, **Arduino Nano** | Power LED, Builtin L-LED (Pin 13), Pinout realistis |
| **Displays** | **OLED 0.96" I2C (SSD1306)**, **LCD 16x2 I2C**, **7-Segment** | Live text rendering, I2C address sync |
| **Sensors** | **DHT22** (Temp/Humidity), **HC-SR04** (Ultrasonik), **PIR** | Slider interaktif nilai suhu, jarak, dan trigger gerak |
| **Actuators** | **Relay Modul 5V**, **Micro Servo SG90** | Indikator saklar NO/NC, Animasi rotasi sudut servo |
| **Passive & Controls**| **LED** (5 warna), **Resistor**, **Push Button**, **Potensiometer** | Glow emisi cahaya, slider resistansi, klik kontak tekan |
| **Prototyping** | **Breadboard Full-Size (830)**, **Breadboard Half (400)** | Visualisasi rel daya (+/-) dan terminal strip terkoneksi |

---

## 📐 Arsitektur Sistem

```mermaid
graph TD
    subgraph Client["🖥️ Browser Client (Next.js 16 + React 19)"]
        UI["App Shell & Navigation"]
        Canvas["XYFlow Virtual Circuit Canvas<br/>(Interactive Vector SVG)"]
        Editor["Monaco Editor (C++ / Arduino)"]
        Chat["Cirra AI Interface"]
    end

    subgraph Sandbox["⚡ Background Worker"]
        Worker["Web Worker Sandbox"]
        Engine["C++ Interpreter & Electrical Graph Engine"]
    end

    subgraph Backend["☁️ Server & Cloud Services"]
        RouteAPI["App Router API Handlers"]
        Gemini["Google Gemini API<br/>(Cirra Fast & Smart Models)"]
        Supabase["Supabase Cloud<br/>(PostgreSQL + RLS + Auth SSR)"]
    end

    Canvas <-->|State Synchronizer| Worker
    Editor -->|Compile & Run| Worker
    Worker -->|Electrical Events / Serial Output| Canvas
    Worker -->|Console Log| Editor
    
    Chat -->|Injected Circuit & Code Context| RouteAPI
    RouteAPI -->|Prompt with Safety Guardrails| Gemini
    UI <-->|Autosave & Project Revision| RouteAPI
    RouteAPI <-->|Row Level Security| Supabase

    classDef clientStyle fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#fff;
    classDef workerStyle fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#fff;
    classDef serverStyle fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#fff;
    class UI,Canvas,Editor,Chat clientStyle;
    class Worker,Engine workerStyle;
    class RouteAPI,Gemini,Supabase serverStyle;
```

---

## 🚀 Panduan Memulai Cepat

### 1. Prasyarat Sistem
- **Node.js**: `24.x` (LTS)
- **Package Manager**: `pnpm` versi `11.19.0` (atau `npm`)

### 2. Kloning & Instalasi
```bash
# Kloning repositori
git clone https://github.com/Han0953/vircuit.git
cd vircuit

# Pasang dependensi
pnpm install --frozen-lockfile
```

### 3. Konfigurasi Environment
Salin template konfigurasi `.env.example`:
```bash
cp .env.example .env.local
```

Sesuaikan kunci layanan:
```env
# Supabase Cloud Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SECRET_KEY=your-supabase-secret-key

# Google Gemini API (Server-side Only)
GEMINI_API_KEY=your-gemini-api-key
CIRRA_MODEL_FAST=gemini-3.1-flash-lite
CIRRA_MODEL_SMART=gemini-3.5-flash-lite
CIRRA_LIMIT_STORE=database
```

> [!TIP]
> **Tanpa Akun & Tanpa API Key:** Anda tetap dapat menjalankan Virtual Lab simulator dan merakit sirkuit secara lokal/offline sepenuhnya tanpa konfigurasi database atau Gemini.

### 4. Jalankan Dev Server
```bash
pnpm dev
```
Buka browser Anda di **`http://localhost:3000`** 🚀

---

## 🧪 Skrip Pengujian & Kualitas Kode

Repository ini menerapkan kebijakan kualitas ketat (*Zero-Warning Policy*):

```bash
# Menjalankan 320+ tes unit & integrasi
pnpm test

# Verifikasi konsistensi type TypeScript & route types
pnpm typecheck

# Analisis linting ESLint (max-warnings=0)
pnpm lint

# Uji build produksi Turbopack
pnpm build

# Menjalankan tes end-to-end Playwright
pnpm test:e2e
```

---

## 📁 Struktur Repositori

```text
vircuit/
├── app/                      # Next.js App Router
│   ├── (marketing)/          # Halaman publik (Beranda, Fitur, Belajar, Harga, Jelajahi)
│   ├── api/                  # API Endpoint (Cirra AI, Auth, Challenges, Projects)
│   ├── dashboard/            # Dashboard pengguna (Proyek, Tantangan, Progres, Modul)
│   └── simulator/            # Canvas Simulator Workspace
├── components/               # Komponen UI Reusable
│   ├── marketing/            # Scene visual, hero, showcase 3D, dan latar dinamis
│   ├── shared/               # Komponen lintas domain (BrandLogo, ThemeToggle, BackButton)
│   └── ui/                   # Komponen primitif shadcn/ui
├── features/                 # Arsitektur Berbasis Domain
│   ├── ai/                   # Engine Cirra, model routing, system prompt, avatar, UI chat
│   ├── auth/                 # Supabase Auth, middleware, login & register form
│   ├── challenges/           # Evaluator otomatis kelistrikan & definisi tantangan
│   ├── dashboard/            # Shell dashboard, KPI grid, schematic thumbnail
│   ├── learning/             # Modul pembelajaran terstruktur & handoff simulator
│   ├── progress/             # Pelacakan progres belajar & ringkasan capaian
│   ├── projects/             # Cloud autosave, draft IndexedDB, resolusi revisi
│   └── simulator/            # Mesin simulator: graph, runtime, worker, catalog, canvas
├── agent/                    # Dokumen spesifikasi teknis, pedoman arsitektur, dan backlog
│   ├── AGENT.md              # Aturan kerja coding agent
│   └── docs/                 # PRD, DESIGN, SIMULATOR, AI, SECURITY, ARCHITECTURE
├── public/                   # Aset media WebP resmi (Logo.webp, Cirra.webp, dsb.)
├── supabase/                 # Skrip migrasi database SQL & Row Level Security
└── tests/                    # Test suite Vitest & Playwright E2E
```

---

## 📖 Dokumentasi Lengkap

Untuk panduan teknis mendalam, baca dokumen di folder [`agent/docs/`](file:///c:/vircuit/agent/docs/):

| Dokumen | Topik Pembahasan |
| :--- | :--- |
| 📄 **[PRD.md](file:///c:/vircuit/agent/docs/PRD.md)** | Product Requirement Document, target persona, dan visi produk |
| 🎨 **[DESIGN.md](file:///c:/vircuit/agent/docs/DESIGN.md)** | Design tokens, palet warna, tipografi, dan panduan UI |
| ⚡ **[SIMULATOR.md](file:///c:/vircuit/agent/docs/SIMULATOR.md)** | Spesifikasi mesin simulasi, pinout, dan perutean kabel |
| 🤖 **[AI.md](file:///c:/vircuit/agent/docs/AI.md)** | Arsitektur Cirra, prompt guardrails, dan context injection |
| 🛡️ **[SECURITY.md](file:///c:/vircuit/agent/docs/SECURITY.md)** | Kebijakan keamanan, sandbox worker, dan isolasi RLS |
| 🏛️ **[ARCHITECTURE.md](file:///c:/vircuit/agent/docs/ARCHITECTURE.md)** | Arsitektur sistem frontend, worker thread, dan Supabase backend |

---

<div align="center">

  <!-- Dynamic Animated Footer Wave -->
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:00d2ff,40:0088ff,80:0052cc,100:090d16&height=130&section=footer" width="100%" alt="Vircuit Footer" />

  <p>
    <b>Vircuit</b> • Dibuat dengan dedikasi untuk masa depan edukasi Internet of Things Indonesia.<br />
    Hak Cipta &copy; 2026 Vircuit. All rights reserved.
  </p>

</div>
