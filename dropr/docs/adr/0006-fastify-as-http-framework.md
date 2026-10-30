# 0006. Fastify as HTTP framework

- **Status:** Accepted
- **Date:** 2026-10-29

## Context

We need per-route schemas that drive validation, types and docs from a single definition (ADR-0005).

## Decision

Fastify, with `fastify-type-provider-zod` for Zod integration and `@fastify/swagger` for the OpenAPI document.

## Alternatives considered

- Express: no per-route schema concept; validation, typing and docs would be glue code around it.
- NestJS: decorator-driven and oversized for one service.
- Hono: similar capabilities, less mature ecosystem.

## Consequences

- Validation, typing, serialization and docs from one definition.
- Responses are serialized through their schema: fields not in the schema never leave the API.
- Plugin and hook model to learn, coming from Express.
