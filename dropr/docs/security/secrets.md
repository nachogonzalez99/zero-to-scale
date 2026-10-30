# Secrets

How secrets are handled, and the inventory of every secret Dropr has. The decision is [ADR-0019](../adr/0019-secrets-management.md).

**Values never appear in this repository.** This page says where a secret lives, never what it is.

## Where a secret lives

Ask: **does a person need to read it?**

| Answer       | Where                                               | Examples                                                       |
| ------------ | --------------------------------------------------- | -------------------------------------------------------------- |
| No           | GitHub Environment secret (`staging`, `production`) | Hosting deploy token, telemetry key, database password         |
| Yes          | Bitwarden organization vault                        | Account credentials, 2FA recovery codes, personal sandbox keys |
| Not a secret | The repository, as code                             | `APP_ENV`, `LOG_LEVEL`, shutdown timings                       |

Runtime secrets flow one way: GitHub Environment → deploy job → hosting platform → environment variable of the API.

## Rules

- Prefer no secret: ephemeral credentials (`GITHUB_TOKEN`, OIDC) over stored tokens.
- Never in Git, images or logs. secretlint runs on every commit and in CI.
- One secret per environment: a staging token never works in production.
- Least privilege: each token can do only its job.
- Machine tokens are regenerated, not recovered. No backup copies.
- People use their own credentials, never the application's.
- Every token has an expiry. Rotate before it, and immediately when someone with access leaves.
- If a secret may have leaked: revoke first, then investigate.

## Rotating a machine secret

1. Create the new token in the issuing service.
2. Replace the value in the GitHub Environment.
3. Redeploy the environment.
4. Revoke the old token.
5. Update the expiry in the inventory.

## Inventory

| Secret              | Purpose                               | Lives in                     | Used by          | Owner | Expiry  |
| ------------------- | ------------------------------------- | ---------------------------- | ---------------- | ----- | ------- |
| `GITHUB_TOKEN`      | CI: read code, publish images to GHCR | Created by GitHub per run    | CI               | —     | Per run |
| Push token          | Push code from the CTO's laptop       | Bitwarden (CTO, personal)    | CTO              | CTO   | 90 days |
| OpenTofu token      | Apply `dropr/infra/github`            | Bitwarden (CTO, personal)    | CTO              | CTO   | 90 days |
| Break-glass account | Owner of every service                | Bitwarden organization vault | Emergencies only | CTO   | —       |

Planned: hosting deploy tokens (one per environment, GitHub Environment secrets) and the telemetry key (GitHub Environment, copied to hosting at deploy).
