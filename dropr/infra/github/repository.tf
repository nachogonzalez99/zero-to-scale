# The repository and how pull requests are merged (ADR-0010).
resource "github_repository" "zero_to_scale" {
  name        = var.repository_name
  description = "Dropr, a delivery startup, built from a one-person company upwards."
  visibility  = var.repository_visibility

  has_issues   = true
  has_projects = false
  has_wiki     = false

  # Squash only: one commit per pull request, titled with the PR title (Conventional Commits)
  allow_squash_merge          = true
  allow_merge_commit          = false
  allow_rebase_merge          = false
  squash_merge_commit_title   = "PR_TITLE"
  squash_merge_commit_message = "PR_BODY"
  allow_update_branch         = true
  delete_branch_on_merge      = true

  # Removing this resource from the code must never delete the repository:
  # OpenTofu refuses to destroy it, and if forced, it archives instead of deleting.
  archive_on_destroy = true

  lifecycle {
    prevent_destroy = true
  }
}

# Dependabot alerts and security update PRs (ADR-0011)
resource "github_repository_vulnerability_alerts" "zero_to_scale" {
  repository = github_repository.zero_to_scale.name
  enabled    = true
}

resource "github_repository_dependabot_security_updates" "zero_to_scale" {
  repository = github_repository.zero_to_scale.name
  enabled    = true

  depends_on = [github_repository_vulnerability_alerts.zero_to_scale]
}
