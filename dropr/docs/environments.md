# Environments and delivery

How a change travels from a laptop to production. The decision is [ADR-0016](adr/0016-environments-and-delivery-flow.md).

| Environment | Runs                          | Deployed                     | Purpose                                 |
| ----------- | ----------------------------- | ---------------------------- | --------------------------------------- |
| local       | `pnpm dev`, or the image      | By you                       | Develop and debug                       |
| staging     | The image of the last merge   | Automatically on every merge | Check a real environment before release |
| production  | The image of the last release | When a release PR is merged  | Customers                               |

## Flow

```
branch ──PR──► CI checks ──squash merge──► main
                                            │
                                            ├─ CI builds, tests and publishes sha-<commit>
                                            ├─ deploy staging + smoke test         (planned)
                                            └─ release-please updates the release PR
                                                       │ merge
                                                       ▼
                                            tag vX.Y.Z → same image → deploy production + smoke test (planned)
```

## Rules

- `main` is always releasable. Unfinished work is behind a feature flag.
- The same image goes everywhere. Only configuration changes between environments.
- Every deployment is followed by a smoke test against that environment.
- Rollback: run the deploy workflow by hand with the previous image. Then fix with `git revert` by default, or fix-forward when the fix is trivial, always with a regression test.

## What is tested where

| Test        | Runs against                                | Where                  |
| ----------- | ------------------------------------------- | ---------------------- |
| Unit        | Code, in process                            | Pre-push and CI        |
| Integration | Code with real managed dependencies (Era 2) | CI                     |
| Image test  | The built image                             | CI                     |
| Smoke test  | A deployed environment                      | After every deployment |
| End-to-end  | The whole deployed system                   | Later                  |
