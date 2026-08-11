# =============================================================================
# APP SECRETS (AWS Secrets Manager)
# =============================================================================
# These are the source of truth for the app's runtime secrets. Terraform
# generates random values here; the actual value is never typed by a human
# and never committed to Git. External Secrets Operator (terraform/external-
# secrets.tf) reads these into Kubernetes Secrets at deploy time - see the
# ExternalSecret resources in each service's Helm chart
# (services/backend/chart/templates/external-secret.yaml, etc).
#
# To rotate a secret: taint + re-apply the relevant random_password
# resource, e.g.:
#   terraform taint random_password.jwt_secret
#   terraform apply
# ESO's default 1h refreshInterval (see each chart's values.yaml) will pick
# up the new value automatically - no pod restart wiring needed beyond that.
# =============================================================================

resource "random_password" "jwt_secret" {
  length  = 48
  special = false # kept alphanumeric - this value flows through JSON/YAML and env vars in several places
}

resource "random_password" "internal_secret" {
  length  = 48
  special = false
}

resource "random_password" "mongodb_root_password" {
  length  = 32
  special = false # avoid characters that need escaping in a Mongo connection URI
}

# ── backend + cron-checker share this secret ────────────────────────────────
# JWT_SECRET is only used by backend. INTERNAL_SECRET is used by BOTH
# (cron-checker authenticates to backend's internal endpoint with it) -
# storing both in one Secrets Manager entry guarantees they can never drift
# out of sync between the two charts' ExternalSecrets.
resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "habit-tracker/app-secrets"
  description             = "JWT_SECRET + INTERNAL_SECRET shared by the backend and cron-checker services"
  recovery_window_in_days = 0 # allows immediate re-creation on `terraform destroy` + `apply` in a demo/showcase account; raise this for a real production account

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id

  secret_string = jsonencode({
    JWT_SECRET      = random_password.jwt_secret.result
    INTERNAL_SECRET = random_password.internal_secret.result
  })
}

# ── mongodb root credentials ────────────────────────────────────────────────
resource "aws_secretsmanager_secret" "mongodb" {
  name                    = "habit-tracker/mongodb"
  description             = "MongoDB root credentials (only consumed when infra/mongodb/chart's auth.enabled = true)"
  recovery_window_in_days = 0

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "mongodb" {
  secret_id = aws_secretsmanager_secret.mongodb.id

  secret_string = jsonencode({
    MONGO_INITDB_ROOT_USERNAME = "root"
    MONGO_INITDB_ROOT_PASSWORD = random_password.mongodb_root_password.result
  })
}
