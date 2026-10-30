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

# What the deploy workflow reads as vars.* in staging. Not secrets: those are set by hand.
resource "github_actions_environment_variable" "staging" {
  for_each = merge(
    {
      APP_URL               = var.staging.url
      NORTHFLANK_PROJECT_ID = var.northflank_project_id
      NORTHFLANK_SERVICE_ID = var.staging.northflank_service_id
    },
    var.northflank_registry_credentials_id == "" ? {} : {
      NORTHFLANK_REGISTRY_CREDENTIALS_ID = var.northflank_registry_credentials_id
    },
  )

  repository    = github_repository.zero_to_scale.name
  environment   = github_repository_environment.staging.environment
  variable_name = each.key
  value         = each.value
}
