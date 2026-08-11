# =============================================================================
# IAM ROLE FOR EXTERNAL SECRETS
# =============================================================================
# Bound to the external-secrets Helm chart's default ServiceAccount
# (external-secrets:external-secrets) - see terraform/external-secrets.tf,
# which installs the operator and annotates that ServiceAccount with this
# role's ARN so it can call secretsmanager:GetSecretValue via IRSA (no
# static AWS credentials in the cluster).
# =============================================================================

module "external_secrets_irsa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts"
  version = "~> 6.0"

  name = "${local.name}-external-secrets"

  oidc_providers = {
    eks = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["external-secrets:external-secrets"]
    }
  }

  tags = local.common_tags
}

resource "aws_iam_policy" "external_secrets" {
  name = "${local.name}-external-secrets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        # Scoped to this project's own secrets only (see terraform/secrets.tf)
        # rather than "*" - least privilege for a role that any pod in the
        # external-secrets namespace could otherwise use to read every
        # secret in the account.
        Resource = "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:habit-tracker/*"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "external_secrets" {
  role       = module.external_secrets_irsa.name
  policy_arn = aws_iam_policy.external_secrets.arn
}
