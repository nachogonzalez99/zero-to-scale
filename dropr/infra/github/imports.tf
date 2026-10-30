# One-off: adopts what already exists in GitHub instead of creating it again.
# Delete this file after the first apply: the state remembers the link.
import {
  to = github_repository.zero_to_scale
  id = var.repository_name
}

import {
  to = github_repository_vulnerability_alerts.zero_to_scale
  id = var.repository_name
}

import {
  to = github_repository_dependabot_security_updates.zero_to_scale
  id = var.repository_name
}

# The ruleset id: gh api repos/<owner>/<repo>/rulesets --jq '.[] | {id, name}'
import {
  to = github_repository_ruleset.main
  id = "${var.repository_name}:${var.main_ruleset_id}"
}

variable "main_ruleset_id" {
  description = "Id of the existing main ruleset. Only needed for the first import."
  type        = string
}
