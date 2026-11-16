# Empire Feature Matrix

Classification used throughout `docs/`:

1. **Spree-native** — capability provided by Spree 6.0.4 and used as-is (no Empire fork).
2. **Empire-custom** — implemented in the host app on top of Spree.
3. **Planned / blocked** — not complete; needs external service, legal review, or further work.

"Implemented" means the code exists in this repository. Execution evidence (which CI jobs actually ran and passed) is recorded separately in `docs/TESTING.md` and the audit report; a feature is only *verified* when the referenced job is green.

## 1. Spree-native (used as-is)

| Category | Feature | Notes |
|----------|---------|-------|
| Catalog | Products, variants, options, taxonomies/taxons, properties, media | Spree core |
| Pricing | Base prices, price lists, volume/quantity tiers | Spree core (`min_quantity`, `price_list_id`) |
| Inventory | Stock locations, stock levels, transfers | Spree core |
| Orders / cart | Carts, items, fulfillments, payments, complete; multi-vendor order groups | Store API v3 |
| Marketplace | Sellers, approval, commission rates, order splitting, seller transfers, payouts | Spree core marketplace |
| B2B | Companies, memberships, catalogs, assignments, quantity rules (MOQ/order multiple), PO numbers | Spree core |
| Payments | Payment-method framework, manual capture, Check/offline base | Spree core |
| Shipping | Shipping methods, zones, delivery rates, fulfillments | Spree core |
| Customers | Registration, JWT auth, addresses, account | Store API v3 |
| APIs | Store / Admin / Seller API v3 | Vendored specs in `docs/api/spree-6.0.4/` |
| Dashboards | Admin + Seller React starters | `apps/dashboard`, `apps/seller-dashboard` |
| Jobs / cache / cable | Solid Queue / Cache / Cable (PostgreSQL) | No Redis required |

## 2. Empire-custom (implemented in host app)

| Category | Feature | Location |
|----------|---------|----------|
| Localization | Dari (`fa-AF` UI, `fa` content) + English; Pashto **draft only** | `server/config/locales/`, `storefront/src/lib/i18n.ts` |
| Localization | RTL/LTR layout, AFN formatting | `storefront/src/app/`, `storefront/src/lib/currency.ts` |
| Afghanistan geo | 34 provinces + districts (Dari/English) | `empire_provinces`, `empire_districts`, `server/db/seeds/empire_seed.rb` |
| Marketplace | Seller application → pending native seller; staff approves via native Admin API | `POST /api/v3/store/empire/seller_applications` |
| Marketplace | Payout **review** gate before native payout sweep | `empire_payout_requests`, `Empire::ReviewPayoutRequest` |
| B2B | RFQ + seller quotes + buyer accept | `empire_rfqs`, `empire_quotes`, `Empire::AcceptQuote` |
| Payments | Cash on Delivery (manual capture, never auto-paid) | `Empire::CashOnDelivery < Spree::PaymentMethod::Check` |
| Staff UI | Admin/seller payout-request pages, staff login | `storefront/src/app/{admin,seller}/payout-requests`, `components/staff-login.tsx` |
| Tooling | Static audit gate (locales, YAML, compose, API contract, gem pins) | `scripts/audit-static.mjs` |
| Tests | RSpec (models/services/security), Playwright (storefront + live marketplace/B2B journey), dashboard contract tests | `server/spec/`, `storefront/e2e/`, `apps/*/src/contract.test.ts` |

## 3. Planned / blocked (not complete)

| Feature | Blocker / needed |
|---------|------------------|
| Pashto (`ps-AF`) full translation | Draft stub only; not offered in the UI |
| Stripe / Stripe Connect live payments | Legal review for target market + live credentials; gem present, not enabled |
| Bank transfer with receipt upload/verification | **Not implemented** (earlier docs were inaccurate) |
| Local PSP adapter | No provider contract/credentials |
| Carrier API (DHL/FedEx/Afghan Post) | No carrier contract; manual Spree rates only |
| Disputes / claims workflow | **Not implemented** (no `empire_disputes` table) |
| Solar Hijri calendar display | Planned |
| District admin correction UI | Planned |
| Meilisearch / S3 / SMTP production | Optional env wiring exists; services not provisioned |
| Production deployment | Not performed |
