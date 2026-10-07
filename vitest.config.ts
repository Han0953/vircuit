import { defineConfig } from "vitest/config";
export default defineConfig({ test: { include: ["features/**/*.test.ts", "tests/unit/**/*.test.ts"] } });
