# syntax=docker/dockerfile:1
# check=error=true
ARG RUBY_VERSION=4.0.9
ARG NODE_VERSION=22

# Build context is the repository root in both Compose files. The Rails app,
# admin panel and seller panel are versioned together; no stock Spree image is
# used anywhere in the runtime path.
FROM docker.io/library/alpine:3.21 AS ctx
COPY . /ctx

FROM docker.io/library/node:${NODE_VERSION}-slim AS dashboard
WORKDIR /dashboard
COPY --from=ctx /ctx/apps/dashboard/package.json /ctx/apps/dashboard/pnpm-lock.yaml /ctx/apps/dashboard/pnpm-workspace.yaml ./
RUN corepack enable && corepack pnpm install --frozen-lockfile --ignore-scripts
COPY --from=ctx /ctx/apps/dashboard ./
RUN VITE_BASE_PATH=/dashboard/ corepack pnpm build

FROM docker.io/library/node:${NODE_VERSION}-slim AS seller-dashboard
WORKDIR /seller-dashboard
COPY --from=ctx /ctx/apps/seller-dashboard/package.json /ctx/apps/seller-dashboard/pnpm-lock.yaml /ctx/apps/seller-dashboard/pnpm-workspace.yaml ./
RUN corepack enable && corepack pnpm install --frozen-lockfile --ignore-scripts
COPY --from=ctx /ctx/apps/seller-dashboard ./
RUN VITE_BASE_PATH=/sellers/ corepack pnpm build

FROM docker.io/library/ruby:${RUBY_VERSION}-slim AS base
WORKDIR /rails
RUN apt-get update -qq && \
  apt-get install --no-install-recommends -y curl libjemalloc2 libvips && \
  ln -s /usr/lib/$(uname -m)-linux-gnu/libjemalloc.so.2 /usr/local/lib/libjemalloc.so && \
  rm -rf /var/lib/apt/lists /var/cache/apt/archives
ENV RAILS_ENV="production" \
  BUNDLE_DEPLOYMENT="1" BUNDLE_FROZEN="true" \
  BUNDLE_PATH="/usr/local/bundle" BUNDLE_WITHOUT="development:test" \
  LD_PRELOAD="/usr/local/lib/libjemalloc.so"

FROM base AS build
RUN apt-get update -qq && \
  apt-get install --no-install-recommends -y build-essential git libpq-dev libyaml-dev pkg-config zlib1g-dev && \
  rm -rf /var/lib/apt/lists /var/cache/apt/archives
COPY --from=ctx /ctx/server/.ruby-version /ctx/server/Gemfile /ctx/server/Gemfile.lock ./
RUN bundle install && bundle exec bootsnap precompile --gemfile
COPY --from=ctx /ctx/server ./
RUN bundle exec bootsnap precompile app/ lib/ && \
  SECRET_KEY_BASE_DUMMY=1 ./bin/rails assets:precompile

# Development and production resolve the same exact Gemfile.lock. This target
# adds the locked development/test gems; it never re-resolves Spree versions.
FROM build AS dev
ENV RAILS_ENV="development" BUNDLE_DEPLOYMENT="0" BUNDLE_WITHOUT=""
RUN apt-get update -qq && apt-get install --no-install-recommends -y postgresql-client && \
  rm -rf /var/lib/apt/lists /var/cache/apt/archives
RUN bundle install
COPY --from=dashboard /dashboard/dist /opt/empire/dashboard
COPY --from=seller-dashboard /seller-dashboard/dist /opt/empire/seller-dashboard
ENV SPREE_DASHBOARD_DIST_PATH="/opt/empire/dashboard" \
  SPREE_SELLER_PANEL_DIST_PATH="/opt/empire/seller-dashboard"
RUN groupadd --system --gid 1000 rails && \
  useradd rails --uid 1000 --gid 1000 --create-home --shell /bin/bash && \
  chown -R rails:rails "${BUNDLE_PATH}" /rails /opt/empire
USER 1000:1000
EXPOSE 3000
ENTRYPOINT ["/rails/bin/docker-entrypoint"]
CMD ["./bin/rails", "server", "-b", "0.0.0.0"]

FROM base AS final
RUN groupadd --system --gid 1000 rails && \
  useradd rails --uid 1000 --gid 1000 --create-home --shell /bin/bash
COPY --chown=rails:rails --from=build "${BUNDLE_PATH}" "${BUNDLE_PATH}"
COPY --chown=rails:rails --from=build /rails /rails
COPY --chown=rails:rails --from=dashboard /dashboard/dist /opt/empire/dashboard
COPY --chown=rails:rails --from=seller-dashboard /seller-dashboard/dist /opt/empire/seller-dashboard
ENV SPREE_DASHBOARD_DIST_PATH="/opt/empire/dashboard" \
  SPREE_SELLER_PANEL_DIST_PATH="/opt/empire/seller-dashboard"
USER 1000:1000
EXPOSE 3000
ENTRYPOINT ["/rails/bin/docker-entrypoint"]
CMD ["./bin/rails", "server", "-b", "0.0.0.0"]
