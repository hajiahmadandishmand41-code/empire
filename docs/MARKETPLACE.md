# Marketplace (Multi-vendor)

Empire uses **Spree 6.0.4's native marketplace**: sellers, seller approval, commission rates, multi-vendor order splitting, seller transfers and seller payouts are core features. Empire adds a public seller-application endpoint and a payout **review** gate; it does not duplicate sellers/commissions/payouts in custom tables.

## Seller registration & approval

1. Applicant calls `POST /api/v3/store/empire/seller_applications` with email, password, shop name, optional registration number.
2. Empire creates a pending native `Spree::Seller` (via `Spree.seller_create_workflow`) and a seller-only team membership (`seller.add_user`). No store staff role, approval, or payout is granted.
3. Staff approves through the native Admin API: `PATCH /api/v3/admin/sellers/:id/approve` (optionally `override_requirements`). Suspension/rejection use native seller admin endpoints.
4. Seller signs in at `POST /api/v3/seller/auth/login`; subsequent Seller API calls require the seller JWT **and** `X-Spree-Seller-Id`.

## Data isolation

- Seller API is rooted in `current_seller`; another seller's id is a 404. Sellers see only their own products, orders, stock locations, balances and payouts.
- Store staff roles are never granted by the application endpoint.
- Enforcement is server-side (Spree permissions + controller scoping), not UI-only.

## Commission & revenue split (native)

- Commission rates are native `Spree::CommissionRate` records (seed creates a disabled 0% `marketplace-default`; operators configure real rates).
- At order placement, `Spree::Commissions::CommissionOrder` records commission lines.
- Multi-vendor carts complete into a Spree **order group** with one order per seller; single-seller carts complete into one order.
- On fulfilment (`order.fulfilled`), `Spree::SellerTransfers::Create` credits the seller's balance (requires fulfillments and `fully_fulfilled?`).

## Seller payouts (native ledger + Empire review gate)

1. Seller checks balance: `GET /api/v3/seller/balances`; payout history: `GET /api/v3/seller/payouts`.
2. Seller requests review: `POST /api/v3/seller/empire/payout_requests` (currency must match a positive balance; creates `empire_payout_requests` with status `requested`). This is a review request, **not** money movement.
3. Staff approves/rejects: `PATCH /api/v3/admin/empire/payout_requests/:id/approve|reject`. Approval runs `Spree.seller_payout_sweep_workflow`, which claims completed unsettled transfers and creates a native pending `Spree::SellerPayout`; the request stores `payout_id`, `reviewed_by`, `reviewed_at`. Rejection records a reason.
4. Staff completes the native payout: `PATCH /api/v3/admin/seller_payouts/:id/complete`. The balance falls only after the native `seller_payout_complete_workflow`.

## Seller surfaces

- Spree seller dashboard: `apps/seller-dashboard` (served at `/sellers`), built and contract-tested in CI.
- Empire staff pages in the storefront: `/seller/payout-requests` (request + history) and `/admin/payout-requests` (approve/reject), using `storefront/src/lib/staff-api.ts` (admin/seller JWT with HttpOnly-cookie refresh).

## Source split

| Capability | Source |
|------------|--------|
| Sellers, approval, commission, order split, transfers, payouts | Spree 6.0.4 core |
| Public seller application | Empire (`store/empire/seller_applications`) |
| Payout review request + staff decision | Empire (`empire_payout_requests`, `Empire::ReviewPayoutRequest`) |
