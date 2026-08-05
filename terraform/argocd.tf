# =============================================================================
# ARGOCD NAMESPACE
# =============================================================================

resource "kubernetes_namespace" "argocd" {
  metadata {
    name = "argocd"
  }

  depends_on = [
    module.eks
  ]
}

# =============================================================================
# ARGOCD INSTALLATION
# =============================================================================
# SECURITY NOTE: server.insecure = true means ArgoCD serves plain HTTP with
# no TLS. That's fine for a private/internal endpoint, but this LoadBalancer
# is internet-facing by default. loadBalancerSourceRanges below restricts who
# can even reach it — set argocd_source_ranges to your own IP(s) in
# variables.tf / tfvars. Once you have a domain, the better long-term fix is
# to drop this LoadBalancer entirely, put ArgoCD behind the ingress-nginx
# controller (already installed in addons.tf) with a proper TLS cert via
# cert-manager, and remove server.insecure.
# =============================================================================

resource "helm_release" "argocd" {
  name             = "argocd"
  repository       = "https://argoproj.github.io/argo-helm"
  chart            = "argo-cd"
  namespace        = kubernetes_namespace.argocd.metadata[0].name
  create_namespace = false

  version = "8.3.1"

  values = [
    yamlencode({

      configs = {
        params = {
          "server.insecure" = true
        }
      }

      server = {
        service = {
          type = "LoadBalancer"
          annotations = {
            "service.beta.kubernetes.io/aws-load-balancer-type"            = "external"
            "service.beta.kubernetes.io/aws-load-balancer-nlb-target-type" = "ip"
            "service.beta.kubernetes.io/aws-load-balancer-scheme"          = "internet-facing"
          }
        }
        # Restricts who can reach the ArgoCD UI/API at the load balancer level.
        loadBalancerSourceRanges = var.argocd_source_ranges
      }

      controller = {
        replicas = 1
      }

      repoServer = {
        replicas = 1
      }

      applicationSet = {
        replicaCount = 1
      }

      redis = {
        enabled = true
      }

    })
  ]

  depends_on = [
    module.eks,
    module.eks_blueprints_addons
  ]
}
