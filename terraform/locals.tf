# =============================================================================
# DATA SOURCES
# =============================================================================

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

data "aws_eks_cluster_auth" "this" {
  name = module.eks.cluster_name
}

# =============================================================================
# RANDOM SUFFIX
# =============================================================================

resource "random_string" "suffix" {
  length  = 4
  upper   = false
  special = false
}

# =============================================================================
# LOCAL VALUES
# =============================================================================

locals {
  name = "${var.project_name}-${random_string.suffix.result}"

  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Owner       = "Rajul Mewade"
  }

  cluster_name = "${var.cluster_name}-${random_string.suffix.result}"
}