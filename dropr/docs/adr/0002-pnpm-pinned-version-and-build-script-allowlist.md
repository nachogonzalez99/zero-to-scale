# 0004. pnpm with pinned version and build-script allowlist
- **Status:** Accepted
- **Date:** 2026-10-28

## Context
Builds must be reproducible, and dependencies must not run arbitrary code on install.

## Decision
pnpm with an exact version in `packageManager`. Install scripts are blocked unless explicitly approved.

## Alternatives considered
- npm: no install-script allowlist by default.

## Consequences
- Same tooling on every machine and in CI.
- Each new dependency with install scripts requires a conscious approval.