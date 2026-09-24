# Hardware Club

Source for hardwareclub.org: give old tech a second life. Metro Detroit.

A static site (`public/`) served by a Cloudflare Worker (`src/`) with Workers
Static Assets. The Worker runs first for every request (`run_worker_first` in
`wrangler.jsonc`): it injects the Turnstile site key into `/`, redirects `www`
to the apex, handles `POST /api/submit` (validates a donation offer, stores it
in D1, and emails the maintainer), and sets the security headers from
`src/security.ts` on every response, static assets included. There is no
`public/_headers` file.

## Local development

```sh
npm install
npx wrangler d1 migrations apply hardwareclub-submissions --local
npm run dev
```

`npm run dev` runs `wrangler dev`, which serves the site and the Worker
locally (including a local D1 database and simulated email sending). It uses
the public Cloudflare Turnstile test keys committed in `.dev.vars`, so forms
submitted locally will verify successfully without any real Turnstile setup.

## Tests and checks

```sh
npm test    # vitest, running against a real Workers runtime (miniflare)
npm run check   # typecheck + html-validate + internal link check
npm run build   # regenerates public/og.png from an SVG (fast, no bundling)
```

## Deployment

Deployment is handled by Cloudflare Workers Builds, connected to this repo in
the Cloudflare dashboard. On merge to `main` it runs `npm run build` then
`npx wrangler deploy`. There is no GitHub Actions deploy workflow; CI
(`.github/workflows/ci.yml`) only runs `npm ci && npm test && npm run check`
on pull requests.

## One-time production checklist (account owner)

Before the first real deploy is useful in production:

1. Create a Turnstile widget for `hardwareclub.org` in the Cloudflare
   dashboard, then:
   - `npx wrangler secret put TURNSTILE_SECRET` with the real secret key.
   - Update `vars.TURNSTILE_SITEKEY` in `wrangler.jsonc` to the real site key.
2. Enable Email Routing on the `hardwareclub.org` zone and verify
   `randalwadejr@gmail.com` as a destination address. That address appears
   twice in `wrangler.jsonc` (`vars.NOTIFY_TO`, which the Worker sends to, and
   the `NOTIFY` binding's `destination_address`, which is the only recipient
   the binding allows); change both together.
3. Apply the D1 migration to the remote database:
   `npx wrangler d1 migrations apply hardwareclub-submissions --remote`.
4. Deploy once (`npx wrangler deploy` or a Workers Builds run) — this creates
   the `hardwareclub.org` and `www.hardwareclub.org` custom domains defined
   under `routes` in `wrangler.jsonc`. Those are the only hostnames the Worker
   answers on: `workers_dev` and `preview_urls` are disabled because Turnstile
   only renders on the widget's registered hostname.
5. If the account has Cloudflare Access enabled, make sure the public
   hostname is excluded so visitors aren't asked to authenticate.

## Project layout

- `public/` — static HTML/CSS/JS pages, fonts, and images.
- `src/` — the Worker: routing (`index.ts`), the submission handler
  (`submit.ts`, `body.ts`, `validate.ts`), Turnstile verification
  (`turnstile.ts`), email (`email.ts`), and shared concerns (`html.ts`,
  `security.ts`).
- `migrations/` — D1 schema migrations.
- `test/` — Vitest tests running against the real Workers runtime.
- `scripts/` — `build-og.mjs` (OG image, part of `npm run build`) and
  `check-links.mjs` (part of `npm run check`). `build-favicon-ico.mjs` is a
  manual one-off, not run automatically.
