# =============================================================================
# EXTERNAL SECRETS OPERATOR
# =============================================================================
# Reads secrets from AWS Secrets Manager (terraform/secrets.tf) into native
# Kubernetes Secrets via IRSA (module.external_secrets_irsa in iam.tf) - no
# static AWS credentials anywhere in the cluster, and the actual secret
# values never pass through Git or Helm values files.
#
# The ClusterSecretStore that points ESO at this AWS account/region is
# deployed via GitOps instead of here, to stay consistent with how every
# other cluster-facing config in this repo is managed - see
# infra/external-secrets-store/chart + argocd/applications/external-secrets-store.yml.
# =============================================================================

resource "kubernetes_namespace" "external_secrets" {
  metadata {
    name = "external-secrets"
  }

  depends_on = [
    module.eks
  ]
}

resource "helm_release" "external_secrets" {
  name             = "external-secrets"
  repository       = "https://charts.external-secrets.io"
  chart            = "external-secrets"
  namespace        = kubernetes_namespace.external_secrets.metadata[0].name
  create_namespace = false

  version = "0.10.4"

  values = [
    yamlencode({

      installCRDs = true

      serviceAccount = {
        create = true
        name   = "external-secrets"
        annotations = {
          "eks.amazonaws.com/role-arn" = module.external_secrets_irsa.arn
        }
      }

    })
  ]

  depends_on = [
    module.eks,
    module.eks_blueprints_addons,
    module.external_secrets_irsa
  ]
}
