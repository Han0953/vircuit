// Test-process-only transport. Production application code never imports this module.
import { loadEnvFile } from "node:process";
try { loadEnvFile(".env.local"); } catch { /* CI may supply environment directly. */ }
const provider = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin;
const original = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = new URL(input instanceof Request ? input.url : input);
  if (url.hostname === "generativelanguage.googleapis.com") return original("http://127.0.0.1:3031/__fixture/gemini", init);
  if (url.origin !== provider) return original(input, init);
  const target = `http://127.0.0.1:3031${url.pathname}${url.search}`;
  return original(input instanceof Request ? new Request(target, input) : target, init);
};
