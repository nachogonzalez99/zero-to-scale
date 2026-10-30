# Dropr Docs

Company-wide documentation. Service-specific docs live in each service's `docs/` folder.

| Doc                                        | What it covers                              |
| ------------------------------------------ | ------------------------------------------- |
| [conventions.md](conventions.md)           | The rules everyone follows                  |
| [environments.md](environments.md)         | Environments and how a change reaches them  |
| [ci-cd.md](ci-cd.md)                       | What runs in CI, when, and what it protects |
| [security/secrets.md](security/secrets.md) | Where secrets live, and their inventory     |
| [security/access.md](security/access.md)   | Accounts, owners, joiners and leavers       |
| [tech-debt.md](tech-debt.md)               | Known shortcuts and when to revisit them    |
| [adr/](adr/)                               | Architecture decisions                      |

## Services and infrastructure

| What                        | Docs                                                                                            |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| [api](../api/README.md)     | [Delivery quotes specification](../api/docs/spec.md) · [Contract](../api/contract/openapi.yaml) |
| [infra](../infra/README.md) | [GitHub as code](../infra/github/README.md)                                                     |

## Architecture decisions

| #    | Decision                                                                                                          | Status             |
| ---- | ----------------------------------------------------------------------------------------------------------------- | ------------------ |
| 0001 | [TypeScript on Node.js 26](adr/0001-typescript-on-nodejs-26.md)                                                   | Accepted           |
| 0002 | [pnpm with pinned version and build-script allowlist](adr/0002-pnpm-pinned-version-and-build-script-allowlist.md) | Accepted           |
| 0003 | [Documentation as code](adr/0003-documentation-as-code.md)                                                        | Accepted           |
| 0004 | [Contract-first API design](adr/0004-contract-first-api-design.md)                                                | Superseded by 0005 |
| 0005 | [Code-first API with Zod schemas](adr/0005-code-first-api-with-zod-schemas.md)                                    | Accepted           |
| 0006 | [Fastify as HTTP framework](adr/0006-fastify-as-http-framework.md)                                                | Accepted           |
| 0007 | [oxlint with type-aware rules, and Prettier](adr/0007-oxlint-and-prettier.md)                                     | Accepted           |
| 0008 | [Git hooks with lefthook](adr/0008-git-hooks-with-lefthook.md)                                                    | Accepted           |
| 0009 | [Repository as a pnpm workspace](adr/0009-repository-as-pnpm-workspace.md)                                        | Accepted           |
| 0010 | [Pull requests and a protected main branch](adr/0010-pull-requests-and-protected-main.md)                         | Accepted           |
| 0011 | [Dependency health in CI](adr/0011-dependency-health-in-ci.md)                                                    | Accepted           |
| 0012 | [Testing strategy](adr/0012-testing-strategy.md)                                                                  | Accepted           |
| 0013 | [Error responses as Problem Details](adr/0013-error-responses-as-problem-details.md)                              | Accepted           |
| 0014 | [Container image](adr/0014-container-image.md)                                                                    | Accepted           |
| 0015 | [Health probes and graceful shutdown](adr/0015-health-probes-and-graceful-shutdown.md)                            | Accepted           |
| 0016 | [Environments and delivery flow](adr/0016-environments-and-delivery-flow.md)                                      | Accepted           |
| 0017 | [Image publishing](adr/0017-image-publishing.md)                                                                  | Accepted           |
| 0018 | [GitHub settings as code](adr/0018-github-settings-as-code.md)                                                    | Accepted           |
| 0019 | [Secrets management](adr/0019-secrets-management.md)                                                              | Accepted           |
| 0020 | [Identity and access](adr/0020-identity-and-access.md)                                                            | Accepted           |
| 0021 | [Hosting](adr/0021-hosting.md)                                                                                    | Proposed           |
