# 0020. Identity and access

- **Status:** Accepted
- **Date:** 2026-10-30

## Context

Every account (GitHub, Bitwarden, hosting, observability) was created with the founder's personal identity. If that person is unavailable, the company loses access to everything. And when people join or leave, access must follow without guesswork.

## Decision

- A company account (a dedicated email with 2FA) owns every service and its billing. It is not used day to day: it is the break-glass account. Its recovery codes are kept so that they do not depend on a single person.
- The code lives in a GitHub organization, not a personal account, with at least two owners: the company account and the CTO.
- People work with their own accounts as members. Access is given to teams and roles, not to individuals, with least privilege per environment. Production secrets are seen only by machines.
- Where a service offers "Sign in with GitHub", use it: leaving the organization removes most access at once.
- Joiner, mover and leaver steps follow a checklist backed by the [access inventory](../security/access.md). Leaving includes rotating every secret the person could read.
- Team membership will be managed with OpenTofu, so granting access is a reviewed pull request.

## Alternatives considered

- An identity provider with SSO and SCIM (Google Workspace, Entra, Okta): the mature setup, one account to disable. SSO is a paid feature in most tools; revisit when there is a team and a budget.
- Keeping everything under the founder's personal accounts: free and simple, and a single point of failure.

## Consequences

- Moving the repository to the organization changes the image path to `ghcr.io/<organization>/dropr-api`.
- Offboarding is a checklist, not one switch, until there is SSO.
