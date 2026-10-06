# Vircuit

Virtual Circuit Learning & Simulation Platform.

## Project Structure
- `agent/`: Project documentation, architecture guides, and agent workflow instructions.

## Local Development

Gunakan Node.js 24 dan pnpm 11.19.0 (lihat `packageManager` di `package.json`).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Buka `http://localhost:3000`. Foundation ini tidak membutuhkan environment variable.
Jangan commit `.env.local` atau secret.

```sh
pnpm lint
pnpm typecheck
pnpm build
pnpm start
```

Vitest dan Playwright belum disiapkan (VIR-010 dan VIR-011).

## Foundation Boundaries

- `app/`: App Router dan global styles; route groups dipisahkan per area.
- `components/ui/`: primitive shadcn/ui dengan token Vircuit.
- `components/shared/`: theme provider dan theme toggle lintas shell.
- `components/layout/`: tempat shell layout berikutnya.
- `features/`: domain auth, projects, simulator, learning, challenges, progress, dan AI.
- `features/simulator/`: UI terpisah dari graph, runtime, validation, dan worker.
- `lib/`: helper yang benar-benar shared (`cn` untuk penggabungan class).
- `stores/`, `workers/`, `public/`, `tests/`: boundary untuk tahap selanjutnya.

Folder kosong dipertahankan dengan `.gitkeep`; belum ada business logic atau store.
Token warna, surface, spacing, radius, typography, motion, dan elevation berada di
`app/tokens.css`. Base styles dan reduced motion berada di `app/globals.css`.
Theme menggunakan class, default System, dan preference lokal `vircuit-theme`.
Font masih menggunakan system fallback; pemilihan font final menjadi VIR-008.
