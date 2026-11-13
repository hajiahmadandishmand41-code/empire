# Empire Architecture

Empire is a multi-vendor e-commerce platform built on **Spree Commerce 6.0.4** (official gems, exact-pinned in `server/Gemfile` and `server/Gemfile.lock`). Spree is **not forked**. Empire-specific behaviour lives in the host Rails app (`server/`) as migrations, models, services, controllers, initializers and locale files, plus a custom Next.js storefront.

## System overview

```
Storefront (Next.js 16, storefront/)          Admin/Seller dashboards (apps/)
  /  /products  /cart  /checkout  /account      /dashboard  /sellers
  /seller  /admin  (Empire staff pages)         (Spree React starters, built by CI)
        │ relative /api/* rewrites                     │ Admin/Seller API v3
        ▼                                              ▼
Backend (Rails 8.1 + Spree 6.0.4, server/)  ──  PostgreSQL 18
  Store API v3  /api/v3/store      (publishable pk_ key, customer JWT, guest cart token)
  Admin API v3  /api/v3/admin      (secret sk_ key or admin JWT)
  Seller API v3 /api/v3/seller     (seller JWT + X-Spree-Seller-Id)
  Empire extensions under /api/v3/{store,seller,admin}/empire/*
  Solid Queue / Solid Cache / Solid Cable (PostgreSQL-backed), ActiveStorage, Mailpit (dev)
```

The storefront never calls `localhost` from the browser. `storefront/next.config.ts` rewrites `/api/*`, `/rails/*`, `/dashboard*`, `/sellers*` to `API_INTERNAL_URL` (server-side only). In Docker Compose that is `http://web:3000`.

## Components

| Component | Responsibility | Technology |
|-----------|----------------|------------|
| `server/` | Spree API backend + Empire domain (RFQ, quotes, payout review, COD, provinces/districts) | Ruby 4.0.9, Rails ~> 8.1.2, Spree = 6.0.4, PostgreSQL 18 |
| `storefront/` | Customer UI + Empire seller/admin staff pages (payout review, RFQ) | Next.js 16.4.6, React 19.3, TypeScript, Tailwind 4 |
| `apps/dashboard`, `apps/seller-dashboard` | Spree 6.0.4 React admin/seller starters, built and contract-tested in CI | Vite, React, TypeScript, Biome, Vitest |
| `extensions/` | Documentation only (`extensions/README.md`); no forked gems | Markdown |
| `docs/api/spree-6.0.4/` | Vendored official Store/Admin/Seller OpenAPI specs + source commit | YAML |
| `docs/api/api-contract.json` | Machine-checked list of core + Empire operations used by Empire | JSON |
| `scripts/audit-static.mjs` | Static gate: locale parity, Dari script, Pashto draft, backend key coverage, YAML/unique keys, compose build source, API contract vs specs, Gemfile/lock pins | Node |
| Docker Compose | `docker-compose.dev.yml` (bind mounts, demo seed, Mailpit) and `docker-compose.yml` (production image, no demo) | Docker |

## Data flow (real Spree 6.0.4 endpoints)

1. Browse: `GET /api/v3/store/products`, `GET /api/v3/store/products/:id?expand=variants,seller`.
2. Cart: `POST /api/v3/store/carts`, then `POST /api/v3/store/carts/:id/items` (variant_id, quantity). Guest carts use `X-Spree-Token`; authenticated carts use customer JWT (`aud: store_api`).
3. Checkout: `PATCH /api/v3/store/carts/:id` (addresses), `PATCH …/fulfillments/:id` (`selected_delivery_rate_id`), `POST …/payments` (`payment_method_id`), `POST …/complete`.
4. Multi-vendor carts complete into a Spree **order group** (one order per seller); single-seller carts complete into one order. Commissions and seller transfers are native Spree marketplace features, not Empire tables.
5. Seller sees only their orders/products/balances via Seller API (`X-Spree-Seller-Id`). Earnings accrue on fulfilment (`SellerTransfers::Create`); commission is recorded at placement (`Commissions::CommissionOrder`).
6. Seller requests payout review (`POST /api/v3/seller/empire/payout_requests`). Staff approves/rejects (`PATCH /api/v3/admin/empire/payout_requests/:id/approve|reject`), which runs Spree's `seller_payout_sweep_workflow`; staff then completes the native payout (`PATCH /api/v3/admin/seller_payouts/:id/complete`).

## Empire-custom domain (non-core)

| Area | Tables / models | Notes |
|------|-----------------|-------|
| Afghanistan geography | `empire_provinces`, `empire_districts` | 34 provinces + districts seeded; Dari/English names |
| RFQ / quotes | `empire_rfqs`, `empire_quotes` | Buyer requests, seller quotes, buyer accepts; scoped to store/company |
| Payout review | `empire_payout_requests` | Review gate in front of native Spree seller payouts; records reviewer + native payout id |
| Cash on delivery | `Empire::CashOnDelivery < Spree::PaymentMethod::Check` | Registered in `after_initialize`; manual capture, never auto-paid |
| Seller application | `POST /api/v3/store/empire/seller_applications` | Creates pending native Spree seller + seller-only team membership; staff approves via native Admin API |

Marketplace sellers, commissions, order splitting, companies, catalogs, price lists, volume pricing, MOQ and PO numbers are **native Spree 6.0.4** capabilities. Empire does not duplicate them in custom tables.

## Security model

- Spree roles/permissions (`server/config/initializers/empire.rb` registers Empire permission scopes). Admin/Seller/Store APIs enforce authentication and scoping server-side.
- Seller API is rooted in `current_seller`; another seller's id is a 404. Company buyers are scoped by native company memberships.
- Secrets (`SECRET_KEY_BASE`, encryption keys, DB password, API keys) come from environment/secret manager. `server/config/initializers/empire_runtime.rb` fails closed in production if required secrets are missing/short.
- Active Record encryption configured for sensitive Spree fields when the three encryption keys are set.

## Deployment targets

- Backend + PostgreSQL: any Docker host (`docker-compose.yml`, `server/Dockerfile`). No Redis required (Solid stack).
- Storefront: any Next.js host or `storefront/Dockerfile` (standalone output).
- CI: GitHub Actions `backend-ci.yml`, `frontend-ci.yml`, `e2e-ci.yml`.

## Local execution constraints

The agent sandbox has Node/npm but **no Ruby, PostgreSQL or Docker**. Backend and E2E evidence therefore comes from GitHub Actions, not local runs. See `docs/TESTING.md` and `docs/KNOWN-LIMITATIONS.md`.
