# Conventions

The rules everyone follows. Each one links to the decision behind it.

## Language

- Everything in the repository is written in English: code, comments, docs, commits.

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
- Environment variables are read only in `src/shared/config.ts` and validated at startup.
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

## Code organization

- Business code lives in `src/modules/<module>/`: `<module>.ts` or `<module>.domain.ts` (domain), `<module>.schemas.ts`, `<module>.routes.ts`.
- A module only imports another module's domain file, never its schemas or routes.
- Cross-cutting code lives in `src/shared/`.
- Domain code is pure: it receives the time and other non-deterministic inputs as parameters, and throws `DomainError` with a code. Only routes read the clock or generate ids.
- Zod schemas are named `<Name>Schema`; their `.meta({ id })` is `<Name>`, the name in the contract.

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
