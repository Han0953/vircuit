# Cirra integration

Cirra is an AI learning companion, with Tutor, Debugger, and Project Assistant modes. Communication uses Indonesian aku/kamu with a female persona; Cirra remains explicitly AI. The deterministic challenge evaluator is the authority. AI cannot submit attempts, complete lessons, edit a project, or change simulation state.

## Server boundary

`POST /api/ai/cirra` checks same-origin JSON, verified Supabase `getUser()`, account identity, strict Zod inputs and owned cloud project IDs. Guest simulator access remains public. `features/ai` separates configuration, provider, context, prompts, limits and session UI. Only server modules import `@google/genai`.

The official SDK is pinned in pnpm. Set server-only `GEMINI_API_KEY`, `CIRRA_MODEL_FAST`, and `CIRRA_MODEL_SMART`. Models verified against Google documentation are `gemini-3.1-flash-lite` and `gemini-3.5-flash-lite`. Simple Tutor questions use FAST; Debugger, Assistant, failed deterministic evaluations and complex Tutor questions use SMART. An optional server override can force either category. Clients cannot choose a model or quota.

Responses use bounded, validated JSON rather than streaming partial JSON. Request cancellation and a shared deadline are supported, with one retry for transient provider 500/502/503 only. Malformed responses and timeouts produce safe Indonesian errors; raw provider errors are never returned. Workspace Cirra is a floating bubble/window inside the center column of Circuit and Code, with desktop tooltip and mobile fullscreen chat. Topbar and Problems open the same instance. Minimize retains composer/history; Escape closes and restores focus. Lesson keeps its existing Sheet. Opening chat does not resize the bottom panel. Reference enums are generated from the current context (line references limited to the first 200 included lines).

## Context and privacy

Each send captures a fresh draft. The server builds electronics graph connections/nets, actual numbered code, board pin capabilities and deterministic diagnostics, without canvas coordinates or viewport. For active challenges it can run the existing bounded evaluator read-only, and compare the fingerprint with the user's latest owned attempt. It never records completion. Missing cloud progress is explicitly unavailable.

Browser output/Serial/runtime diagnostics are labeled client observations, not verified proof. Current runtime does not expose every MCU pin state, so Cirra does not invent them. General Tutor questions omit the project. Assistant gets the actual catalog including partial/visual-only support.

Project input limits: 40 components, 200 wires, 3000 pins, 180 KB request body. Code is bounded to 8000 characters, Serial to the last 1600; oversized context shrinks with explicit truncation markers or rejects safely. Context defaults to 24000 characters, output 1800 tokens, question 2000 characters. History sent is at most six messages of 1000 characters each. These are operational safety limits, not pricing quotas.

Credential-like text is redacted throughout context/history/question and response text. This is best-effort redaction, not a guarantee for arbitrary secret formats. The UI explicitly warns that relevant code/context is sent to Gemini and to omit secrets. Prompt hierarchy labels user code/comments/Serial/history as untrusted data. Provider JSON is validated, references must belong to supplied context, and UI renders escaped text. No HTML execution, tools, or autonomous actions are supported. Injection defenses and persona checks reduce risk but cannot guarantee every AI statement is correct.

Challenge assistance is hint-first at levels 1–3, with no full solution unlock. Full `setup`/`loop` source and fenced solutions are rejected during active challenges. Assistant offers goal/constraints/components/circuit/program/testing guidance, not automatic project creation or guaranteed hardware safety.

Chat is bounded in-memory session state (12 messages/thread, 10 threads), scoped to account, draft/lesson and mode. It is not persisted to IndexedDB, Supabase or logs. Logout clears the account's chat; workspace auth broadcasts clear tabs' chat state. Operational logs contain request ID, mode/category, prompt version, status, latency and token count only.

## Shared limits: manual configuration

Apply `supabase/migrations/20261007160000_cirra_usage.sql` through your existing Supabase migration workflow or SQL Editor, after previous auth schema migrations. No remote migration has been applied by this implementation.

Add `SUPABASE_SECRET_KEY` only to server environment (the existing trusted-writer convention), alongside Gemini configuration. Never expose it as `NEXT_PUBLIC_*`, commit it, or paste it into chat. The key is used solely for server usage reservation/finalization after authenticating the caller. Normal project/progress reads use the user's RLS session.

`ai_usage` stores only operational metadata, no prompts/code/answers. RLS permits authenticated own reads; clients have no writes or reserve/finalize RPC access. Trusted RPCs atomically reserve per-user minute/day/concurrent slots, count provider failures and reject repeated request IDs. Abandoned leases expire. Finish failures are logged without sensitive details and do not discard a valid answer. Technical ceilings are server environment configuration. No Free/Premium entitlement system is implemented.

Production defaults to database limits and fails closed if the migration/credential is missing. Local development defaults to process memory. For a private local production preview only, explicitly set `CIRRA_LIMIT_STORE=memory` and `CIRRA_LOCAL_PREVIEW=1`; never set this override on a public deployment. Memory limits do not coordinate server instances and reset on process restart.

Usage retention: periodically remove operational rows older than 30 days via an administrator workflow; never purge the last 24 hours used for limiting. No scheduled cleanup job is installed in this milestone. Remote migration, RLS isolation and trusted RPC permissions still require verification against two distinct authenticated user contexts. Do not use a privileged client to claim RLS isolation.

## Verification

Normal `pnpm test` uses provider mocks and PGlite authenticated RLS contexts. Playwright starts a production server with a test-process-only Gemini/Supabase transport to loopback fixtures; production app code never imports the transport. Fixture keys are not cloud credentials.

Opt-in live smoke: set `CIRRA_LIVE_SMOKE=1` for `pnpm test features/ai/live.test.ts`. It loads `.env.local` and calls Tutor FAST, Debugger SMART, Assistant blueprint and three additional Debugger golden fixtures. It validates schema/persona/references and prints metadata only. Normal tests skip these live calls. Network/provider latency may require a higher configured timeout (up to 60000 ms). Live provider validation is separate from authenticated app/remote Supabase validation.

Deferred: AI chat persistence, streaming UI, plan quotas/payment, AI-controlled edits, real hardware execution, voice/avatar, and autonomous agents.
