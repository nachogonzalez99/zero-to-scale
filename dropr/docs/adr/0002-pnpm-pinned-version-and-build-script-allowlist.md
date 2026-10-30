# 0002. pnpm with pinned version and build-script allowlist

- **Status:** Accepted
- **Date:** 2026-10-28

## Context

Builds must be reproducible, and dependencies must not run arbitrary code on install.

## Decision

- pnpm, with an exact version in `devEngines.packageManager`. pnpm downloads and runs that version by itself; Corepack is not used.
- The Node.js version is declared in `.nvmrc` and enforced through `devEngines.runtime`.
- Dependency install scripts are blocked unless explicitly approved in `pnpm-workspace.yaml`.

## Alternatives considered

- npm: no install-script allowlist by default.
- Corepack: no longer needed with pnpm 11, and no longer bundled with recent Node.js releases.

## Consequences

- Same tooling on every machine and in CI.
- Running with the wrong Node.js or pnpm version fails instead of silently working.
- Each new dependency with install scripts requires a conscious approval.
- A pinned version ages: pnpm itself is audited in CI like any other dependency (see ADR-0011).
