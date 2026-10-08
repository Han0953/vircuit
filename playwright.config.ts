import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: { baseURL: "http://localhost:3002", channel: "msedge" },
  workers: 1,
  webServer: [
    { command: "node tests/fixtures/supabase-server.mjs", url: "http://127.0.0.1:3031/__fixture/state", reuseExistingServer: false },
    {
      command: "node --import ./tests/fixtures/supabase-network.mjs node_modules/next/dist/bin/next start -p 3002",
      env: { SUPABASE_SECRET_KEY: "sb_secret_local_playwright_fixture", GEMINI_API_KEY: "local-playwright-fixture", CIRRA_MODEL_FAST: "gemini-3.1-flash-lite", CIRRA_MODEL_SMART: "gemini-3.5-flash-lite", CIRRA_LIMIT_STORE: "memory", CIRRA_LOCAL_PREVIEW: "1", CIRRA_REQUESTS_PER_MINUTE: "60", CIRRA_REQUESTS_PER_DAY: "1000" },
      url: "http://localhost:3002",
      reuseExistingServer: false,
      timeout: 60000,
    },
  ],
});

