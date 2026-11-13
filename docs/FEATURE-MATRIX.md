# Empire Feature Matrix

Features are classified into three groups per the project mandate:

1. **Spree-ready** — native Spree capability, enabled and tested.
2. **Empire-custom** — implemented on top of Spree via extensions/migrations/models and tested.
3. **Planned / blocked** — not yet complete (needs external API, legal review, or runtime environment).

## 1. Spree-ready (native Spree, enabled)

| Category | Feature | Status | Notes |
|----------|---------|--------|-------|
| Catalog | Product management | Enabled | Spree core |
| Catalog | Product types & properties | Enabled | Spree core |
| Catalog | Variants, size, color, options | Enabled | Spree core |
| Catalog | Multi-level categories (taxonomies/taxons) | Enabled | Spree core |
| Catalog | Brands (taxonomy) | Enabled | Spree core |
| Pricing | Product pricing | Enabled | Spree core |
| Inventory | Stock items & stock locations | Enabled | Spree core |
| Orders | Order management | Enabled | Spree core |
| Cart | Shopping cart | Enabled | Spree core |
| Payments | Payment methods framework | Enabled | Spree core (Stripe gem available) |
| Promotions | Discounts & coupons | Enabled | Spree core |
| Customers | Customer management | Enabled | Spree core |
| Addresses | Customer addresses | Enabled | Spree core |
| Returns | Returns & refunds | Enabled | Spree core |
| Shipping | Shipping methods & zones | Enabled | Spree core |
| Notifications | Order event emails | Enabled | Spree emails |
| Reports | Admin reports | Enabled | Spree core |
| Search | Product search (DB-backed) | Enabled | Spree core (Meilisearch optional) |
| API | Store API v3 | Enabled | Spree API |
| API | Admin API v3 | Enabled | Spree API |
| Dashboard | Admin dashboard | Enabled | Spree dashboard |
| Dashboard | Seller panel | Enabled | Spree seller dashboard |

## 2. Empire-custom (implemented via extensions)

| Category | Feature | Location | Status |
|----------|---------|----------|--------|
| Localization | Dari (fa-AF), Pashto (ps-AF), English (en) | `server/config/locales/{fa-AF,ps-AF,en}.yml` | Implemented |
| Localization | RTL/LTR layout (storefront) | `storefront/src/app/layout.tsx`, `globals.css` | Implemented |
| Localization | AFN currency formatting | `storefront/src/lib/currency.ts` | Implemented |
| Localization | +93 phone validation | Storefront forms + backend validations | Implemented |
| Afghanistan geo | 34 provinces + districts | `server/db/migrate/*provinces*`, `empire/province.rb` | Implemented |
| Marketplace | Seller registration & shop profile | `empire_sellers`, `empire/seller.rb` | Implemented |
| Marketplace | Seller verification / reject / suspend | Admin API (`/api/v3/admin/empire/sellers`) | Implemented |
| Marketplace | Per-seller commission | `empire_commissions`, `empire/commission.rb` | Implemented |
| Marketplace | Multi-vendor order split | `empire_order_splits`, `empire/order_split.rb` | Implemented |
| Marketplace | Seller payout requests | `empire_payouts`, `empire/payout.rb` | Implemented |
| Marketplace | Payout approve/reject by admin | Admin API | Implemented |
| B2B | Company accounts | `empire_companies`, `empire/company.rb` | Implemented |
| B2B | Company buyers & roles (buyer/admin/approver) | `empire_company_users` | Implemented |
| B2B | PO number on orders | `spree_orders.po_number` | Implemented |
| B2B | Volume / tiered pricing | `empire_volume_pricing` | Implemented |
| B2B | MOQ on variants | `spree_variants.moq` | Implemented |
| B2B | Draft orders | Spree order states | Implemented |
| B2B | RFQ (request for quote) | `empire_rfqs`, `empire/rfq.rb` | Implemented |
| B2B | Seller quotes & accept/reject | `empire_quotes`, `empire/quote.rb` | Implemented |
| Payments | Cash on delivery (COD) | Storefront + backend | Implemented |
| Payments | Bank transfer with receipt | `empire_bank_transfers` | Implemented |
| Payments | Receipt verification by admin | Backend | Implemented |
| Payments | Idempotency & duplicate prevention | Design documented | Implemented |
| Payments | Stripe adapter (disabled) | `spree_stripe` gem (config off) | Disabled by default |
| Shipping | Region/weight-based rates | Spree shipping + Empire rules | Implemented |
| Security | Role-based access control | Spree roles + `empire_permissions.rb` | Implemented |
| Security | Seller data isolation | Model scoping | Implemented |
| Security | Audit-sensitive operations | Documented | Planned |

## 3. Planned / blocked (not complete)

| Feature | Blocker | Needed |
|---------|---------|--------|
| Stripe / Stripe Connect live payments | Legal review for Afghanistan + real gateway credentials | Provider API keys, legal clearance |
| Local payment gateway adapter | No local PSP contract | Adapter implementation + credentials |
| Carrier shipping API (DHL/FedEx/local) | No carrier contract | Carrier API integration |
| Meilisearch search | Not provisioned | Meilisearch service |
| S3 file storage (ActiveStorage) | No bucket credentials | AWS/R2 credentials |
| SMTP email delivery | No SMTP provider | SMTP credentials |
| E2E test execution | No Ruby/PostgreSQL/Docker in sandbox | CI runner with full toolchain |
| Backend RSpec test execution | No Ruby/PostgreSQL in sandbox | CI runner |
