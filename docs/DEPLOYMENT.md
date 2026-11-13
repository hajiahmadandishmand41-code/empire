# Deployment

Empire has two deployable parts: the **backend** (Rails + Spree + PostgreSQL) and the **storefront** (Next.js). No production deployment has been performed — this document describes how to deploy.

## Backend (Railway or Docker-compatible host)

The backend runs in Docker Compose locally and can be deployed to Railway or any Docker-compatible host.

### Local (Docker Compose)

```bash
cp .env.example .env
# Edit .env: SECRET_KEY_BASE, encryption keys, SPREE_HOST, mail/SMTP, object storage
docker compose up -d
npx spree db:prepare
npx spree seed
```

- `docker-compose.yml` — quick-start: prebuilt Spree image + PostgreSQL + Mailpit.
- `docker-compose.dev.yml` — development: bind-mounts `server/` for live editing.

### Railway

1. Connect the GitHub repo to Railway.
2. Add a PostgreSQL service.
3. Deploy the `server/` directory as a Docker service (build from `server/Dockerfile`).
4. Set environment variables in Railway (from `.env.example`, real values).
5. Run `npx spree db:prepare` and `npx spree seed` as deployment jobs.

### Production checklist

- [ ] `SECRET_KEY_BASE` generated with `bin/rails secret`
- [ ] Active Record encryption keys generated and backed up (never change after data encrypted)
- [ ] `DATABASE_URL` points to managed PostgreSQL
- [ ] `RAILS_FORCE_SSL=true`
- [ ] `SPREE_HOST` set to the real domain
- [ ] SMTP credentials for email
- [ ] Object-storage credentials (S3/R2) for ActiveStorage
- [ ] Stripe or local PSP credentials (after legal review)
- [ ] `MISSION_CONTROL_USER/PASSWORD` for the job dashboard
- [ ] Database backup schedule configured

## Storefront (Vercel or Next.js-compatible host)

```bash
cd storefront
npm install
npm run build
```

### Vercel

1. Import the `storefront/` directory (or the whole repo with root directory `storefront`) into Vercel.
2. Set environment variables:
   - `NEXT_PUBLIC_API_URL` — backend URL (e.g. `https://api.empire.example.com`)
   - `NEXT_PUBLIC_STORE_URL` — storefront URL
   - `NEXT_PUBLIC_DEFAULT_LOCALE=fa-AF`
   - `NEXT_PUBLIC_DEFAULT_CURRENCY=AFN`
3. Deploy. Vercet builds on every push to the branch.

### Docker (alternative)

Build a standalone Next.js image:

```bash
cd storefront
docker build -t empire-storefront .
docker run -p 3001:3001 \
  -e NEXT_PUBLIC_API_URL=https://api.empire.example.com \
  empire-storefront
```

## Backend & storefront connection

The storefront calls the backend Store API at `NEXT_PUBLIC_API_URL`. Ensure CORS (`rack-cors`, configured in `server/config/initializers/cors.rb`) allows the storefront origin.

## Secrets in production

Use the host's secret store (Railway variables, Vercel environment variables, AWS Secrets Manager, HashiCorp Vault). Never commit `.env`.

## Database backup & recovery

- Managed PostgreSQL providers (Railway, AWS RDS) offer automated backups and point-in-time recovery.
- For self-hosted PostgreSQL: schedule `pg_dump` to object storage; test restore regularly.
- Back up Active Record encryption keys separately from the database — losing them makes encrypted data unreadable.

## What is NOT done yet

- No production deployment performed.
- No real payment gateway or carrier API connected.
- Backup automation not implemented (documented only).
