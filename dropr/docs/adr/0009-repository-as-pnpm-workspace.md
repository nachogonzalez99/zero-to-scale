# 0009. Repository as a pnpm workspace

- **Status:** Accepted
- **Date:** 2026-10-29

## Context

Tooling installed inside `dropr/api` was invisible from the rest of the repo: the editor could not find oxlint without explicit paths, Prettier did not cover `dropr/docs/`, and Git hooks needed workarounds because Git works from the repo root.

## Decision

The repo root is a pnpm workspace. Anything that applies to every file in the repo lives at the root (Node.js and pnpm versions, editor config, Prettier, oxlint, secretlint, knip, commitlint, Git hooks, CI). Anything specific to a package lives in it (TypeScript config, test runner, service dependencies).

## Alternatives considered

- Everything inside `dropr/api`, with explicit paths in the editor and hooks: works, but every new tool needs a workaround and files outside the package stay unguarded.

## Consequences

- One install and one lockfile for the whole repo.
- New packages inherit formatting, linting, secret scanning, hooks and commit rules without configuration.
- oxlint runs from the root and picks up each package's `tsconfig.json` for type-aware rules.
- Root installs need `-w`; package commands use `--filter`.
