# Empire

Empire is a real, multi-vendor e-commerce platform built on **Spree Commerce** (the official open-source e-commerce framework for Ruby on Rails). It supports B2B, B2C, marketplace, wholesale, retail, and cross-border trade, with deep localization for **Afghanistan** as the primary market and an architecture ready for international expansion.

> **Status:** Active development. Backend and storefront are scaffolded from the official Spree tooling; production deployment has not been performed (no production services were created or modified).

## What is in this repository

| Directory | Description | Technology |
|-----------|-------------|------------|
| `server/` | Spree API backend (Rails) — Store API v3, Admin API, background jobs, emails | Ruby 4.0.9, Rails ~> 8.1.2, Spree ~> 6.0, PostgreSQL |
| `storefront/` | Customer-facing Next.js storefront (TypeScript, Tailwind) | Next.js 16, React 19, TypeScript |
| `extensions/` | Empire-specific extensions (RFQ, Afghanistan localization, B2B, local payments/shipping) | Rails engines + concerns |
| `docs/` | Architecture, feature matrix, localization, B2B workflows, payments, shipping, security, testing, deployment, known limitations | Markdown |
| `docker-compose.yml` / `docker-compose.dev.yml` | Development stack: Rails API, PostgreSQL, Redis (Solid stack), Mailpit | Docker Compose |

## Officially-supported stack

Empire is built from the official [create-spree-app](https://www.npmjs.com/package/create-spree-app) CLI (`@spree/cli`) and the official Spree gems. The Spree core is kept as a versioned, upgradable dependency — Empire-specific features are added through Rails extensions, initializers, locale files, and database migrations, **not** by forking Spree.

| Component | Version / Source |
|-----------|------------------|
| Spree core | `~> 6.0` (official gems from rubygems.org) |
| Ruby | `4.0.9` (`.ruby-version`) |
| Rails | `~> 8.1.2` |
| Spree CLI | `@spree/cli ^3.4.0` (npm) |
| Storefront | Next.js 16 + TypeScript + Tailwind |
| Database | PostgreSQL 18 |
| Cache / Queue / Cable | Solid Cache, Solid Queue, Solid Cable (PostgreSQL-backed) |

## Quick start (development)

Empire runs through Docker Compose. You need **Docker** installed and running. Ruby is **not** required on the host — all Rails commands run inside the container via the Spree CLI.

```bash
# 1. Clone the repo
git clone https://github.com/hajiahmadandishmand41-code/empire.git
cd empire

# 2. Copy the environment example and adjust as needed
cp .env.example .env
# Edit .env (set SECRET_KEY_BASE, encryption keys, hosts)

# 3. Start the stack (backend + PostgreSQL + Mailpit)
docker compose up -d

# 4. First run: prepare the database and seed
npx spree db:prepare
npx spree seed

# 5. Open the Admin Dashboard
# http://localhost:3000/dashboard

# 6. Storefront (separate process)
cd storefront
npm install
npm run dev        # http://localhost:3001 (configure NEXT_PUBLIC_API_URL)
```

## Environment variables

See `.env.example` for the full list. Sensitive values (`SECRET_KEY_BASE`, Active Record encryption keys, database credentials, API keys) must come from environment variables or a secret manager — **never commit them to Git**.

## Key capabilities

- **Multi-vendor marketplace:** seller registration, shop profiles, verification/suspension, per-seller commission, multi-vendor order splitting, commission & settlement reports, payout requests.
- **B2B / wholesale:** company accounts, branches, multiple buyers per company, buyer/company admin/approver roles, company price lists, volume/quantity tiered pricing, minimum order quantity (MOQ), purchase order (PO) numbers, draft orders, approval workflows, RFQ (request for quote) with seller quotes and negotiation.
- **Afghanistan localization:** Dari (fa-AF), Pashto (ps-AF), and English (en); real RTL/LTR layout; AFN currency with correct formatting; +93 phone validation; all 34 provinces and districts; COD and bank-transfer-with-receipt payment methods.
- **Payments:** COD, bank transfer with receipt upload and admin verification, Stripe/Stripe Connect adapter (disabled until a real gateway connection and legal review are in place), idempotent callbacks/webhooks.
- **Shipping:** city and inter-city delivery, region/weight-based rates, carriers, tracking numbers, delivery confirmation, return claims.
- **SEO:** dynamic metadata, canonical URLs, hreflang, sitemap.xml, robots.txt, Open Graph, Schema.org.

## Testing

Because this environment has no Ruby, PostgreSQL, or Docker, backend tests (RSpec) cannot be executed here. The test suite is configured and ready to run in CI or on any machine with Ruby/PostgreSQL/Docker:

```bash
npx spree rspec        # backend specs (requires Docker + Ruby)
cd storefront && npm run lint   # frontend lint
cd storefront && npm run build  # frontend production build
```

See `docs/TESTING.md` and `docs/DEPLOYMENT.md` for CI, deployment, backup, and secrets management.

## Documentation

- `docs/ARCHITECTURE.md` — system architecture and data flow
- `docs/FEATURE-MATRIX.md` — Spree-ready vs Empire-custom vs planned features
- `docs/AFGHANISTAN-LOCALIZATION.md` — Dari/Pashto/English, AFN, provinces/districts
- `docs/MARKETPLACE.md` — multi-vendor marketplace features
- `docs/B2B-WORKFLOWS.md` — companies, price lists, MOQ, RFQ, draft orders
- `docs/PAYMENTS.md` — payment methods, security, idempotency
- `docs/SHIPPING.md` — shipping methods, rates, carriers, tracking
- `docs/SECURITY.md` — access control, audit log, secrets
- `docs/TESTING.md` — how to run backend, frontend, and E2E tests
- `docs/DEPLOYMENT.md` — Railway/Docker backend, Vercel/Next.js storefront
- `docs/KNOWN-LIMITATIONS.md` — what is not yet implemented or tested

## License

MIT
