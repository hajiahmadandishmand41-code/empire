# Security

## Access control

- Spree 6.0.4 roles/permissions. Empire registers extra permission scopes in `server/config/initializers/empire.rb` (`rfqs`, `quotes`, `payout_requests`).
- Store API: publishable `pk_` key (`X-Spree-Api-Key`), customer JWT (`aud: store_api`), guest cart token (`X-Spree-Token`).
- Admin API: secret `sk_` key or admin JWT. Seller API: seller JWT **plus** `X-Spree-Seller-Id`; the store is derived from the seller and foreign seller ids are 404.
- Seller application creates a seller-only team membership; it never grants store staff roles, approval, or payouts.
- Company buyers are scoped by native company memberships; RFQ readability checks owner or company standing (`Rfq#readable_by?`).
- Payout review requires a staff reviewer (`Empire::ReviewPayoutRequest` raises unless the reviewer is a `Spree.admin_user_class`).

## Server-side validation

- ActiveRecord validations + strong parameters on every Empire endpoint. Client-side validation is UX only.
- Quote acceptance and payout review run inside transactions with row locks to prevent double-accept / double-review (`RecordNotUnique` / already-reviewed guards).

## Secrets management

- `SECRET_KEY_BASE`, Active Record encryption keys, DB password, API keys come from environment/secret manager. `.env` is gitignored; `.env.example` documents variables; `scripts/bootstrap-env.sh` generates random local secrets and refuses to overwrite an existing `.env`.
- `server/config/initializers/empire_runtime.rb` **fails closed in production** if required secrets are missing or shorter than 32 chars (asset builds with `SECRET_KEY_BASE_DUMMY` are exempt).
- No secrets committed to Git. CI uses clearly-labelled `ci-only-*` values.

## Encryption & transport

- Active Record encryption configured for sensitive Spree fields when the three encryption keys are set.
- Production defaults to HTTPS (`RAILS_FORCE_SSL`, `RAILS_ASSUME_SSL`); dev/CI disable them only for local HTTP smoke tests.
- Content Security Policy initializer present; parameter filtering configured.

## Tokens / sessions

- Spree JWT auth with audience separation (store vs admin/seller). Admin/seller refresh and logout read the HttpOnly refresh cookie only (not a body token).
- Guest carts are claimed with `X-Spree-Token`; address-book writes require the account owner.

## Injection / uploads

- Parameterized ActiveRecord queries; strong parameters prevent mass assignment.
- Uploads use ActiveStorage; production should set content-type/size limits and object storage.

## Audit trail

- `empire_payout_requests` records `reviewed_by`, `reviewed_at`, `rejection_reason`, and the native `payout_id`.
- Quote acceptance records the accepted quote and rejects competitors atomically.
- Native Spree ledgers (commissions, transfers, payouts) remain the financial source of truth.

## Dependency scanning

- `brakeman` and `bundler-audit` run in `backend-ci.yml` (warnings/advisories fail the job). Execution status is in `docs/TESTING.md`.

## What needs external setup

- Real payment gateway credentials (after legal review), SMTP, object storage, and a production secret manager. None is contacted by default.
