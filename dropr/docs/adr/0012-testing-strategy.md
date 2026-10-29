# 0012. Testing strategy

- **Status:** Accepted
- **Date:** 2026-10-29

## Context

The API now holds business logic. We need shared definitions of test types, a rule for when to mock, and a coverage policy.

## Decision

- Definitions from Khorikov (_Unit Testing: Principles, Practices, and Patterns_): unit tests verify a unit of behavior, quickly and in isolation from other tests; integration tests involve out-of-process dependencies; end-to-end tests use all real dependencies against a deployed system.
- Classical school: managed dependencies are used for real in integration tests; only unmanaged dependencies are mocked. Internal collaborators are never mocked.
- Most tests target the domain. HTTP tests (`app.inject`) cover the happy path and what the domain does not: validation, errors, serialization.
- Coverage with Vitest and V8 on every run. Thresholds: 100% for `src/modules` (business logic); 95% statements, functions and lines, and 90% branches, for the whole service.

## Alternatives considered

- London school (mock every collaborator): isolates code units, but couples tests to implementation and makes refactoring expensive.
- A single global threshold: lets business logic lose coverage as long as other code compensates.

## Consequences

- Today all tests are unit tests. HTTP tests become integration tests once a route touches a database, without changing the test.
- Untested business logic fails the build.
- Defensive branches in shared code are not forced to 100%.
