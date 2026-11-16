# Empire Extensions

Empire-specific functionality is built **on top of** Spree 6.0.4 (kept as an exact-pinned gem). It lives in the host Rails app (`server/`) as migrations, models, services, initializers, locale files and API controllers — **not** as separate forked gems — so Spree remains upgradable. This directory is documentation only.

## What Empire actually adds (non-core)

| Area | What it adds | Where |
|------|-------------|-------|
| Afghanistan geography | 34 provinces + districts (Dari/English) | `server/db/migrate/*empire_provinces*`, `*empire_districts*`, `server/app/models/empire/{province,district}.rb` |
| RFQ / quotes | Request for quote, seller quotes, buyer accept | `empire_rfqs`, `empire_quotes`, `Empire::AcceptQuote` |
| Payout review | Review gate before native Spree payout sweep | `empire_payout_requests`, `Empire::ReviewPayoutRequest` |
| Cash on delivery | Manual-capture offline payment method | `Empire::CashOnDelivery < Spree::PaymentMethod::Check` |
| Seller application | Public endpoint creating a pending native seller | `api/v3/store/empire/seller_applications` |
| Localization | Dari/English messages, RTL, AFN | `server/config/locales/`, `storefront/src/locales/`, `storefront/src/lib/` |

Marketplace sellers/commissions/order-splitting/payouts and B2B companies/catalogs/price-lists/MOQ/PO are **native Spree 6.0.4**, not Empire tables. Bank transfer, disputes, and full Pashto are **not implemented** (see `docs/KNOWN-LIMITATIONS.md`).

## Adding a new Empire feature

1. Migration in `server/db/migrate/` named `…_create_empire_<feature>.rb`.
2. Model/service in `server/app/{models,services}/empire/<feature>.rb`.
3. Controller under `server/app/controllers/api/v3/{store,seller,admin}/empire/`.
4. Route in `server/config/routes.rb` inside `Spree::Core::Engine.add_routes`.
5. Locale strings in `storefront/src/locales/{en,fa-AF}.json`, then `node scripts/audit-static.mjs --write`.
6. Storefront UI under `storefront/src/app/…`.
7. Tests, docs entry (classified), and opt-in demo seed if appropriate.

Do not modify or fork Spree gem source.
