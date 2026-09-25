import path from "node:path";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest(async () => {
      const migrationsPath = path.join(import.meta.dirname, "migrations");
      const migrations = await readD1Migrations(migrationsPath);

      return {
        wrangler: { configPath: "./wrangler.jsonc" },
        miniflare: {
          bindings: {
            TEST_MIGRATIONS: migrations,
            // Tests request https://hardwareclub.org, where the Worker refuses
            // Cloudflare's Turnstile test keys (src/turnstile.ts), so use
            // production-shaped placeholders instead of the .dev.vars ones.
            TURNSTILE_SITEKEY: "test-suite-sitekey",
            TURNSTILE_SECRET: "test-suite-secret",
          },
        },
      };
    }),
  ],
  test: {
    setupFiles: ["./test/apply-migrations.ts"],
  },
});
