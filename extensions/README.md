# Empire Extensions

Empire-specific functionality built **on top of** Spree core (kept as a versioned gem). Extensions are implemented as Rails migrations, models, initializers, locale files and API controllers inside `server/` — not as separate forked gems, so Spree remains upgradable.

## Extension areas

| Area | What it adds | Where |
|------|-------------|-------|
| Afghanistan localization | Provinces (34), districts, Dari/Pashto/English names, AFN, +93 phones | `server/db/migrate/*provinces*`, `server/app/models/empire/`, `server/config/locales/{fa-AF,ps-AF}.yml` |
| Marketplace | Seller profiles, verification, shop, commission, order split, payouts | `empire_sellers`, `empire_commissions`, `empire_payouts`, `empire_order_splits` |
| B2B / Wholesale | Companies, company users/roles, PO numbers, volume pricing, MOQ | `empire_companies`, `empire_company_users`, `empire_volume_pricing`, `spree_variants.moq` |
| RFQ / quotes | Request for quote, seller quotes, accept/reject | `empire_rfqs`, `empire_quotes` |
| Local payments | Bank transfer + receipt, COD | `empire_bank_transfers` |
| Disputes | Buyer–seller disputes | `empire_disputes` |

## Adding a new Empire feature

1. Create a migration in `server/db/migrate/` named `2026..._create_empire_<feature>.spree.rb` (or `add_...`).
2. Create a model in `server/app/models/empire/<feature>.rb`.
3. Add API controller(s) under `server/app/controllers/api/v3/store/empire/` or `api/v3/admin/empire/`.
4. Add routes in `server/config/routes.rb` inside `Spree::Core::Engine.add_routes`.
5. Add locale strings to `server/config/locales/{en,fa-AF,ps-AF}.yml`.
6. Add storefront UI under `storefront/src/app/...`.
7. Add tests, docs entry, and seed data (tagged Demo).

Do not modify Spree gem source. Do not fork Spree.
