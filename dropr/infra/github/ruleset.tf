locals {
  # Job names as they appear in the checks of a pull request
  required_checks = ["Check", "Audit", "Image", "PR title", "API breaking changes"]
}

# main only changes through a pull request that passes every required check (ADR-0010).
resource "github_repository_ruleset" "main" {
  name        = "main"
  repository  = github_repository.zero_to_scale.name
  target      = "branch"
  enforcement = "active"

  # Nobody bypasses the rules, not even admins
  conditions {
    ref_name {
      include = ["~DEFAULT_BRANCH"]
      exclude = []
    }
  }

  rules {
    deletion                = true
    non_fast_forward        = true
    required_linear_history = true

    pull_request {
      allowed_merge_methods = ["squash"]
      # 0 while there is a single engineer; 1 when the second one joins
      required_approving_review_count   = 0
      dismiss_stale_reviews_on_push     = false
      require_code_owner_review         = false
      require_last_push_approval        = false
      required_review_thread_resolution = false
    }

    required_status_checks {
      # The branch must be up to date with main before merging
      strict_required_status_checks_policy = true

      dynamic "required_check" {
        for_each = local.required_checks
        content {
          context = required_check.value
        }
      }
    }
  }
}
