variable "aws_region" {
  description = "AWS region where resources will be created"
  type        = string
  default     = "us-west-2"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "habit-tracker"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability Zones"
  type        = list(string)
  default = [
    "us-west-2a",
    "us-west-2b",
    "us-west-2c"
  ]
}

variable "private_subnets" {
  description = "Private subnet CIDRs"
  type        = list(string)

  default = [
    "10.0.1.0/24",
    "10.0.2.0/24",
    "10.0.3.0/24"
  ]
}

variable "public_subnets" {
  description = "Public subnet CIDRs"
  type        = list(string)

  default = [
    "10.0.101.0/24",
    "10.0.102.0/24",
    "10.0.103.0/24"
  ]
}

variable "cluster_name" {
  description = "EKS Cluster Name"
  type        = string
  default     = "habit-tracker"
}

variable "cluster_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.36"
}

# -----------------------------------------------------------------------------
# ACCESS CONTROL
# -----------------------------------------------------------------------------

variable "eks_public_access_cidrs" {
  description = "CIDR blocks allowed to reach the EKS public API endpoint. Restrict this to your own IP(s)/office/VPN range before applying — 0.0.0.0/0 leaves the control plane API open to the entire internet."
  type        = list(string)
  default     = ["0.0.0.0/0"] # TODO: replace with your IP, e.g. ["203.0.113.10/32"]
}

variable "argocd_source_ranges" {
  description = "CIDR blocks allowed to reach the ArgoCD UI load balancer. Restrict this to your own IP(s) — ArgoCD is currently served over plain HTTP (no TLS), so exposing it broadly is a real risk."
  type        = list(string)
  default     = ["0.0.0.0/0"] # TODO: replace with your IP, e.g. ["203.0.113.10/32"]
}
