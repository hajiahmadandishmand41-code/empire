# Empire

Empire is a multi-vendor e-commerce platform built on **Spree Commerce 6.0.4** (official gems, exact-pinned; Spree is not forked). It targets B2B, B2C, marketplace, wholesale and retail trade with **Afghanistan** as the primary market (Dari/English, AFN, COD, 34 provinces), and an architecture ready for international expansion.

> **Status:** Active development. No production deployment has been performed and no production services were created or modified. See `docs/KNOWN-LIMITATIONS.md` and `docs/TESTING.md` for what is implemented vs. verified.

## Repository layout

| Directory | Description | Technology |
|-----------|-------------|------------|
| `server/` | Spree API backend + Empire domain (RFQ, quotes, payout review, COD, geography) | Ruby 4.0.9, Rails ~> 8.1.2, Spree = 6.0.4, PostgreSQL 18 |
| `storefront/` | Customer storefront + Empire staff pages (payout review, RFQ) | Next.js 16.4.6, React 19.3, TypeScript, Tailwind 4 |
| `apps/dashboard`, `apps/seller-dashboard` | Spree 6.0.4 React admin/seller starters (built + contract-tested in CI) | Vite, React, TypeScript, Biome, Vitest |
| `docs/` | Architecture, feature matrix, marketplace, B2B, payments, shipping, localization, security, testing, deployment, limitations | Markdown |
| `docs/api/spree-6.0.4/` | Vendored official Store/Admin/Seller OpenAPI specs + source commit | YAML |
| `scripts/` | Static audit gate, env bootstrap, CI helpers, runtime verification | Node / Bash |
| `docker-compose.dev.yml` / `docker-compose.yml` | Dev stack (demo seed, Mailpit) / production-image stack (no demo) | Docker Compose |
| `.github/workflows/` | Backend, Frontend and E2E CI | GitHub Actions |

## Stack

| Component | Version / source |
|-----------|------------------|
| Spree | `= 6.0.4` (official gems; pinned in `Gemfile` **and** `Gemfile.lock`) |
| Ruby | `4.0.9` (`.ruby-version`) |
| Rails | `~> 8.1.2` |
| Storefront | Next.js 16.4.6 + React 19.3 + TypeScript + Tailwind 4 |
| Database | PostgreSQL 18 |
| Jobs / cache / cable | Solid Queue / Solid Cache / Solid Cable (PostgreSQL-backed; no Redis required) |
| Spree CLI | `@spree/cli` 3.7.0 (wraps Docker Compose for humans) |

## Quick start (development, requires Docker)

```bash
git clone https://github.com/hajiahmadandishmand41-code/empire.git
cd empire
npm ci
npm run env:bootstrap                       # creates .env with random local secrets
docker compose -f docker-compose.dev.yml up -d --build
```

- Backend: http://localhost:3000 (Admin dashboard at `/dashboard`, seller panel at `/sellers`, jobs at `/jobs`)
- Storefront: http://localhost:3001
- Mailpit: http://localhost:8025
- Demo accounts are enabled only in the dev stack; read the generated `ADMIN_PASSWORD` in `.env`. Demo seller/buyer credentials are in `.env.example` (dev only).

The Spree CLI equivalents (`npx spree dev`, `npx spree seed`, `npx spree rspec`, …) wrap the same compose files. See `server/AGENTS.md` for the CLI command table.

## Key capabilities

- **Marketplace (native Spree):** sellers, approval, commission rates, multi-vendor order splitting, seller transfers/payouts. Empire adds a public seller-application endpoint and a payout **review** gate.
- **B2B / wholesale (native Spree + Empire RFQ):** companies, memberships, catalogs, price lists, volume tiers, MOQ, PO numbers; Empire RFQ → seller quote → buyer accept.
- **Afghanistan localization:** Dari (`fa-AF` UI / `fa` content) + English, RTL/LTR, AFN formatting, 34 provinces + districts, COD. Pashto is a **draft stub**, not offered.
- **Payments:** COD (manual capture). Stripe gem present but **not enabled**; bank-transfer receipt and local PSP are **not implemented**.
- **Shipping:** native Spree methods/zones/rates/fulfillments; no carrier API. Disputes workflow **not implemented**.

## Testing

```bash
node scripts/audit-static.mjs               # static gate (no Ruby/Docker needed)
cd storefront && npm ci && npm test && npm run build
npm run test:e2e                            # Playwright (needs the Docker stack running)
```

Backend RSpec, Brakeman and bundle-audit run in GitHub Actions (the agent sandbox has no Ruby/PostgreSQL/Docker). See `docs/TESTING.md` for the full matrix and `docs/AUDIT-REPORT.md` for the latest execution evidence.

## Environment & secrets

See `.env.example`. `npm run env:bootstrap` generates random local secrets and refuses to overwrite an existing `.env`. Production injects real secrets from a secret manager; the backend fails closed in production if required secrets are missing/short. Never commit `.env` or credentials.

## Documentation

Start with `docs/ARCHITECTURE.md` and `docs/FEATURE-MATRIX.md`. Every capability is classified as Spree-native, Empire-custom, or planned/blocked. `docs/KNOWN-LIMITATIONS.md` lists what is absent or unproven.
