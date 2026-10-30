# Deployment targets (ADR-0016). Their secrets are set by hand, never in code (ADR-0019).
# Only the protected default branch can deploy: nothing reaches an environment without a merge.
resource "github_repository_environment" "staging" {
  repository  = github_repository.zero_to_scale.name
  environment = "staging"

  deployment_branch_policy {
    protected_branches     = true
    custom_branch_policies = false
  }
}

resource "github_repository_environment" "production" {
  repository  = github_repository.zero_to_scale.name
  environment = "production"

  deployment_branch_policy {
    protected_branches     = true
    custom_branch_policies = false
  }
}
