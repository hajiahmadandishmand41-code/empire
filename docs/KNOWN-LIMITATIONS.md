# Known Limitations

Honest status of what is **not yet implemented, tested, or operational**. This is required reading before any production consideration.

## Environment limitations (this sandbox)

- **No Ruby / Rails / Bundler** — backend cannot be started or tested locally.
- **No PostgreSQL** — database cannot run locally.
- **No Redis** — not required by default (Solid stack uses PostgreSQL), but unavailable.
- **No Docker** — Docker Compose stack cannot run locally.
- **rubygems.org and deb.debian.org unreachable** — Ruby cannot be installed via apt or gem.
- npm registry (registry.npmjs.org) is reachable — frontend tooling works.

Because of the above:
- Backend RSpec specs are **written but not executed** here.
- `bin/rails db:prepare`, migrations, `bundle exec rspec` cannot run in this sandbox.
- `docker compose up` cannot run in this sandbox.

## Backend

- [x] Spree scaffold (official create-spree-app)
- [x] Empire migrations, models, API controllers, locale files
- [ ] Backend specs executed (blocked by missing Ruby/PostgreSQL)
- [ ] `spree seed` executed (blocked)
- [ ] Admin dashboard customized (uses Spree default via `/dashboard`)

## Frontend

- [x] Next.js storefront scaffolded
- [x] Core pages: home, products, product detail, cart, checkout, login, register, account, seller, admin
- [x] RTL/LTR + i18n (Dari/Pashto/English) + AFN currency
- [ ] Frontend unit/integration tests (no test runner configured)
- [ ] `npm run build` not yet executed (blocked by missing node_modules install in sandbox)
- [ ] `npm run lint` not yet executed

## End-to-End

- [ ] E2E tests not implemented (no Playwright/Cypress installed)
- [ ] Full buyer→seller→admin flow not executed

## Payments (external dependencies)

- [ ] Stripe / Stripe Connect: disabled — needs legal review for Afghanistan + live credentials
- [ ] Local PSP adapter: not implemented
- [ ] Bank transfer receipt verification: implemented in code, not tested against a real bank
- [ ] COD: implemented in code, not tested against real delivery

## Shipping (external dependencies)

- [ ] Carrier API (DHL/FedEx/ Afghan Post): not integrated — manual admin rates only
- [ ] Real-time shipping quotes: not available

## Localization data

- [x] 34 Afghan provinces + districts seeded (transliteration may vary)
- [ ] District data completeness — admin correction UI planned
- [ ] Solar Hijri calendar display: planned

## Internationalization

- [x] Markets concept documented
- [ ] Multiple live markets beyond Afghanistan: not configured

## Deployment

- [ ] No production deployment performed
- [ ] Backup automation: documented only

## Security

- [ ] No real penetration test
- [ ] `bundler-audit` / `brakeman` configured in CI but not run in this sandbox
