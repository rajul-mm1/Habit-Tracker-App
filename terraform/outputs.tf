# =============================================================================
# CLUSTER INFORMATION
# =============================================================================

output "cluster_name" {
  description = "EKS Cluster Name"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "EKS Cluster Endpoint"
  value       = module.eks.cluster_endpoint
}

output "cluster_version" {
  description = "EKS Kubernetes Version"
  value       = module.eks.cluster_version
}

output "cluster_oidc_provider_arn" {
  description = "OIDC Provider ARN"
  value       = module.eks.oidc_provider_arn
}

# =============================================================================
# VPC INFORMATION
# =============================================================================

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "public_subnets" {
  description = "Public Subnets"
  value       = module.vpc.public_subnets
}

output "private_subnets" {
  description = "Private Subnets"
  value       = module.vpc.private_subnets
}

# =============================================================================
# ECR REPOSITORIES
# =============================================================================

output "ecr_repository_urls" {
  description = "ECR Repository URLs"

  value = {
    for name, repo in aws_ecr_repository.repositories :
    name => repo.repository_url
  }
}

# =============================================================================
# ARGOCD
# =============================================================================

output "argocd_namespace" {
  description = "ArgoCD Namespace"
  value       = kubernetes_namespace.argocd.metadata[0].name
}

# =============================================================================
# MONITORING
# =============================================================================

output "grafana_admin_password" {
  description = "Grafana admin password (retrieve with: terraform output -raw grafana_admin_password)"
  value       = random_password.grafana_admin.result
  sensitive   = true
}

# =============================================================================
# AWS ACCOUNT
# =============================================================================

output "aws_account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "aws_region" {
  description = "AWS Region"
  value       = var.aws_region
}