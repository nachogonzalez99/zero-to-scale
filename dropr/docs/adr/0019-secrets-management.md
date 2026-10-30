# 0019. Secrets management

- **Status:** Accepted
- **Date:** 2026-10-30

## Context

Until now the only secret was CI's ephemeral `GITHUB_TOKEN`. Hosting, OpenTofu and observability bring real ones. We want as few tools as possible, and a clear rule for where each secret lives.

## Decision

- The rule: **does a person need to read it?**
  - No → a GitHub Environment secret (`staging` or `production`). GitHub secrets cannot be read back, only used by workflows.
  - Yes → the Bitwarden organization vault.
- Secrets the API needs at runtime are copied by the deploy job from the GitHub Environment to the hosting platform. GitHub is the source of truth; rotating means changing it there and redeploying.
- Non-secret configuration lives in the repository, as code.
- Prefer no secret at all: ephemeral credentials (`GITHUB_TOKEN`, OIDC with cloud providers) over stored tokens.
- Machine tokens are regenerated, not recovered: no backup copies.
- People use their own credentials, never the application's: their own sandbox keys locally, their own read-only access to staging data, break-glass access to production.
- Every secret is listed in the [inventory](../security/secrets.md): what, where, owner, expiry, how to rotate. Never its value.

## Alternatives considered

- A secrets manager (Bitwarden Secrets Manager, Infisical): one source of truth with sync and audit. Not needed while machines use GitHub and people use Bitwarden; revisit with a team.
- SOPS with age: encrypted secrets in Git; versioned, but key management is harder.
- `.env` files shared between people: copies nobody controls.

## Consequences

- Two tools: GitHub for machines, Bitwarden for people.
- Nobody can check the value of a machine secret; if in doubt, rotate it.
- No "run locally with staging secrets", on purpose.
