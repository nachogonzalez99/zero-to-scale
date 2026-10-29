# 0004. Contract-first API design

- **Status:** Accepted
- **Date:** 2026-10-28

## Context

The API is a promise to consumers. It must be designed before it's built, shareable before code exists, and never drift from the implementation.

## Decision

- An OpenAPI 3.1 document is the source of truth: `api/contract/openapi.yaml`.
- TypeScript types are generated from it.
- Request and response validation use the contract's schemas at runtime.
- Human-readable docs are generated from it.
- Generated files are not committed; they are regenerated on every build and test run.

## Alternatives considered

- Code-first: less friction, but the contract changes as a side effect of code changes.
- Full server generation: faster to add endpoints, but couples us to a generator before choosing a framework.
- TypeSpec / Smithy: more expressive, oversized for a single API.

## Consequences

- Any API change starts with a contract change.
- The contract is linted; a broken contract fails the build.
- How the contract is wired into routes depends on the HTTP framework (pending decision).
- Breaking-change detection will be added with CI.
