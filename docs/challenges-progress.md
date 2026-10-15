# Challenges + Progress

## Content and evaluation

`features/challenges/registry.ts` contains six versioned, Zod-validated definitions. Each refers to an existing lesson and practice. IDs are independent of titles. One challenge belongs to one practice; `lesson.tegangan-ground` remains informational.

Rules are `component_roles`, `electrical_path`, `circuit_valid`, `program_valid`, and `behavior_scenario`. Role candidates use component types, never starter IDs, coordinates or labels. A unique candidate is automatic; ambiguous LED roles need explicit selection. Hints are static and referenced by challenge ID + rule ID.

Evaluation takes a copied project v1 and bindings. It builds the electronics graph, checks resistor paths/bypasses and ground, parses the supported program, then runs a separate `SimulationEngine`. Circuit layout and runtime UI outputs are not grading inputs. A SHA-256 fingerprint covers canonical project data, resolved bindings and challenge/evaluator/engine versions. Changing those semantics requires a version bump and updated golden tests.

Steady LED, at least two Blink cycles, pressed/released response, graded PWM, and RED → GREEN → YELLOW repetition are checked from positive-duration output intervals. A step's output applies between the engine's previous time and its returned time. Identical contiguous outputs merge. Button/PWM are tested in two different controlled input orders with a fresh engine per trial.

Limits: 512 steps, 10,000ms total virtual time, the existing 20,000 instructions per step, a 2-second wall-time cutoff checked between steps, 40 components, 200 wires and 3,000 catalog pins. Browser preview runs in a dedicated worker with a 5-second watchdog. Server execution yields every 32 steps. These are educational behavior checks, not a full electronics/Arduino emulator or proof of arbitrary programs.

## Practice safety

Challenge launch reuses the practice command (`lesson`, `practice` UUID intent, optional `challenge=1`). Fresh launches confirm and archive the active draft before replacement. If the same practice is already active, its circuit/code/cloud identity is retained and only learning context is upgraded. Draft context fields are optional for compatibility. Project snapshot v1 is unchanged.

Fresh challenge code is unfinished. Debug starts with wrong code and a wrong LED return connection. Returning to a lesson flushes the existing draft. Evaluation never hydrates or resets the live circuit or simulation worker. Results are labeled stale when the project/bindings change. Challenge feedback remains separate from simulator Problems.

## Trusted persistence

`supabase/migrations/20261007120000_challenges_progress.sql` is applied remotely after the auth/project migration as of 15 October 2026 (verification below). Local tests separately apply both migrations to temporary PGlite databases.

