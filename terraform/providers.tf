# NOTE: kubernetes/helm/kubectl providers below depend on computed values
# from module.eks (endpoint, CA, auth token). This is the standard pattern
# for standing up cluster + addons in one workspace and works fine for
# apply, but is a known rough edge on `terraform destroy` (HashiCorp
# discourages computed values in provider blocks). If you ever split
# cluster and addons into separate Terraform workspaces/states, this
# goes away.

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
  token                  = data.aws_eks_cluster_auth.this.token
}

provider "helm" {
  kubernetes = {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
    token                  = data.aws_eks_cluster_auth.this.token
  }
}

provider "kubectl" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
  token                  = data.aws_eks_cluster_auth.this.token
  load_config_file       = false
}