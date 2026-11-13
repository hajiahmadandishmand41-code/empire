# B2B / Wholesale Workflows

Empire supports company (B2B) accounts with wholesale pricing, volume tiers, MOQ, purchase orders, draft orders, approval workflows and RFQ. Company features are **Empire-custom** extensions built on Spree core.

## Company accounts

1. A company registers with name, registration number, tax ID, industry, addresses (billing & shipping).
2. Company users are invited and assigned roles:
   - `buyer` — can place orders
   - `company_admin` — manages company, catalog, approvers
   - `order_approver` — can approve orders
3. Multiple buyers can belong to one company.

Tables: `empire_companies`, `empire_company_users`, `empire_company_users.role`.

## Wholesale pricing

- **Volume pricing** (`empire_volume_pricing`): per variant, per company (or global), with `min_quantity`, optional `max_quantity`, price, currency, validity window (`starts_at`/`expires_at`).
- **MOQ** (`spree_variants.moq`): minimum order quantity per variant (default 1).
- **Wholesale price** (`spree_variants.wholesale_price`): negotiated price for B2B buyers.
- Pricing can vary by company, market and sales channel, with start/end validity.

## Purchase orders & draft orders

- A B2B order carries an optional `po_number` (customer purchase order number).
- Orders can be created as **draft** (Spree order states: cart → draft) and submitted for approval.
- **Approval workflow**: an `order_approver` user reviews and approves before the order is finalized.
- Approved draft orders become regular Spree orders.

## RFQ (Request for Quote)

RFQ enables price negotiation for wholesale/bulk goods:

1. **Buyer creates RFQ** (`POST /api/v3/store/empire/rfqs`): title, description, budget min/max, currency, expiry, optional company.
2. **Seller sends quote** (`Empire::Quote`): amount, currency, notes, status pending.
3. **Buyer accepts or rejects** the quote:
   - Accept → RFQ status `accepted`, other quotes auto-rejected.
   - Reject → quote status `rejected`.
4. Accepted quote can be converted into a real (wholesale) order.

Tables: `empire_rfqs`, `empire_quotes`. Endpoints: store RFQ API; admin can list all RFQs.

## B2B checkout flow

1. Company buyer browses the company catalog with company-specific volume prices.
2. Buyer sees MOQ and wholesale price per variant.
3. Buyer enters PO number (optional) and submits order as draft.
4. Company approver reviews and approves.
5. Order is finalized; inventory reserved; commission/split calculated if marketplace items are involved.

## Security

- Company data is scoped to the company; buyers of company A cannot see company B's orders or price lists.
- Order approval requires the `order_approver` role within the company.
- Server-side enforcement; UI-only hiding is not a control.
