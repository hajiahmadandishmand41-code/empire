# Deployment

Two deployable parts: **backend** (Rails + Spree + PostgreSQL) and **storefront** (Next.js). **No production deployment has been performed.** This document describes how to deploy; it is not evidence that deployment happened.

## Local / CI stack (Docker Compose)

```bash
npm ci
npm run env:bootstrap          # creates .env with random local secrets (refuses to overwrite)
docker compose -f docker-compose.dev.yml up -d --build
```

- `docker-compose.dev.yml` builds `server/Dockerfile` (target `dev`), bind-mounts `server/`, runs migrate + seed (demo enabled), PostgreSQL 18, Mailpit, and the storefront. Demo accounts are enabled **only** here (`EMPIRE_SEED_DEMO=true`).
- `docker-compose.yml` is the production-image stack: same Dockerfile/Gemfile.lock, production target, **no demo seed**, HTTPS defaults. CI's `production-image` job asserts demo data did not leak.
- Both stacks build from `server/Dockerfile` (checked by `scripts/audit-static.mjs`); neither uses a prebuilt stock Spree image that would ignore local code.

The Spree CLI (`npx spree …`) wraps these compose files for humans; CI calls `docker compose` directly with explicit `-f` files.

## Backend on a Docker host

1. Build `server/Dockerfile` (production target).
2. Provide a managed PostgreSQL 18 (`DATABASE_URL` or `DATABASE_HOST/PORT/USERNAME/PASSWORD/NAME`).
3. Set real secrets: `SECRET_KEY_BASE`, the three `ACTIVE_RECORD_ENCRYPTION_*` keys, `SPREE_HOST`, `SPREE_PUBLISHABLE_KEY`, `ADMIN_EMAIL`/`ADMIN_PASSWORD` (first admin), `MISSION_CONTROL_USER/PASSWORD`.
4. Run migrations and seed as deployment jobs (`bin/rails db:migrate`, `bin/rails db:seed` inside the image). Do **not** set `EMPIRE_SEED_DEMO` in production.
5. `RAILS_FORCE_SSL=true`, `RAILS_ASSUME_SSL=true`. The runtime initializer refuses to boot production with missing/short secrets.

## Storefront on a Next.js host

```bash
cd storefront
npm ci
npm run build      # standalone output
```

- Set `API_INTERNAL_URL` to the backend's internal URL (server-side rewrite target; never exposed to the browser). Next.js bakes rewrite destinations at build time: pass it as a Docker build arg as well as runtime environment (`storefront/Dockerfile` defaults to `http://web:3000` for Compose).
- Set `NEXT_PUBLIC_SPREE_PUBLISHABLE_KEY` to the store's publishable key (public, not a secret).
- Browser requests stay relative (`/api/*`); `next.config.ts` rewrites them to the backend. Do not point browser code at `localhost`.
- Alternatively build `storefront/Dockerfile` and run the standalone server on port 3001.

## Production checklist

- [ ] Real `SECRET_KEY_BASE` and encryption keys generated, backed up, never rotated after data is encrypted
- [ ] Managed PostgreSQL + backup/restore tested
- [ ] `RAILS_FORCE_SSL` / `RAILS_ASSUME_SSL` true; real `SPREE_HOST`
- [ ] CORS allows the storefront origin (`server/config/initializers/cors.rb`)
- [ ] SMTP, object storage, optional Meilisearch/CDN configured if used
- [ ] Payment gateway only after legal review + sandbox proof
- [ ] No demo seed / demo credentials in production

## What is NOT done

- No production deployment performed.
- No real payment gateway or carrier connected.
- Backup automation documented only.
