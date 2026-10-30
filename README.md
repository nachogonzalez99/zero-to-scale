# Zero to Scale

Dropr, a delivery startup, built from a one-person company upwards. This repo holds the company's code and documentation (`dropr/`), the course material (`course/`, in Spanish) and the course tooling (`lab/`).

## Requirements

- Node.js 26 (`nvm use` reads `.nvmrc`)
- pnpm: any recent version. It switches to the version pinned in `package.json` by itself.
- Docker: only to build and run the container image. Day-to-day work uses `pnpm dev`.
- OpenTofu 1.13+: only to change infrastructure in `dropr/infra/`.

## Setup

```bash
nvm use
pnpm install
```

`pnpm install` also installs the Git hooks.

## Daily commands

| Where       | Command       | What it does                                               |
| ----------- | ------------- | ---------------------------------------------------------- |
| Root        | `pnpm format` | Fixes lint issues that can be fixed and formats everything |
| Root        | `pnpm check`  | Everything CI checks. Runs on every push                   |
| `dropr/api` | `pnpm dev`    | Starts the API with reload on save, on port 3000           |

The API docs are served at http://localhost:3000/docs while `pnpm dev` runs.

## Workflow

1. `git switch main && git pull`
2. `git switch -c type/short-description`
3. Commit with [Conventional Commits](https://www.conventionalcommits.org/) messages.
4. Push and open a pull request. CI must pass; the PR is squash-merged.

Details in [dropr/docs/conventions.md](dropr/docs/conventions.md).

## Layout

```
zero-to-scale/
├─ dropr/
│  ├─ docs/   company-wide documentation: conventions, ADRs, security, tech debt
│  ├─ api/    the API service
│  └─ infra/  infrastructure as code (OpenTofu)
├─ course/    the course, era by era (Spanish; not part of Dropr)
└─ lab/       course tooling (not part of Dropr)
```
