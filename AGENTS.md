# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Add durable project-specific notes here as they are discovered through real work.

## Stack notes

- `@cloudflare/vitest-pool-workers@0.22.0` requires `vitest@^4.1.0` as a peer — do not upgrade to vitest 5.x, it will fail `npm install` with an ERESOLVE conflict.
- `vitest.config.ts` uses the `cloudflareTest()` plugin (from `@cloudflare/vitest-pool-workers` itself, not a separate `@cloudflare/vitest-plugin` package) plus `readD1Migrations()`/`applyD1Migrations()` to seed the D1 schema in `test/apply-migrations.ts` before each test file runs.
- The workerd binary bundled with the installed `@cloudflare/vitest-pool-workers` lags behind the top-level `wrangler`'s bundled workerd. If `npm test` fails with "newest date supported by this server binary is X", bump `compatibility_date` in `wrangler.jsonc` down to that date (and rerun `npx wrangler types`), not up.
- Tests stub outbound calls (Turnstile verification, email sending) by mutating exported singleton objects (`turnstile` in `src/turnstile.ts`, `notifier` in `src/email.ts`) rather than mocking `fetch`. This works because `SELF.fetch()` from `cloudflare:test` runs in the same isolate as the test file. Reset these in `beforeEach`.
- After any change to `wrangler.jsonc` bindings, rerun `npx wrangler types` to regenerate `worker-configuration.d.ts` (committed, not gitignored).
- The Worker treats host `hardwareclub.org` as production (`src/site.ts`): it 301s `http://` to https and refuses Cloudflare's Turnstile test keys there. So `wrangler.jsonc` sets `dev.host: "localhost"` (wrangler dev would otherwise rewrite requests to the route host) and `vitest.config.ts` overrides the Turnstile bindings with non-test placeholders.
- Static assets use clean URLs (default `html_handling: "auto-trailing-slash"`): link to `/privacy`, not `/privacy.html`.
- `public/fonts/*.woff2` are single self-hosted variable-font files (Inter, Manrope) covering all weights used on the site; `scripts/build-og.mjs` and `scripts/build-favicon-ico.mjs` (manual, not wired into `npm run build`) load them via `@resvg/resvg-js`'s `fontBuffers` option — `fontFiles` did not render woff2 correctly in testing, `fontBuffers` does.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
