# 0015. Health probes and graceful shutdown

- **Status:** Accepted
- **Date:** 2026-10-29

## Context

Platforms decide from probes whether to restart a container or route traffic to it, and stop containers with SIGTERM on every deploy. Without probes and an orderly shutdown, deploys drop requests and a dependency outage can turn into restarts everywhere.

## Decision

- `/health/live` answers while the process runs. It checks nothing external, so a dependency outage never triggers restarts.
- `/health/ready` returns `503` once shutdown starts. Dependencies will be checked here, never in liveness.
- Both report version, commit and environment, so tests and smoke tests can check what is running.
- Probes are for the platform: unversioned, hidden from the contract, without API key, not logged per request. A not-ready `503` is a status, not a Problem.
- On SIGTERM or SIGINT: readiness off → keep serving for `SHUTDOWN_DRAIN_MS` → close Fastify, waiting for in-flight requests at most `SHUTDOWN_TIMEOUT_MS` → exit `1` if the timeout is reached.
- Drain plus timeout must stay below the platform's grace period, so we stop ourselves and log it instead of being killed.
- Configuration by environment variables, validated at startup. `APP_ENV` (where it runs) is separate from `NODE_ENV` (how libraries behave).

## Alternatives considered

- One `/health` endpoint: cannot tell "restart me" from "do not route to me".
- Dependencies in liveness: a database outage would restart every container and fix nothing.
- Closing immediately on SIGTERM: requests routed while the platform deregisters the container would fail.

## Consequences

- Drain is `0` by default (no load balancer locally) and is tuned per platform when deploying.
- Probes are out of the contract, so oasdiff does not cover them; the image test and smoke tests do.
- Defaults are for local development. A missing `APP_ENV` in an environment reports `local`, and the smoke test must catch it.
