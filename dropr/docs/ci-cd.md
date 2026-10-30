# CI/CD

What runs, when, and what it protects. Workflows live in `.github/workflows/`.

## Local

| Hook       | Runs                                                        |
| ---------- | ----------------------------------------------------------- |
| pre-commit | secretlint → oxlint `--fix` → Prettier, on the staged files |
| commit-msg | commitlint                                                  |
| pre-push   | Refuse pushes to `main`, then `pnpm check`                  |

## `ci.yml`

Triggers: pull requests, pushes to `main`, Mondays at 07:00 UTC, and by hand.

| Job   | What it does                                                                                               | Publishes                          |
| ----- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Check | `pnpm check`: oxlint, Prettier, secretlint, knip, tsc, tests with coverage thresholds, contract up to date | —                                  |
| Audit | `pnpm audit --audit-level high`                                                                            | —                                  |
| Image | hadolint → build → image test → Trivy                                                                      | `sha-<commit>` on pushes to `main` |

The weekly run catches new vulnerabilities in dependencies and in the base image with no code change.

## `pull-request.yml`

| Job                  | What it does                                                               |
| -------------------- | -------------------------------------------------------------------------- |
| PR title             | commitlint on the title, which becomes the commit on `main`                |
| API breaking changes | oasdiff against `main`; fails on breaking changes unless the title has `!` |

## Dependabot

| Ecosystem        | Updates                                       | Prefix  |
| ---------------- | --------------------------------------------- | ------- |
| `npm`            | pnpm dependencies, minor and patch grouped    | `build` |
| `github-actions` | Action SHAs and their version comments        | `ci`    |
| `docker`         | The `node:26-slim` digest, never a Node major | `build` |

All with a cooldown of 3 days (14 for npm majors).

## `main` protection

Pull request required, squash only, linear history, branch up to date, no bypass. Required checks: Check, Audit, Image, PR title, API breaking changes. Managed as code in [`dropr/infra/github`](../infra/github/).

## Principles

- Fail as early and as cheaply as possible: hooks, then PR, then `main`.
- The same check locally and in CI: `pnpm check`.
- Build once, publish what was tested. Immutable tags, never `latest`.
- Least privilege per job: only `Image` can write packages.
- Supply chain: actions pinned by SHA, frozen lockfile, cooldowns, image scanning, pinned base image.

## Planned

- Deploy to staging on every merge and to production on every release, with smoke tests.
- `concurrency` for deploys: never cancel a deployment halfway, queue instead.
- Notifications when `main` or the weekly run fails.
