# 0013. Error responses as Problem Details

- **Status:** Accepted
- **Date:** 2026-10-29

## Context

Errors reached clients in two shapes: our own for domain errors, Fastify's default for validation errors. Clients need one format, with a stable identifier they can branch on, and no internal details.

## Decision

- Every error is an RFC 9457 Problem, sent as `application/problem+json`, through one central error handler.
- `type` is always `about:blank` and `title` is the HTTP status phrase. A `code` extension (`SCREAMING_SNAKE_CASE`) identifies the error; `detail` explains this occurrence.
- Validation errors (`400 VALIDATION_ERROR`) list every invalid field in `errors`, with paths like `body.pickup.lat`.
- Domain code throws `DomainError` with a code; the HTTP layer maps codes to statuses (`422` for business rules, `404` for missing resources).
- Unexpected errors return `500 INTERNAL_ERROR` with a generic message; the details are logged, never sent.

## Alternatives considered

- Problem type URIs per error: more aligned with the RFC, but they would need a published page per error. `code` gives clients the same information.
- Framework default errors: inconsistent shape and leaks framework internals.

## Consequences

- Clients handle errors by `code`, never by parsing messages.
- Adding an error code is a contract change and must be documented.
- `requestId` correlation will be added with observability.
