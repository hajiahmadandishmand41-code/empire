# Security

Security is part of the architecture, not an afterthought.

## Access control

- Role-based access control via Spree roles (`admin`, `customer`) plus Empire roles (`seller`, `company_admin`, `order_approver`, `buyer`).
- Sellers access only their own orders, products, commissions, payouts — enforced in models and API controllers, not only in the UI.
- Company buyers access only their company's orders/catalog.
- Admin has full access.
- `Empire::Ability.permissions(user)` centralizes permission logic.

## Server-side validation

- All API endpoints validate input server-side (ActiveRecord validations + strong parameters).
- Client-side validation in the storefront is UX only — never a security control.

## Secrets management

- `SECRET_KEY_BASE`, Active Record encryption keys, database credentials, API keys (Stripe, carrier, SMTP) come from environment variables or a secret manager.
- `.env` is gitignored; `.env.example` documents required variables.
- No secrets committed to Git.

## Encryption

- Active Record encryption encrypts webhook signing keys, gateway customer IDs, and OAuth tokens at rest (when the three encryption keys are set).
- TLS enforced in production (`RAILS_FORCE_SSL`).

## CSRF / session / tokens

- Rails CSRF protection for session-based requests.
- API authentication via Spree API keys (publishable/secret).
- Secure, HTTP-only session cookies.

## Injection protection

- Parameterized queries via ActiveRecord — no raw SQL with user input.
- Strong parameters prevent mass-assignment.
- Content Security Policy header configured.

## File uploads

- Uploaded files (receipts, seller documents, product images) via ActiveStorage.
- Content-type and size limits recommended in production.
- Stored outside web root or on S3-compatible object storage.

## Audit log

- Sensitive admin and financial operations (seller verify/reject/suspend, payout approve/reject, bank transfer verify) record the acting admin user (`approved_by`, `verified_by`, `resolved_by`).
- `empire_payouts`, `empire_bank_transfers`, `empire_disputes` keep timestamps and actor references.

## Idempotency

- Bank transfer reference numbers are unique — prevents duplicate transfers/double charges.
- Payment callbacks keyed by unique reference.

## Dependency scanning

- `bundler-audit` and `brakeman` included in the Gemfile and CI for vulnerability scanning.

## What needs external setup

- Real payment gateway credentials (after legal review).
- SMTP credentials for email delivery.
- Object-storage credentials (S3/R2) for file uploads.
- Secret manager (Railway variables, Vercel env, or equivalent) for production.
