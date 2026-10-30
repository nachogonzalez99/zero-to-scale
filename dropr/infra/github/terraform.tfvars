github_owner          = "nachogonzalez99"
repository_visibility = "public" # o "private": la que tenga AHORA tu repo

northflank_project_id              = "default" # compruébalo en la URL
northflank_registry_credentials_id = "github"      # o el id, si la imagen es privada

staging = {
  url                   = "https://p01--api-staging--xb9qpj4kq2fy.code.run"
  northflank_service_id = "api-staging"
}
