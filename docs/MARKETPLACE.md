# Marketplace (Multi-vendor)

Empire's marketplace capability connects sellers, manufacturers, wholesalers, importers and exporters with buyers in a single bazaar. The marketplace logic builds on Spree's multi-vendor support plus Empire-specific extensions.

## Seller registration & profile

1. A customer registers a normal Spree user account.
2. The user requests a seller profile (`POST /api/v3/store/empire/sellers` — shop name, description, business registration number, tax ID, identity/registration/tax documents).
3. The profile is stored in `empire_sellers` with `verification_status = pending`.
4. Documents are attached via ActiveStorage (file storage configurable via `.env`).

## Seller verification (admin-controlled)

- Admin reviews seller profiles in the Admin Dashboard / Admin API.
- Admin can: verify (set `verified`), reject (with reason), suspend.
- Endpoints: `PATCH /api/v3/admin/empire/sellers/:id/verify`, `/reject`, `/suspend`.
- Until verified, the seller's shop shows a "pending verification" badge and products are not promoted.

## Data isolation

- A seller can only view **their own** orders, order splits, commissions, payouts and products.
- No seller can access another seller's customers, revenue, inventory or documents.
- Access control is enforced server-side (Spree roles + `Empire::Ability`); hiding buttons in the UI is not sufficient.

## Commission & revenue split

- Commission rate is configurable per seller (`empire_sellers.commission_rate`, default 10%).
- On each completed order, Empire creates an `empire_commission` record:
  - `order_total` — order total
  - `commission_rate` — seller's rate
  - `commission_amount` — seller's share
  - `platform_share` — order_total − commission_amount
  - `seller_share` — commission_amount
- Multi-vendor carts are split into `empire_order_splits` — one per seller — with subtotal, commission and seller payable.

## Seller payouts

- A verified seller requests a payout (`POST /api/v3/store/empire/payouts`).
- Payout status: requested → approved → paid (or rejected).
- Admin approves/rejects payouts via `PATCH /api/v3/admin/empire/payouts/:id/approve` or `/reject`.
- Payout records keep `net_amount`, `commission_deducted`, `currency`, `payment_reference` for audit.

## Seller dashboard (storefront)

- `/seller` — overview: sales today, new orders, active products, pending commission.
- Seller products: add/edit own products (via Spree API scoped to seller).
- Seller orders: view orders containing own products.
- Seller income & commission: commission statement.
- Seller payouts: request payout, view payout history.
- Seller settings: shop profile.

## What uses Spree core vs Empire custom

| Capability | Source |
|------------|--------|
| Multi-vendor order concepts | Spree core (orders, line items, shipments) |
| Seller registration | Spree user + Empire `empire_sellers` |
| Seller verification | Empire admin API |
| Commission per seller | Empire `empire_commissions` |
| Order split per seller | Empire `empire_order_splits` |
| Payout requests | Empire `empire_payouts` |
