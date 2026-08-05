# =============================================================================
# AMAZON ECR REPOSITORIES
# =============================================================================

locals {
  ecr_repositories = [
    "backend",
    "frontend",
    "notification-service",
    "cron-checker"
  ]
}

resource "aws_ecr_repository" "repositories" {
  for_each = toset(local.ecr_repositories)

  name                 = each.value
  image_tag_mutability = "IMMUTABLE" # prevents a tag (e.g. a git-SHA tag) from being silently overwritten

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = merge(
    local.common_tags,
    {
      Name = each.value
    }
  )
}

# =============================================================================
# LIFECYCLE POLICY
# =============================================================================

resource "aws_ecr_lifecycle_policy" "repositories" {
  for_each = aws_ecr_repository.repositories

  repository = each.value.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 20 images"

        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 20
        }

        action = {
          type = "expire"
        }
      }
    ]
  })
}