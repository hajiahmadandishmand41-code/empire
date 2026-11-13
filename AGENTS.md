# Empire — Agent Instructions

Empire is a Spree Commerce 6.0.4 multi-vendor e-commerce platform. This file guides coding agents working on the repository. `server/AGENTS.md` covers Rails/Spree-CLI specifics.

## Repository layout

| Directory | Purpose |
|-----------|---------|
| `server/` | Spree API backend (Rails) + Empire domain. See `server/AGENTS.md`. |
| `storefront/` | Next.js + TypeScript customer storefront and Empire staff pages. |
| `apps/dashboard`, `apps/seller-dashboard` | Spree React admin/seller starters (pnpm per app). |
| `extensions/` | Documentation only (`extensions/README.md`); no forked gems. |
| `docs/` | Product documentation; `docs/api/spree-6.0.4/` vendored OpenAPI specs. |
| `scripts/` | `audit-static.mjs` gate, env bootstrap, CI helpers. |
| `.github/workflows/` | Backend, Frontend, E2E CI. |

## The Spree core must NOT be forked

Spree is an exact-pinned dependency (`= 6.0.4` in **both** `server/Gemfile` and `server/Gemfile.lock`; the static audit checks they agree). Implement Empire features as:

- Migrations in `server/db/migrate/` (`empire_*` / `spree_*`)
- Models/services in `server/app/{models,services}/empire/`
- Controllers in `server/app/controllers/api/v3/{store,seller,admin}/empire/`
- Routes inside `Spree::Core::Engine.add_routes` in `server/config/routes.rb`
- Initializers in `server/config/initializers/` (register payment methods in `after_initialize`, not `to_prepare`)
- Locales in `server/config/locales/` (generated from storefront JSON via `node scripts/audit-static.mjs --write`)
- Storefront pages/components in `storefront/src/`

Do not edit Spree gem source. Prefer native Spree capabilities (sellers, commissions, companies, catalogs, price lists) over duplicating them in Empire tables.

## Environment & toolchain

- Backend runs via Docker Compose / Spree CLI. Ruby, Rails, PostgreSQL are **not** required on the host.
- Frontend: Node.js 20+ and npm. Dashboards: `cd apps/<app>` then `corepack pnpm …` (pnpm 11.13.1 per app; running pnpm from the repo root resolves the wrong version).
- The agent sandbox has **no Ruby/PostgreSQL/Docker**: backend/E2E evidence must come from GitHub Actions. Never report a backend test as passing without CI proof.

Never commit secrets. Use `.env.example`, `npm run env:bootstrap`, and secret managers.

## Adding features

1. Migration: `npx spree generate migration <name>` (in container) or add `server/db/migrate/…`.
2. Model/service/controller under `empire/`; route in `config/routes.rb`.
3. Locale strings: edit `storefront/src/locales/{en,fa-AF}.json`, then `node scripts/audit-static.mjs --write`.
4. Storefront UI under `storefront/src/app/…`.
5. Tests: RSpec (`server/spec/`), Playwright (`storefront/e2e/`), dashboard contract tests.
6. Run `node scripts/audit-static.mjs`; run frontend `npm test`/`npm run build`; push to trigger CI.
7. Update `docs/` and classify the feature (Spree-native / Empire-custom / planned-blocked).

## Mandatory documentation & honesty

Every user-facing capability must be recorded in `docs/` and classified. Do not claim a feature is implemented or tested unless the code exists and a test actually ran. Keep `docs/KNOWN-LIMITATIONS.md` truthful (e.g. bank transfer, disputes, Pashto are not complete). Record execution evidence in `docs/TESTING.md` / the audit report.

## Testing policy

No feature is "complete" without model/migration, validation, access control, API endpoint, UI (where applicable), automated test, and documentation. Tests must actually run — local absence is NOT RUN/BLOCKED, not PASS.
