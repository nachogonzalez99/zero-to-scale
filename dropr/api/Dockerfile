# Pinned by digest: same base on every build. Dependabot proposes updates.
FROM node:26-slim@sha256:e4db4c914bf8ad241bd24804fc25d272d89bad97e68cdc8a1414862790a02c39 AS base

# ---- Build: prepares the app with production dependencies only ----
FROM base AS build

# Non-interactive build. Also stops lefthook from installing Git hooks.
ENV CI=true
WORKDIR /repo

RUN npm install --global pnpm@11.28.8

# Production dependencies only: nothing else is needed to run
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch --prod

COPY . .
RUN pnpm --filter @dropr/api deploy --prod --offline /app

# ---- Runtime: Node, the code and its dependencies. Nothing else ----
FROM base

ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app ./

# Least privilege: if the app is compromised, the attacker is not root
USER node
EXPOSE 3000

# Last: COMMIT changes on every build and would invalidate every layer below it
ARG VERSION=0.0.0-dev
ARG COMMIT=unknown
ENV APP_VERSION=$VERSION \
    APP_COMMIT=$COMMIT

# Exec form: node is PID 1 and receives signals directly
CMD ["node", "src/server.ts"]
