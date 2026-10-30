# GitHub as code

The repository settings, the `main` ruleset, Dependabot alerts and the deployment environments, managed with OpenTofu ([ADR-0018](../../docs/adr/0018-github-settings-as-code.md)).

| File               | Manages                                                           |
| ------------------ | ----------------------------------------------------------------- |
| `repository.tf`    | Repository settings, merge methods, Dependabot alerts and updates |
| `ruleset.tf`       | `main` protection and the required checks                         |
| `environments.tf`  | `staging` and `production`                                        |
| `imports.tf`       | One-off: adopts existing resources. Deleted after the first apply |
| `terraform.tfvars` | Owner and visibility. Not secret, committed                       |

## Requirements

- OpenTofu 1.13 or later: `brew install opentofu`
- A fine-grained personal access token, only for this: repository access to this repo only; permissions **Administration**, **Environments** (read and write) and **Metadata** (read). 90-day expiry. Stored in the password manager ([secrets](../../docs/security/secrets.md)).

## Daily use

```bash
cd dropr/infra/github
export GITHUB_TOKEN=<token>     # only in this terminal, never in a file
tofu plan                       # read it: what would change, and why
tofu apply                      # applies exactly what the plan showed
```

Rules:

- Every change goes through a pull request, like code. Apply after merging, from `main`.
- `tofu plan` with no changes is the normal state. A change nobody made in code is drift: someone changed GitHub by hand. Either bring it into the code or let `apply` revert it.
- State is local (`terraform.tfstate`, never committed). If it is lost, import again with `imports.tf`.

## First time: adopting what already exists

1. `cp terraform.tfvars.example terraform.tfvars` and fill it in. Check `repository_visibility`: a wrong value would change the repository's visibility.
2. Get the ruleset id: `gh api repos/<owner>/zero-to-scale/rulesets --jq '.[] | {id, name}'`
3. `tofu init`, then `tofu providers lock -platform=darwin_arm64 -platform=linux_amd64`. Commit `.terraform.lock.hcl`.
4. `tofu plan -var main_ruleset_id=<id>`
   - Expected: 4 to import (repository, alerts, security updates, ruleset), 2 to add (the environments), and as few changes as possible.
   - Every `~ update` is a difference between the code and GitHub. Decide each one: if GitHub is right, change the code; if the code is right, let it apply.
   - A required check created in the UI may carry `integration_id` (GitHub Actions). If the plan wants to remove it, it is harmless either way.
5. `tofu apply -var main_ruleset_id=<id>`
6. `tofu plan` → `No changes.` Delete `imports.tf`, commit, open the PR.
