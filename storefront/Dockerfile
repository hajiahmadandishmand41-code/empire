# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_SPREE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_SPREE_PUBLISHABLE_KEY=${NEXT_PUBLIC_SPREE_PUBLISHABLE_KEY}
RUN npm run build

FROM base AS runner
RUN apk add --no-cache libc6-compat && addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
ENV NODE_ENV=production PORT=3001 HOSTNAME=0.0.0.0
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3001
CMD ["node", "server.js"]
