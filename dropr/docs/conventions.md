# Conventions

## Language

Everything in the repository is written in English: code, comments, docs, commits.

## Runtime and tooling

- Node.js version pinned in `.nvmrc`; `engines` enforced with `engine-strict=true`.
- pnpm version pinned exactly in `packageManager`.
- Dependency install scripts are blocked by default; each one is approved explicitly.

## Documentation

- Docs live in the repo as Markdown, next to what they describe.
- Company-wide → `dropr/docs/`. Service-specific → `<service>/docs/`.
- Files are created only when they have real content.
- ADRs: `docs/adr/NNNN-title-in-kebab-case.md`. Numbers are never reused; a changed decision gets a new ADR and the old one is marked as superseded.

## API contract

- The contract lives in `api/contract/openapi.yaml` and is the source of truth.
- Generated code lives in `src/generated/`, is never edited by hand, and is git-ignored.
- Every operation has a camelCase `operationId` (e.g. `createQuote`).
- API paths are versioned and plural (`/v1/quotes`).
- Error codes use `SCREAMING_SNAKE_CASE` (e.g. `ZONE_NOT_COVERED`).
