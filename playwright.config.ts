import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: { baseURL: "http://localhost:3002", channel: "msedge" },
  workers: 1,
  webServer: [
    { command: "node tests/fixtures/supabase-server.mjs", url: "http://127.0.0.1:3031/__fixture/state", reuseExistingServer: false },
    {
      command: "node --import ./tests/fixtures/supabase-network.mjs node_modules/next/dist/bin/next start -p 3002",
      url: "http://localhost:3002",
      reuseExistingServer: false,
      timeout: 60000,
    },
  ],
});

