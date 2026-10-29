# 0005. Code-first API with Zod schemas

- **Status:** Accepted
- **Date:** 2026-10-29

## Context

Contract-first (ADR-0004) required `openapi-typescript`, which does not support TypeScript 7. The alternatives were downgrading TypeScript or running the generator with an isolated TypeScript version outside the lockfile. We want docs generated from code, without decorators and without a second source of truth.

## Decision

- Each route declares Zod schemas for its inputs and every response. The same schemas validate requests, type handlers, serialize responses and describe the API.
- The OpenAPI document is generated from the registered routes and committed as `contract/openapi.yaml`.
- Live docs are served at `/docs`.

## Alternatives considered

- Contract-first with TypeScript 6: clean, but not on the latest TypeScript.
- Contract-first with an isolated generator: works, but its versions live outside the lockfile.
- Decorators (NestJS-style): couples docs to annotations on business code.
- TypeSpec: pleasant to write, but its Node.js server generator is still alpha.

## Consequences

- Routes, validation and docs cannot drift apart.
- Designing first is a team rule, not something tooling enforces. Committing the generated contract makes every API change visible in review.
- CI fails if the committed contract is out of date, and checks breaking changes against `main` (ADR-0010).
