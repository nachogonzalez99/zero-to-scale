# 0017. Image publishing

- **Status:** Accepted
- **Date:** 2026-10-30

## Context

To deploy the same artifact everywhere, CI must build it once, prove it works and store it where every environment can pull it.

## Decision

- Registry: GitHub Container Registry, `ghcr.io/<owner>/dropr-api`. CI publishes with the workflow's `GITHUB_TOKEN`; no stored credential.
- Tags: `sha-<short commit>`, immutable, the one that is deployed. Release versions (`vX.Y.Z`) will point at the same image. No `latest`: a moving tag cannot be deployed or rolled back to.
- The `Image` job, a required check, runs on every PR, on `main` and weekly: hadolint (failure threshold `info`) → build for `linux/amd64` with the GitHub Actions layer cache → image test → Trivy scan.
- The image test checks the artifact, not an environment: it starts, `/health/ready` reports the commit it was built from, it serves `/v1/zones`, and it exits `0` on SIGTERM.
- Trivy fails on HIGH or CRITICAL vulnerabilities that have a fix, the same bar as `pnpm audit`.
- Only pushes to `main` publish, and they publish the tested image itself (`docker tag` + `docker push`), not a rebuild.
- OCI labels (source, revision, created) come from `docker/metadata-action`.
- Every GitHub Action is pinned to a full commit SHA with the version in a comment. Dependabot updates them.

## Alternatives considered

- Docker Hub: another account and stored credentials.
- Rebuilding for the push: the published bytes might not be the tested ones.
- Pinning actions by tag: in March 2026 attackers force-pushed 76 of 77 `trivy-action` tags to a credential stealer. A commit SHA cannot be moved.
- Failing on unfixed vulnerabilities: blocks on what nobody can fix yet; the weekly run catches the fix.

## Consequences

- A broken Dockerfile, a missing runtime dependency or broken signal handling fails the PR, before any environment.
- The first scan found 6 HIGH vulnerabilities, all in the npm bundled with the base image; removing npm fixed them.
- Published images accumulate: a retention policy is needed before it matters.
- The image is private by default; how hosting pulls it is decided with the provider.
