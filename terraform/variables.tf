variable "environment" {
  description = "Environment name (prod, staging, dev)"
  type        = string
  default     = "prod"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod"
  }
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "taxsense"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.28"
}

variable "node_group_size" {
  description = "EKS node group configuration"
  type = object({
    min_size       = number
    max_size       = number
    desired_size   = number
    instance_types = list(string)
  })
  default = {
    min_size       = 3
    max_size       = 10
    desired_size   = 5
    instance_types = ["t3.xlarge"]
  }
}

variable "database_name" {
  description = "Database name"
  type        = string
  default     = "taxsense"
  sensitive   = true
}

variable "database_user" {
  description = "Database user"
  type        = string
  default     = "taxsense"
  sensitive   = true
}

variable "database_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.xlarge"
}

variable "db_allocated_storage" {
  description = "Database allocated storage in GB"
  type        = number
  default     = 100
}

variable "redis_node_type" {
  description = "Redis node type"
  type        = string
  default     = "cache.t4g.medium"
}

variable "redis_num_nodes" {
  description = "Number of Redis nodes"
  type        = number
  default     = 3
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "taxsense.ai"
}

variable "helm_chart_version" {
  description = "Helm chart version"
  type        = string
  default     = "1.0.0"
}

variable "kubernetes_namespace" {
  description = "Kubernetes namespace"
  type        = string
  default     = "taxsense"
}

variable "image_tag" {
  description = "Docker image tag"
  type        = string
  default     = "latest"
}

variable "app_replicas" {
  description = "Number of application replicas"
  type        = number
  default     = 3
}

variable "anthropic_api_key" {
  description = "Anthropic API key"
  type        = string
  sensitive   = true
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for notifications"
  type        = string
  sensitive   = true
}

variable "monitoring_addon_version" {
  description = "Monitoring addon version"
  type        = string
  default     = "v0.70.0"
}

variable "backup_retention_days" {
  description = "Backup retention in days"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    ManagedBy = "Terraform"
    Project   = "TaxSense"
  }
}
