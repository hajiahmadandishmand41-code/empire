# Testing

Empire requires real automated tests. A test is only reported as passing when it actually executed (locally or in GitHub Actions). The latest PASS/FAIL/NOT RUN/BLOCKED evidence is recorded in `docs/AUDIT-REPORT.md` and the PR comment.

## Static audit (local, no Ruby/Docker needed)

```bash
node scripts/audit-static.mjs          # gate
node scripts/audit-static.mjs --write  # regenerate server en/fa-AF YAML from storefront JSON
```

Checks: storefront locale key parity (140 keys), Dari script / no stray Latin, Pashto draft marker, backend `empire.*` key coverage, YAML parse + unique keys (locales and all workflows), compose build source (`server/Dockerfile`), API contract vs vendored Spree specs (37 core + 14 Empire operations), and exact `= 6.0.4` pins in both `Gemfile` and `Gemfile.lock`.

## Backend (RSpec) — CI / Docker only

Sandbox has no Ruby/PostgreSQL/Docker, so backend specs are **NOT RUN locally**. They run in `.github/workflows/backend-ci.yml` on Ubuntu with PostgreSQL 18 and Ruby 4.0.9:

1. `bundle install` (frozen; Gemfile and lock must agree on `= 6.0.4`)
2. `bin/rails db:create db:migrate` + migration status
3. `bin/rails db:seed` twice (idempotence)
4. Runtime boot / Empire extension proof (`scripts/verify-runtime.mjs`)
5. `bundle exec rspec`
6. `brakeman` (warnings fail) and `bundle-audit` (advisories fail)

Spec areas: `spec/models/empire/*` (COD, seeds), `spec/services/empire/*` (accept quote, review payout), `spec/requests/empire/security_spec.rb` (auth, seller isolation, company scoping, payout review), plus Spree's agent-tools contract spec.

Run with Docker locally: `npx spree rspec` (or `docker compose -f docker-compose.dev.yml exec web bundle exec rspec`).

## Frontend (storefront)

```bash
cd storefront
npm ci
npm run lint        # eslint
npx tsc --noEmit    # typecheck
npm run build       # next build (standalone)
npm test            # lint + tsc
```

These run locally and in `frontend-ci.yml` (`storefront` job).

## Dashboards

`apps/dashboard` and `apps/seller-dashboard` (pnpm 11.13.1 per app):

```bash
cd apps/<app>
corepack pnpm install --frozen-lockfile
corepack pnpm typecheck && corepack pnpm lint && corepack pnpm test && VITE_BASE_PATH=/<base>/ corepack pnpm build
```

`frontend-ci.yml` runs a `dashboards` matrix (typecheck, lint, vitest contract tests, build). Run dashboard `tsc` alone if memory-constrained (it is heavy).

## End-to-End (Playwright) — CI Docker stack

`storefront/playwright.config.ts` + `storefront/e2e/`:

- `storefront.spec.ts`: home, product detail, cart qty/remove, login, full COD checkout (6 browser tests).
- `marketplace-journey.spec.ts`: live API journey — seller application → staff approval → seller product → staff publish → buyer COD checkout → staff capture/fulfil → seller balance → payout request → staff approve/complete → B2B company/catalog/tiered price/MOQ/PO → RFQ → quote → accept.

`.github/workflows/e2e-ci.yml` has two jobs:
- `browser`: builds `docker-compose.dev.yml`, waits for backend/storefront, runs `scripts/verify-runtime.mjs`, installs Chromium, runs Playwright.
- `production-image`: builds `docker-compose.yml`, smoke-tests HTTP + runtime, asserts COD/geography exist and demo data did **not** leak.

Both capture `migrate.log` and surface failure details via `scripts/annotate-log.mjs`; artifacts include compose logs and Playwright reports.

Run locally with Docker: `npm run test:e2e` (expects backend on `API_BASE_URL` and storefront on `E2E_BASE_URL`).

## Test data

`server/db/seeds/empire_seed.rb`: 34 provinces + districts, COD, publishable key, and **opt-in** demo seller/product/company/RFQ (`EMPIRE_SEED_DEMO=true`, dev/CI only). Demo identities are dev-only (`admin@empire.test`, `demo.seller@empire.test`, `demo.buyer@empire.test`); production never seeds them. The first admin is created from `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars.
