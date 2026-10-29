# 0007. oxlint with type-aware rules, and Prettier

- **Status:** Accepted
- **Date:** 2026-10-29

## Context

We want consistent style and common bugs caught automatically, including type-aware rules (unsafe `any`, unhandled promises), on TypeScript 7.

## Decision

- oxlint with `oxlint-tsgolint` for linting, with type-aware rules enabled in `.oxlintrc.json` (`options.typeAware`). Config at the repo root.
- Prettier for formatting: single quotes, trailing commas, 100-column lines.

## Alternatives considered

- ESLint + typescript-eslint: the reference for type-aware rules, but does not support TypeScript 7.
- Biome: one tool for lint and format, but fewer type-aware rules.

## Consequences

- Strict rules on `any`, promises and exhaustiveness from day one, also in tests.
- Environment variables can only be read in the config module.
- Two tools (linter and formatter) instead of one.