Configure `SUPABASE_SECRET_KEY` in `.env.local` for local development and as a server-only deployment variable. Use a Supabase secret key (`sb_secret_…`) from the project dashboard. Never put its value in chat, Git, examples, logs or a `NEXT_PUBLIC_` variable. Keep publishable configuration for user-context reads. See [Supabase key guidance](https://supabase.com/docs/guides/getting-started/api-keys).

Without this configuration, verified writes return 503 and local evaluation remains available. No completion is simulated. The loopback Playwright fixture supplies a marker accepted only by that fixture; it is not a remote credential. Production code has no test/demo auth bypass.

Submission verifies `getUser()`, same origin, account handoff header, strict input, challenge version and optional project ownership. Rules come from the server registry and the snapshot is re-evaluated. Client `passed`, rules, owner and scores are rejected. The account header compares intended identity with the verified session; it is not an authorization source.

`record_challenge_attempt` is executable only by `service_role`, uses an empty search path and qualified relations, and atomically records a bounded summary + completion. No full circuit or Serial history is stored in attempts. A per-user transaction lock, unique operation and snapshot/version keys handle retries/concurrent writes. Duplicate fingerprints return the existing attempt; replay operation IDs retain immutable operation semantics (up to 256 aliases per attempt). New meaningful attempts are limited to 120 per hour. Completion is monotonic. Cloud project ownership is checked again in SQL.

`record_learning_event` is trusted-only. The application checks published content. Only the informational lesson can be manually completed. Opening a lesson records `in_progress`. Both tables reference `auth.users`, so learning does not require a prior cloud project/profile insert.

Authenticated clients have SELECT only with own-user RLS. Anonymous access and direct writes/RPC calls are denied. A trusted writer is never used to prove read isolation. Remote RLS requires verification with two authenticated user contexts.

## Progress and recovery

Course/module percentages and skill coverage derive from completed published lessons in the current registry. No aggregate percentage, proficiency score, XP or streak is stored. Continue Learning chooses newest `in_progress`, then first incomplete in authored order, then first lesson for an empty history; a completed path offers review. Ties use deterministic content order.

Before submitting, `vircuit-learning` IndexedDB stores the immutable snapshot, bindings, operation ID, fingerprint and local preview under its account. The queue is limited to 10 items per account; identical snapshots reuse a pending item. Retry sends that exact payload. Only an acknowledgment matching owner, operation and fingerprint removes it. Failure keeps the result and shows “Hasil lokal — belum tersinkronisasi”; it never increases cloud progress. Simulator and dashboard can retry recovered entries.

Logout clears only that account's pending queue alongside its private project cache. Confirmation warns about unsynchronized results. Guest/unrelated drafts remain. Switching accounts never submits another account's queue; the server rejects an intended account that differs from the session.

## Validation

`pnpm test` includes evaluator/immutability/alternative solutions, progress aggregation, IndexedDB retry, request boundaries and PGlite migrations/RLS/atomicity/idempotency. `pnpm test:e2e` uses production Next.js, a loopback Auth transport fixture and temporary PostgreSQL progress tables. This verifies local integration, not remote Supabase Auth/RLS.

Checkpoint 2026-10-07: lint, typecheck, build and 80 Vitest tests across 24 files pass. The 21-test Playwright suite covers desktop/mobile, Light/Dark/System, verified Blink completion, manual informational completion, dashboard counts, offline refresh/retry, and existing auth/project/simulator/workspace regressions. Debug golden tests require correcting both starter wiring and code. Desktop and mobile screenshots were inspected. No remote migration, remote user-isolation verification, commit or deployment was performed.

At the 7 October checkpoint, the remaining remote prerequisites were applying the migration, configuring the server-only writer, and verifying own/cross-user/anonymous reads and denied client writes with real JWTs. These prerequisites were verified on 15 October as recorded below. A secret/service role is never proof of user isolation.

## Remote persistence repair — 15 October 2026

- The repeated dashboard “Data tidak tersedia / Progress gagal dimuat” was traced to missing remote `learning_progress` and `challenge_attempts` tables (PostgREST PGRST205/404). Remote migration history had auth/projects and Settings only. This was a schema deployment blocker, not an empty-user state.
- Applied the existing `20261007120000_challenges_progress.sql` without changing its contents, in a transaction with its migration-history record and a PostgREST schema-cache notification. A checksum guard verified the SQL before execution; stored/local whitespace-normalized MD5 match: `b6deeed9f33190d0522640cb137c9035`. No database reset, existing-data deletion or unrelated migration.
- `tests/security/remote-progress.mjs`: **25 remote assertions PASS**. Real authenticated A/B JWT contexts can read their own progress/attempts, cannot read the other's rows, cannot directly update/delete or invoke trusted writer RPCs; anonymous reads are denied. A privileged client only creates and cleans uniquely identified, unpassed synthetic attempts. Synthetic records were cleaned.
- `tests/remote/dashboard-progress.spec.ts`: **2/2 PASS** against actual Supabase using the production app on port 3003. Dashboard/Learn/Challenges/Progress/Projects load at 1440/390px with no data-error/retry UI or overflow. Real lesson activity and manual completion return through the existing server writer, survive reload, and update Dashboard to 1/7 lessons (14%) with the next lesson recommendation. The test account's original lesson row is restored in `finally`; no personal account was changed.
- Retry UI now exposes pending/disabled state while re-fetching server data. Next 16's `retry` callback replaces the legacy boundary-only `reset` in Dashboard/Learning error boundaries. Failed manual completion retries `complete`, rather than accidentally recording only `open`. Actual outage errors remain visible and never become fake zero progress.
- Inspected screenshots: `test-results/dashboard-progress-remote/dashboard-progress-real-Su-bc852-pages-on-desktop-and-mobile/remote-dashboard-{1440,390}.png` and `test-results/dashboard-progress-remote/dashboard-progress-lesson--65a96-al-server-writer-and-reload/remote-completed-progress.png`. These are local production-browser sessions connected to Supabase, not a website deployment or physical-device test.
