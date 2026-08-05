# =============================================================================
# VPC
# =============================================================================

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 6.0"

  name = "${var.cluster_name}-vpc"
  cidr = var.vpc_cidr

  azs             = var.availability_zones
  private_subnets = var.private_subnets
  public_subnets  = var.public_subnets

  enable_nat_gateway = true
  single_nat_gateway = true

  enable_dns_hostnames = true
  enable_dns_support   = true

  create_igw = true

  # Manage default resources for better control
  manage_default_network_acl    = true
  default_network_acl_tags      = { Name = "${var.cluster_name}-default-nacl" }
  manage_default_route_table    = true
  default_route_table_tags      = { Name = "${var.cluster_name}-default-rt" }
  manage_default_security_group = true
  default_security_group_tags   = { Name = "${var.cluster_name}-default-sg" }

  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1"
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1"
  }

  tags = local.common_tags
}

# =============================================================================
# EKS CLUSTER
# =============================================================================

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 21.0"

  name               = local.cluster_name
  kubernetes_version = var.cluster_version

  # ---------------------------------------------------------------------------
  # API ENDPOINT ACCESS
  # Public access is restricted to eks_public_access_cidrs (set this in
  # variables.tf / a tfvars file — defaults to 0.0.0.0/0 which is NOT safe
  # to leave as-is). Private access is enabled so in-VPC traffic (nodes,
  # addons) never has to leave through the internet-facing endpoint.
  # ---------------------------------------------------------------------------
  endpoint_public_access       = true
  endpoint_public_access_cidrs = var.eks_public_access_cidrs
  endpoint_private_access      = true

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  create_kms_key                  = true
  kms_key_description             = "EKS cluster ${local.cluster_name} encryption key"
  kms_key_deletion_window_in_days = 7

  enable_cluster_creator_admin_permissions = true

  # ---------------------------------------------------------------------------
  # EKS AUTO MODE
  # Auto Mode manages compute (Karpenter), the CNI dataplane, kube-proxy
  # equivalent networking, and EBS-backed storage for you. Do NOT install
  # vpc-cni, kube-proxy, or aws-ebs-csi-driver as separate addons on top of
  # this — see addons.tf.
  # ---------------------------------------------------------------------------
  compute_config = {
    enabled    = true
    node_pools = ["general-purpose"]
  }

  tags = local.common_tags
}
