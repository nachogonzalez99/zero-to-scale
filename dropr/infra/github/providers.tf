# Authenticates with the GITHUB_TOKEN environment variable. Never put the token here.
provider "github" {
  owner = var.github_owner
}

