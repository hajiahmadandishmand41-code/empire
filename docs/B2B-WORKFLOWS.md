# B2B / Wholesale Workflows

Company accounts, catalogs, price lists, volume pricing, MOQ and PO numbers are **native Spree 6.0.4** features. Empire adds **RFQ / quotes** on top. There are no `empire_companies` / `empire_volume_pricing` tables.

## Company accounts (native)

- `POST /api/v3/admin/companies` creates a company (kind, `po_number_required`, etc.).
- `POST /api/v3/admin/companies/:id/memberships` adds buyers (`customer_id`). Memberships/roles are managed by Spree; buyers are scoped to their company.
- Store API exposes `account/companies` and `companies/:id` for the signed-in customer.

## Catalogs, pricing, MOQ (native)

- `POST /api/v3/admin/catalogs` with `assignments` (`assignable_type: company`, `assignable_id`), `minimum_order_quantity`, `order_multiple`, and an inline `price_list` (`price_adjustment_percentage`, `price_adjustment_tiers`).
- `POST /api/v3/admin/catalogs/:id/products` curates the assortment; `PUT …/quantity_rules` sets per-product MOQ/order multiples.
- `POST /api/v3/admin/prices` with `min_quantity` + `price_list_id` creates tiered prices. Anything above quantity 1 requires a price list.
- A B2B cart carries `company_id` and optional `po_number`; quantity rules are enforced server-side (below-MOQ adds are rejected).

## RFQ / quotes (Empire-custom)

Tables: `empire_rfqs`, `empire_quotes`. Models validate store/company/variant/seller references and company membership.

1. **Buyer creates RFQ**: `POST /api/v3/store/empire/rfqs` (title, requested_quantity, optional company_id/variant_id/seller_id, budget_min/max, currency, expires_at). Status `open`.
2. **Seller quotes**: `POST /api/v3/seller/empire/quotes` (rfq_id, amount, notes). RFQ moves to `quoted`; quotes are scoped to the seller's store.
3. **Buyer accepts**: `POST /api/v3/store/empire/rfqs/:id/quotes/:quote_id/accept` (`Empire::AcceptQuote`). RFQ becomes `accepted`; the chosen quote is accepted and competing quotes are rejected. Acceptance is locked against concurrent reviews.
4. Admin can list RFQs: `GET /api/v3/admin/empire/rfqs`.

An accepted quote is a commercial agreement record; converting it into an order uses the normal Spree cart/checkout flow with the agreed company catalog/pricing. There is no separate "draft order approval" engine in Empire; Spree order states and company PO requirements apply.

## Security

- Company data is scoped by native memberships; a buyer of company A cannot read company B's orders/catalogs.
- RFQ readability: owner customer or a customer standing for the RFQ's company (`Rfq#readable_by?`).
- Seller quotes/payout requests require the seller JWT + `X-Spree-Seller-Id`; staff review requires an admin JWT/secret key.
