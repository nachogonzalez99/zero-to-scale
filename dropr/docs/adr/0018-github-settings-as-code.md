# 0018. GitHub settings as code

- **Status:** Accepted
- **Date:** 2026-10-30

## Context

The ruleset, the required checks, the merge settings and soon the environments were configured by hand. Nothing recorded who changed what, and moving to another account would mean repeating every click from memory.

## Decision

- Infrastructure is code, with OpenTofu, in `dropr/infra/<system>/`. GitHub is the first system: repository settings, Dependabot alerts and updates, the `main` ruleset and the `staging` and `production` environments.
- Existing resources are adopted with `import` blocks, never recreated.
- The repository has `prevent_destroy` and `archive_on_destroy`: deleting the code can never delete the repository.
- Changes go through pull requests; `tofu apply` runs after merging, from `main`, by hand.
- State is local and never committed until there is a remote backend.
- `.terraform.lock.hcl` is committed, locked for macOS and Linux.
- Secret values are never in the code: OpenTofu creates the environments, values are set separately.

## Alternatives considered

- Terraform: same language and providers, but no longer open source. OpenTofu can move to it, and adds state encryption.
- Pulumi: TypeScript like the API, but a smaller community, and real code invites logic that makes it harder to see what will be created.
- Scripts with `gh api`: imperative, no plan, no drift detection.

## Consequences

- `tofu plan` shows drift: any manual change in GitHub appears as a difference.
- The same tool and workflow will manage hosting, observability and AWS.
- Local state lives on one machine: losing it means importing again. A remote, encrypted backend is needed once there are secrets in state or more than one person applying.
- The token that runs OpenTofu belongs to a person; automation that must outlive a person needs a GitHub App.
