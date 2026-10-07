import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: { baseURL: "http://localhost:3002", channel: "msedge" },
  workers: 1,
  webServer: {
    command: "npm run start -- -p 3002",
    url: "http://localhost:3002",
    reuseExistingServer: false,
    timeout: 60000,
  },
});

