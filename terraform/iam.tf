# =============================================================================
# IAM ROLE FOR EXTERNAL SECRETS
# =============================================================================
# NOTE: This IAM role + policy exist but nothing in this project currently
# installs the External Secrets Operator itself (no helm_release / addon
# consumes it yet). Keeping it here on the assumption you're about to wire
# it up — if that's not the plan, delete this block along with the
# aws_iam_policy / aws_iam_role_policy_attachment below.
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
          "secretsmanager:DescribeSecret",
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "external_secrets" {
  role       = module.external_secrets_irsa.name
  policy_arn = aws_iam_policy.external_secrets.arn
}
