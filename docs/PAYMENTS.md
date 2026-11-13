# Payments

Empire supports multiple payment methods. **No payment gateway is activated without a real API connection and legal review.** Until then, methods are shown as "disabled / needs configuration".

## Payment methods

| Method | Description | Status |
|--------|-------------|--------|
| Cash on Delivery (COD) | Pay cash when the order is delivered | Enabled (demo) |
| Bank transfer with receipt | Transfer to a merchant bank account; upload receipt for admin verification | Enabled (demo) |
| Stripe / Stripe Connect | Online card payments | Disabled (needs legal review + live gateway) |
| Local gateway adapter | Extensible adapter for local PSPs | Planned |

## Cash on Delivery (COD)

- Customer selects COD at checkout; no upfront payment.
- Order is created and sent to the seller; payment collected on delivery.
- No API credentials required; safe to enable for the Afghanistan market.

## Bank transfer with receipt

1. Customer selects bank transfer; enters bank name, account number, holder, branch, amount, reference number.
2. Customer uploads a payment receipt (ActiveStorage).
3. A `empire_bank_transfers` record is created with `status = pending`.
4. Admin verifies the receipt against the bank statement and marks `verified` or `rejected` (with reason).
5. Order is released only after verification.

Endpoint: `POST /api/v3/store/empire/bank_transfers`.

## Security rules

- **No API keys or bank credentials in Git.** All secrets via environment variables (`STRIPE_SECRET_KEY`, etc.) or secret manager.
- **Idempotency:** payment callbacks/webhooks are keyed by a unique reference number (`empire_bank_transfers.reference_number` unique) to prevent double-charging or duplicate orders.
- **Status tracking:** every payment has a defined, traceable status (pending → verified/paid → rejected).
- **No repeat charges:** the same reference number cannot create two transfers for one order.
- **Admin review:** receipts can be inspected and verified/rejected by an administrator.
- **Seller payouts** keep a financial/audit history (`empire_payouts` with requested/approved/paid/rejected states and `approved_by`).

## Disabled by default

Stripe is listed in the Spree `Gemfile` (`spree_stripe`) but `Empire.config.stripe_enabled = false`. It is only enabled after:
1. Legal review confirms Stripe/Stripe Connect can operate in the target market.
2. Live gateway credentials are provided via environment variables.
3. A test transaction succeeds in sandbox.

## What still needs external integration

- A real local PSP (e.g. Afghan payment gateway) — adapter implementation + credentials.
- International card processing — Stripe/Stripe Connect (pending legal review).
- Webhook endpoints from the gateway (idempotent, signature-verified).
