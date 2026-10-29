# 0011. Dependency health in CI

- **Status:** Accepted
- **Date:** 2026-10-29

## Context

Most of the code Dropr runs is third-party. Vulnerabilities and malicious releases appear independently of our own changes.

## Decision

- `pnpm audit --audit-level high` runs as a required CI check on every PR, on `main` and weekly.
- Dependabot opens weekly update PRs: minor and patch grouped, majors one by one, with a 3-day cooldown (14 for majors). GitHub Actions are updated too.
- Dependabot alerts and security updates are enabled.

## Alternatives considered

- Renovate: more configurable, but needs an app installation; Dependabot is built into GitHub.
- Blocking on moderate vulnerabilities: too noisy; it would push towards ignoring advisories in bulk.

## Consequences

- No high or critical known vulnerability can be merged. The first run found three in the pinned pnpm version.
- A new advisory can block unrelated PRs until it is fixed or explicitly ignored.
- Known pnpm 11 issue: transitive dependencies newer than `minimumReleaseAge` can fail Dependabot PRs.
