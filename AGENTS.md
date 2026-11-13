# Empire — Agent Instructions

Empire is a Spree Commerce multi-vendor e-commerce platform. This file guides coding agents working on the repository.

## Repository layout

| Directory | Purpose |
|-----------|---------|
| `server/` | Spree API backend (Rails app). See `server/AGENTS.md` for Rails-specific rules. |
| `storefront/` | Next.js + TypeScript customer storefront. |
| `extensions/` | Empire-specific Rails extensions (RFQ, Afghanistan geo, B2B, local payments/shipping). |
| `docs/` | Mandatory product documentation (see README for the full list). |
| `.github/workflows/` | GitHub Actions CI for backend, frontend, and E2E. |

## The Spree core must NOT be forked

Keep Spree as a versioned dependency (`server/Gemfile`, `~> 6.0`). Implement Empire-specific features as:

- Rails extensions under `extensions/`
- Database migrations in `server/db/migrate/` (named `spree_<feature>` or `empire_<feature>`)
- Locale files under `server/config/locales/` (`en.yml`, `fa-AF.yml`, `ps-AF.yml`)
- Initializers under `server/config/initializers/`
- Storefront pages/components under `storefront/src/`

Do not edit Spree gem source code directly.

## Environment & toolchain

- Backend runs via Docker Compose and the Spree CLI (`@spree/cli`).
- Ruby, Rails, PostgreSQL, Redis are NOT required on the host — they run in containers.
- Frontend runs with Node.js 20+ and npm.

Never commit secrets to Git. Use `.env.example` and environment variables / secret managers.

## Adding features

1. Generate a migration: `npx spree generate migration <name>` (inside container)
2. Generate an API resource: `npx spree generate api_resource <name> <attrs>`
3. Add a gem: `npx spree bundle add <gem>`
4. Add locale strings: edit `server/config/locales/fa-AF.yml`, `ps-AF.yml`, `en.yml`
5. Add storefront pages: `storefront/src/app/...` (Next.js App Router)
6. Run backend tests: `npx spree rspec`
7. Run frontend: `cd storefront && npm run dev` / `npm run build` / `npm run lint`

## Mandatory documentation

Every user-facing capability must be recorded in `docs/` and classified as:

1. Spree-ready (enabled & tested)
2. Empire-custom (implemented & tested)
3. Planned / blocked (not complete)

## Testing policy

No feature is "complete" without: model + migration, validation, access control (Pundit/Ability or Spree roles), API endpoint, storefront or dashboard UI, automated test, and documentation entry. Tests must actually run — do not report a test as passing without executing it.
