# Conventions

The rules everyone follows. Each one links to the decision behind it.

## Language

- Everything in the repository is written in English: code, comments, docs, commits. The only exception is `course/`, the course material, written in Spanish and not part of Dropr.

## Repository and tooling

- The repo is a pnpm workspace. Repo-wide tooling lives at the root; package-specific tooling lives in each package ([ADR-0009](adr/0009-repository-as-pnpm-workspace.md)).
- Node.js version in `.nvmrc`, enforced by `devEngines.runtime`. pnpm version pinned exactly in `devEngines.packageManager` ([ADR-0002](adr/0002-pnpm-pinned-version-and-build-script-allowlist.md)).
- TypeScript at the latest version, run directly by Node.js: only erasable syntax, imports with the `.ts` extension ([ADR-0001](adr/0001-typescript-on-nodejs-26.md)).
- Dependency install scripts are blocked by default; each one is approved explicitly in `pnpm-workspace.yaml`.
- `pnpm-lock.yaml` is always committed and never edited by hand.
- Tool update notices are ignored: versions change only through a deliberate dependency update.
- JSON config files reference the schema shipped in `node_modules`, never a remote URL.
- Disabled lint rules always carry a comment explaining why.

## Code quality

- Prettier formats and oxlint (type-aware) lints. Both run on save, on commit and in CI ([ADR-0007](adr/0007-oxlint-and-prettier.md), [ADR-0008](adr/0008-git-hooks-with-lefthook.md)).
- `pnpm check` from the root must pass before pushing. Daily commands: `pnpm format` and `pnpm check` from the root; `pnpm dev` from the package.
- Configuration comes only from environment variables, read in `src/shared/config.ts` and validated at startup. `APP_ENV` says where the app runs; `NODE_ENV` only says how libraries behave ([ADR-0015](adr/0015-health-probes-and-graceful-shutdown.md)).
- Functions are `async` only when they `await`.

## Git

- `main` is protected. Every change goes through a pull request from a branch named `type/short-description` ([ADR-0010](adr/0010-pull-requests-and-protected-main.md)).
- Commit messages and PR titles follow Conventional Commits: `type(scope)!: description`. Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`. Description in lowercase imperative, no trailing period.
- Pull requests are squash-merged; the PR title becomes the commit on `main`.
- Never commit on `main` locally.

## API

- Routes are code-first: each route declares Zod schemas for its inputs and every response. The same schemas validate, type, serialize and document ([ADR-0005](adr/0005-code-first-api-with-zod-schemas.md)).
- `contract/openapi.yaml` is generated with `pnpm contract` and committed. Never edit it by hand.
- Paths are versioned and plural (`/v1/quotes`). Every route has a camelCase `operationId` and a `tags` entry with its module.
- Every response is documented with its own description (`jsonResponse`, `problemResponse`).
- Input schemas reject unknown fields (`z.strictObject`).
- Errors are RFC 9457 problems (`application/problem+json`) with a stable `code` in `SCREAMING_SNAKE_CASE` ([ADR-0013](adr/0013-error-responses-as-problem-details.md)).
- A change that breaks the contract must be declared with `!` in the PR title.
- Amounts are integer cents; distances are integer meters; times leave the API in UTC.
- Health probes (`/health/live`, `/health/ready`) are the exception: unversioned, out of the contract, no API key, not logged per request, and a not-ready `503` is a status, not a Problem. Liveness never checks dependencies.

## Code organization

- Business code lives in `src/modules/<module>/`: `<module>.ts` or `<module>.domain.ts` (domain), `<module>.schemas.ts`, `<module>.routes.ts`.
- A module only imports another module's domain file, never its schemas or routes.
- Cross-cutting code lives in `src/shared/`.
- Domain code is pure: it receives the time and other non-deterministic inputs as parameters, and throws `DomainError` with a code. Only routes read the clock or generate ids.
- Zod schemas are named `<Name>Schema`; their `.meta({ id })` is `<Name>`, the name in the contract.

## Containers and delivery

- One image per service, built from the repository root. What ships is the package's `files` allowlist ([ADR-0014](adr/0014-container-image.md)).
- Base images pinned by digest; the runtime runs as a numeric non-root user.
- Images are tagged `sha-<commit>` and never `latest`. The tested image is the published one ([ADR-0017](adr/0017-image-publishing.md)).
- Production dependencies go in `dependencies`, everything else in `devDependencies`: the image installs only the first.
- Every GitHub Action is pinned to a full commit SHA with its version in a comment.
- The same image goes to every environment; only configuration changes ([ADR-0016](adr/0016-environments-and-delivery-flow.md)).

## Infrastructure

- Infrastructure is code, with OpenTofu, in `dropr/infra/<system>/` ([ADR-0018](adr/0018-github-settings-as-code.md)).
- Changes go through a pull request; `tofu apply` runs after merging. Never change by hand what is managed in code.
- State is never committed. `.terraform.lock.hcl` always is.
- Resources that hold data or history (the repository, databases) carry `prevent_destroy`.

## Security

- Machine secrets live in GitHub Environments; secrets people need to read live in Bitwarden; values never appear in the repo ([ADR-0019](adr/0019-secrets-management.md)).
- Every secret and every account is listed in [security/](security/), without values.
- The company account owns every service; people use their own accounts ([ADR-0020](adr/0020-identity-and-access.md)).

## Testing

- Definitions and the mocking rule follow Khorikov's classical school ([ADR-0012](adr/0012-testing-strategy.md)).
- Tests live in `test/`, named `<module>.domain.test.ts` and `<module>.http.test.ts`. HTTP tests use `app.inject`, never a real port.
- Every example and edge case in a spec is a test.
- Coverage thresholds: 100% for `src/modules`, 95% statements/functions/lines and 90% branches for the service.

## Documentation

- Docs live in the repo as Markdown, next to what they describe ([ADR-0003](adr/0003-documentation-as-code.md)).
- Company-wide → `dropr/docs/`. Service-specific → `<service>/docs/`.
- Files are created only when they have real content.
- ADRs: `docs/adr/NNNN-title-in-kebab-case.md`. Numbers are never reused; a changed decision gets a new ADR and the old one is marked as superseded.
- Documentation changes go in the same pull request as the change they describe.
