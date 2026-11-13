# Empire Architecture

Empire is a multi-vendor e-commerce platform built on **Spree Commerce** (official open-source e-commerce framework for Ruby on Rails). Spree core is kept as a versioned, upgradable gem (`~> 6.0`). Empire-specific features are implemented through Rails migrations, models, initializers, locale files, and API controllers — **not by forking Spree**.

## System overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Storefront (Next.js 16)                     │
│             TypeScript · Tailwind · RTL/LTR · i18n              │
│         http://localhost:3001  (Vercel / Next.js host)          │
└────────────────┬────────────────────────────────────────────────┘
                 │ HTTPS / JSON (Spree Store API v3)
┌────────────────▼────────────────────────────────────────────────┐
│                     Backend (Rails 8 + Spree 6)                 │
│  Store API · Admin API · Seller API · Background jobs · Emails  │
│         http://localhost:3000  (Railway / Docker host)          │
└────────────────┬────────────────────────────────────────────────┘
                 │ PostgreSQL
┌────────────────▼────────────────────────────────────────────────┐
│  PostgreSQL 18  (primary DB: products, orders, users, Empire    │
│  extensions: provinces, districts, sellers, commissions, RFQ…)  │
└─────────────────────────────────────────────────────────────────┘
```

## Components

| Component | Responsibility | Technology |
|-----------|----------------|------------|
| Backend (`server/`) | Spree API (store + admin), background jobs (Solid Queue), caching (Solid Cache), Action Cable (Solid Cable), ActiveStorage | Ruby 4.0.9, Rails 8.1, Spree 6.0, PostgreSQL |
| Storefront (`storefront/`) | Customer UI: products, cart, checkout, account, seller dashboard | Next.js 16, React 19, TypeScript, Tailwind |
| Dashboard (Spree) | Admin dashboard served by backend at `/dashboard` | Spree dashboard gem |
| Seller panel | Marketplace seller dashboard | Spree + Empire extensions |
| Database | All persistent data | PostgreSQL 18 |
| Jobs / Cache / Cable | Background jobs, page caching, WebSocket fallback | Solid Queue / Solid Cache / Solid Cable (all PostgreSQL-backed) |
| Mailpit | Email capture in development | Mailpit container |

## Data flow

1. Customer browses products → Storefront calls `GET /api/v3/store/products` (Spree Store API).
2. Customer adds to cart → `POST /api/v3/store/orders/line_items`.
3. Customer checks out → checkout flow via Spree Store API; payment methods include COD and bank transfer (Empire extensions).
4. Order created in `spree_orders`; Empire splits multi-vendor orders into `empire_order_splits` (one per seller) and creates `empire_commissions`.
5. Seller views own orders/splits via Empire seller API; requests payout → `empire_payouts`.
6. Admin verifies sellers, approves payouts, manages markets via Empire admin API.

## Empire extensions (custom, non-core)

| Extension | Purpose | Location |
|-----------|---------|----------|
| Afghanistan geography | Provinces (34) + districts, localized Dari/Pashto/English | `server/db/migrate/*provinces*`, `server/app/models/empire/province.rb` |
| Marketplace | Seller registration, verification, shop profile | `empire_sellers`, `server/app/models/empire/seller.rb` |
| Commissions & payouts | Per-seller commission, order split, seller payout | `empire_commissions`, `empire_payouts`, `empire_order_splits` |
| RFQ / quotes | Request for quote, seller quotes, negotiation | `empire_rfqs`, `empire_quotes` |
| B2B / companies | Company accounts, buyers, roles, price lists | `empire_companies`, `empire_company_users`, `empire_volume_pricing` |
| Local payments | Bank transfer with receipt, COD | `empire_bank_transfers` |
| Disputes | Buyer–seller disputes | `empire_disputes` |

## Security model

- Role-based access control via Spree roles (`admin`, plus Empire roles).
- Sellers scoped to their own orders, products, commissions, payouts (no cross-seller data leakage).
- Company buyers scoped to their company.
- All sensitive values (SECRET_KEY_BASE, encryption keys, API keys) via environment variables / secret manager — never in Git.
- Active Record encryption for webhook signing keys, gateway customer IDs, OAuth tokens.

## Deployment targets

- Backend + PostgreSQL + Redis: Railway or any Docker-compatible host (`docker-compose.yml`).
- Storefront: Vercel or any Next.js-compatible host.
- CI: GitHub Actions (`backend-ci.yml`, `frontend-ci.yml`).

## Why no local Ruby/PostgreSQL in this sandbox

The execution environment has Node.js/npm but no Ruby, Rails, PostgreSQL, Redis, or Docker, and apt/rubygems.org are unreachable. Therefore backend specs cannot be executed here. CI is configured to run them on GitHub Actions (ruby/setup-ruby + PostgreSQL service). See `docs/KNOWN-LIMITATIONS.md`.
