import { defineConfig } from "vitest/config";
import { resolve } from "node:path";
export default defineConfig({ resolve: { alias: { "@": resolve(process.cwd()), "server-only": resolve("node_modules/next/dist/compiled/server-only/empty.js") } }, test: { include: ["features/**/*.test.ts", "tests/unit/**/*.test.ts"] } });
