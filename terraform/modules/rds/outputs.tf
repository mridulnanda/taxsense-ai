# Terraform Module: rds
# This module manages rds resources

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Module implementation
# Add module-specific resources here
