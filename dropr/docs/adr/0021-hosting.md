# 0021. Hosting

- **Status:** Proposed
- **Date:** 2026-10-30

## Context

Staging and production must be always on (observability and SLOs make no sense for a service that sleeps), at no cost, in Europe, deploying an existing image by tag, with HTTP probes, SIGTERM and a configurable grace period, driven from CI. Traffic will be almost zero.

## Decision

- Northflank, Sandbox plan: two always-on services (staging and production), external registry images, liveness and readiness probes, API and CLI, European regions.
- Database for Era 2: Neon, one project per environment.
- AWS (ECS Fargate with OpenTofu) is a dated mission, done within the free credits, not the permanent home.

## Alternatives considered

- Fly.io: the best fit technically, about 2 USD per month per environment; no free tier since October 2024.
- Render free: sleeps after 15 minutes without traffic.
- Koyeb: free tier closed to new users after its acquisition in 2026.
- Cloud Run, Azure Container Apps: scale to zero.
- Oracle Cloud Always Free: a VM to administer, and idle instances are reclaimed.
- AWS free plan: up to 200 USD in credits for at most 6 months, then the account is suspended; the target architecture costs around 50 USD per month.

## Consequences

- Exactly two services fit: the Lab traffic generator must run elsewhere.
- No SLA from the provider: our SLOs cannot promise more than it gives.
- Neon suspends after 5 minutes idle; cold starts will show in latency.
- Only the deploy step and provider config are provider-specific; moving later changes CD, not the image or the app.
