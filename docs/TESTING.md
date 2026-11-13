# Testing

Empire requires real automated tests — no feature is complete without model, API, authorization and (where applicable) storefront test coverage, and tests must actually execute.

## Backend (RSpec)

The backend test suite lives in `server/spec/` and uses RSpec + Factory Bot + Spree Dev Tools.

**To run (requires Ruby, PostgreSQL, Docker — not available in this sandbox):**

```bash
cd server
# via the Spree CLI (Docker):
npx spree rspec
# or directly in the container:
docker compose exec web bin/rails db:prepare
docker compose exec web bundle exec rspec
```

**CI:** `.github/workflows/backend-ci.yml` runs on Ubuntu with:
- PostgreSQL 18 service container
- `ruby/setup-ruby` (Ruby 4.0.9)
- `bundler-cache`
- `bin/rails db:prepare`
- `bundle exec rspec`
- `brakeman` security scan
- `bundle-audit` dependency scan

**Backend test areas:**
- Models & associations (Spree core + Empire extensions)
- API endpoints (Store API v3 + Empire API)
- Permissions / authorization (seller isolation, company scoping, admin)
- Marketplace: seller registration, verification, order split, commission
- B2B: company, price list, volume pricing, MOQ, draft order, RFQ, quote
- Payments: COD, bank transfer + receipt, idempotency
- Afghanistan: provinces/districts, address validation

## Frontend (Next.js)

**Lint:**
```bash
cd storefront
npm run lint
```

**Build (production):**
```bash
cd storefront
npm run build
```

**TypeScript:** `tsc --noEmit` runs as part of `next build`.

**Frontend test areas:**
- Home, product, cart, checkout pages render
- API client connects to Spree Store API
- RTL/LTR layout switching
- Mobile responsiveness

A frontend test runner (Vitest/Jest + Playwright) is **planned** — not yet configured (see KNOWN-LIMITATIONS).

## End-to-End

E2E covers the full buyer → seller → admin lifecycle:

1. Admin verifies a seller.
2. Seller registers a product.
3. Admin publishes the product.
4. Buyer finds the product.
5. Buyer adds to cart.
6. Buyer places the order.
7. Buyer chooses COD or bank transfer.
8. Order appears in the seller dashboard.
9. System calculates the seller commission.
10. Admin reviews and settles the seller payout.

**B2B E2E:**
1. Company registers.
2. Company admin invites a buyer.
3. Catalog + company-specific price assigned.
4. Buyer sees volume pricing.
5. Buyer sends an RFQ.
6. Seller sends a quote.
7. Company accepts the quote.
8. Commercial order is created.

**Status:** E2E test tooling (Playwright/Cypress) is **not yet installed**. The workflows are documented here and in `docs/ARCHITECTURE.md`; implement in CI when the runner supports a full browser stack.

## Test data

Seed data (`server/db/seeds/empire_seed.rb`) is tagged "Demo" and must not be confused with production data. No default admin account with a fixed insecure password is created; the admin account is created through a secure, documented process using environment variables.

## Gaps

- Backend specs cannot run in this sandbox (no Ruby/PostgreSQL/Docker).
- Frontend unit/integration tests not yet configured.
- E2E tests not yet implemented.
See `docs/KNOWN-LIMITATIONS.md`.
