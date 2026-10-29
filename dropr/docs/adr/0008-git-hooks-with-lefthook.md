# 0008. Git hooks with lefthook

- **Status:** Accepted
- **Date:** 2026-10-29

## Context

Checks that depend on remembering to run them don't get run. Checks that are slow, or that block or alter unrelated work in progress, get skipped.

## Decision

lefthook (`lefthook.yml`) runs:

- **Pre-commit**, on staged files only and in order: secretlint, oxlint `--fix`, Prettier `--write`. Fixed files are re-staged; unfixable errors cancel the commit.
- **Commit-msg**: commitlint with the Conventional Commits preset.
- **Pre-push**: rejects pushes from `main`, then runs the full `pnpm check` on the whole project.

Hooks install automatically on `pnpm install`.

## Alternatives considered

- Husky + lint-staged: most widely known, but two tools and two config files for the same result.
- Full project check in pre-commit: blocks commits because of unrelated files.

## Consequences

- Formatting never blocks a commit; it is fixed automatically. Unstaged changes are preserved untouched.
- Type errors and failing tests can be committed locally, but not pushed.
- Hooks can be skipped with `--no-verify`; CI is the final authority (ADR-0010).
