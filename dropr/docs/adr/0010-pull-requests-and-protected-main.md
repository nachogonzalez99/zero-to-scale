# 0010. Pull requests and a protected main branch

- **Status:** Accepted
- **Date:** 2026-10-29

## Context

Local hooks can be skipped with `--no-verify`. CI that runs after a direct push to `main` only reports problems; it cannot prevent them.

## Decision

- `main` is protected with a GitHub ruleset: pull request required, no force pushes, no deletions, linear history, squash merge only, empty bypass list.
- Merging requires the `Check`, `Audit`, `PR title` and `API breaking changes` checks to pass, and the branch to be up to date.
- The PR title becomes the commit message on `main`, so it must follow Conventional Commits. A change that breaks the API contract must carry `!`.
- Required approvals: 0 while there is a single engineer.

## Alternatives considered

- Direct pushes to `main` with CI as an alarm: no friction, but broken changes reach `main` before CI reports them.

## Consequences

- CI is the final authority: nothing reaches `main` without passing it.
- A breaking API change never enters by accident, and when it does it is marked on `main`.
- One PR per change, even when working alone.
- Raise required approvals to 1 when a second engineer joins.
