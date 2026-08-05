# =============================================================================
# EKS BLUEPRINTS ADDONS
# =============================================================================
# NOTE: The cluster runs in EKS Auto Mode (see main.tf). Auto Mode already
# manages the CNI dataplane, kube-proxy-equivalent networking, and EBS-backed
# storage — do NOT install vpc-cni, kube-proxy, or aws-ebs-csi-driver as
# separate addons here, they either conflict with or are redundant next to
# Auto Mode. Only coredns and eks-pod-identity-agent are installed below.
# =============================================================================

module "eks_blueprints_addons" {
  source  = "aws-ia/eks-blueprints-addons/aws"
  version = "~> 1.23"

  cluster_name      = module.eks.cluster_name
  cluster_endpoint  = module.eks.cluster_endpoint
  cluster_version   = module.eks.cluster_version
  oidc_provider_arn = module.eks.oidc_provider_arn

  # ---------------------------------------------------------------------------
  # AWS ADDONS (Auto Mode compatible only)
  # ---------------------------------------------------------------------------

  eks_addons = {
    coredns = {
      most_recent = true
    }

    eks-pod-identity-agent = {
      most_recent = true
    }
  }

  # ---------------------------------------------------------------------------
  # METRICS SERVER
  # ---------------------------------------------------------------------------

  enable_metrics_server = true

  # ---------------------------------------------------------------------------
  # NGINX INGRESS CONTROLLER
  # ---------------------------------------------------------------------------

  enable_ingress_nginx = true

  ingress_nginx = {
    namespace = "ingress-nginx"

    values = [
      yamlencode({
        controller = {
          service = {
            type = "LoadBalancer"
            annotations = {
              "service.beta.kubernetes.io/aws-load-balancer-type"            = "external"
              "service.beta.kubernetes.io/aws-load-balancer-nlb-target-type" = "ip"
              "service.beta.kubernetes.io/aws-load-balancer-scheme"          = "internet-facing"
            }
          }
        }
      })
    ]
  }

  # ---------------------------------------------------------------------------
  # KUBE PROMETHEUS STACK
  # ---------------------------------------------------------------------------

  enable_kube_prometheus_stack = true

  kube_prometheus_stack = {
    namespace = "monitoring"

    values = [
      yamlencode({

        grafana = {
          adminPassword = random_password.grafana_admin.result

          persistence = {
            enabled          = true
            storageClassName = "auto" # EKS Auto Mode's built-in default StorageClass
            size             = "10Gi"
          }
        }

        prometheus = {
          prometheusSpec = {
            retention = "15d"

            storageSpec = {
              volumeClaimTemplate = {
                spec = {
                  storageClassName = "auto"
                  accessModes      = ["ReadWriteOnce"]
                  resources = {
                    requests = { storage = "50Gi" }
                  }
                }
              }
            }
          }
        }

      })
    ]
  }

  tags = local.common_tags

  depends_on = [module.eks]
}

# =============================================================================
# GRAFANA ADMIN PASSWORD
# Generated instead of hardcoded. Read it back with:
#   terraform output -raw grafana_admin_password
# =============================================================================

resource "random_password" "grafana_admin" {
  length  = 20
  special = true
}
