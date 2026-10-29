# 0001. TypeScript on Node.js 26
- **Status:** Accepted
- **Date:** 2026-10-28

## Context
First service, one engineer, must stay maintainable as the team grows.

## Decision
TypeScript in strict mode on Node.js 26, which entered LTS on 2026-10-28 (supported until April 2029).

## Alternatives considered
- Node.js 24: most battle-tested, but support ends a year earlier.
- Plain JavaScript: faster start, no type safety against the contract.

## Consequences
- Longest support window available.
- Some libraries may lag behind the newest LTS.