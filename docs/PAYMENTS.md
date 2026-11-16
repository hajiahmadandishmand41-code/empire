# Payments

Empire enables **Cash on Delivery (COD)** on Spree 6.0.4's payment-method framework. No online gateway is activated without real credentials and legal review.

## Payment methods

| Method | Description | Status |
|--------|-------------|--------|
| Cash on Delivery (COD) | Pay cash on delivery; manual capture | Implemented (`Empire::CashOnDelivery`) |
| Stripe / Stripe Connect | Online card payments | Gem present (`spree_stripe`); **not enabled** — needs legal review + live credentials |
| Bank transfer with receipt | Upload receipt, admin verification | **Not implemented** (no `empire_bank_transfers` table or endpoint) |
| Local PSP adapter | Afghan/local gateway | Planned — no provider contract |

## Cash on Delivery

- `Empire::CashOnDelivery < Spree::PaymentMethod::Check` reuses Spree's offline Check implementation; provider key `empire_cash_on_delivery`.
- Registered in `Rails.application.config.after_initialize` (after Spree core populates `Spree.payment_methods`), matching the pattern used by Spree provider gems. Registering in `to_prepare` fails because the registry is still nil.
- Seeded as an active payment method for the Afghanistan store.
- Checkout: `POST /api/v3/store/carts/:id/payments` with the COD `payment_method_id`, then `POST …/complete`. Spree 6 authorizes the offline payment at completion, so the order's `payment_status` is **`authorized`** (pending collection), not `paid`; capture is manual.
- Staff captures when cash is collected: `PATCH /api/v3/admin/orders/:order_id/payments/:id/capture`.

## Security rules

- No API keys or bank credentials in Git; secrets via environment/secret manager.
- COD has no gateway credentials and cannot double-charge.
- Payment state transitions follow Spree's native payment workflow; Empire does not invent parallel payment ledgers.
- Seller payouts use the native Spree ledger with an Empire review gate (see `docs/MARKETPLACE.md`).

## What still needs external integration

- Stripe/Stripe Connect: legal clearance for the target market, live keys, sandbox transaction proof.
- A real local PSP: adapter implementation + credentials + signature-verified, idempotent webhooks.
- Bank-transfer receipt verification: would require a new model, upload endpoint, and admin verification workflow (currently absent).
