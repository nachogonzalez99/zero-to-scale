variable "github_owner" {
  description = "User or organization that owns the repository."
  type        = string
}

variable "repository_name" {
  description = "Name of the repository."
  type        = string
  default     = "zero-to-scale"
}

variable "repository_visibility" {
  description = "public or private. No default: changing it is a decision, never an accident."
  type        = string

  validation {
    condition     = contains(["public", "private"], var.repository_visibility)
    error_message = "repository_visibility must be public or private."
  }
}
