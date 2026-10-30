# 0016. Environments and delivery flow

- **Status:** Accepted
- **Date:** 2026-10-30

## Context

The image is built in CI. We need to decide where it runs, how a change reaches each place, and how to go back when a release is bad.

## Decision

- Three environments: **local** (`pnpm dev`, or the image), **staging** and **production**. No shared development environment.
- Trunk-based development: short branches, pull requests into `main`, squash merge. `main` is always releasable. No long-lived environment branches.
- Build once, promote the same image: every merge publishes `sha-<commit>`; staging and production run that exact image.
- Every merge to `main` deploys to staging automatically, then runs a smoke test against it.
- Production is deployed when a release is cut: release-please keeps a release PR with the changelog and the next SemVer version; merging it tags `vX.Y.Z`, the image gets that tag, and the same image is deployed.
- One reusable deploy workflow, with environment and image as inputs, used by CD and by hand.
- Rollback: run the deploy workflow by hand with the previous image. Then fix by `git revert` (the default) or fix-forward, always with a regression test.
- Unfinished work stays behind feature flags; preview environments come later if needed.

## Alternatives considered

- Environment branches (`develop` → `staging` → `main`, Git Flow or GitLab Flow): merges between long-lived branches drift apart, and each environment runs a different build.
- A shared development environment: only pays off with consumers developing against the API, several interdependent services, or previews too expensive to run. None applies yet.
- Deploying to production on every merge: no time to look at staging, and no release notes.

## Consequences

- What reached production was in staging first, byte for byte.
- A broken `main` blocks everyone: CI must stay green.
- Rollback is fast because it does not rebuild anything; data changes (Era 2) must stay compatible with the previous version.
