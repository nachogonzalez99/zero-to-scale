# 0014. Container image

- **Status:** Accepted
- **Date:** 2026-10-29

## Context

The API must run the same way on a laptop, in CI, in staging and in production. We need one artifact, built once, that carries the code, its dependencies and the runtime, and nothing else.

## Decision

- One Docker image per service, built from the repository root, where the lockfile and the workspace live: `docker build -f dropr/api/Dockerfile .`
- Base image `node:26-slim`, pinned by digest. Dependabot proposes digest and minor updates; a new Node major is a decision, together with `.nvmrc`.
- Multi-stage: the build stage runs `pnpm fetch --prod` (cached by the lockfile alone) and `pnpm deploy --prod --offline`. The runtime stage has Node, `src/` and production dependencies. No pnpm, no dev tooling, and npm removed.
- The package's `files` field is the allowlist of what ships: `src/`.
- TypeScript is not compiled: Node runs the same `.ts` files the tests run.
- Runs as UID 1000 (the image's `node` user), numeric so platforms can verify it is not root. Code is owned by root and read-only to the app.
- `CMD` in exec form: Node is PID 1 and receives signals. The app handles them ([ADR-0015](0015-health-probes-and-graceful-shutdown.md)).
- `VERSION` and `COMMIT` build arguments become `APP_VERSION` and `APP_COMMIT`, declared last to keep the layer cache. OCI labels are added by CI, not in the Dockerfile.
- A strict `.dockerignore`: no local `node_modules`, Git data, docs, infrastructure or env files.

## Alternatives considered

- Alpine: smaller, but musl instead of glibc can break native modules.
- Distroless: no shell and no npm at all, so a smaller attack surface; harder to debug. The next step if base-image findings keep coming.
- `docker run --init` for signals: depends on every platform enabling it, and does not give a graceful shutdown.
- Compiling to JavaScript: a second artifact that is not what the tests ran.

## Consequences

- From 1.13 GB with every tool to the base image plus about 35 MB.
- Day-to-day development stays on `pnpm dev`. Docker is needed only to check the image.
- Deleting npm in a later layer hides it but does not shrink the image.
- A dependency wrongly declared in `devDependencies`, or a runtime file outside `src/`, breaks the image but not the tests. The image test in CI catches it ([ADR-0017](0017-image-publishing.md)).
