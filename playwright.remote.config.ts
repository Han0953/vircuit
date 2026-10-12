import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";

process.loadEnvFile(".env.local");
if (existsSync(".env.test.local")) process.loadEnvFile(".env.test.local");

// Explicit opt-in: never preload the local Supabase fixture for remote evidence.
export default defineConfig({
  testDir: "./tests/remote",
  workers: 1,
  timeout: 180000,
  expect: { timeout: 20000 },
  use: { baseURL: "http://localhost:3003", channel: "msedge", trace: "off", screenshot: "only-on-failure" },
  webServer: {
    command: "node node_modules/next/dist/bin/next start -p 3003",
    url: "http://localhost:3003/masuk",
    reuseExistingServer: true,
    timeout: 60000,
  },
});
