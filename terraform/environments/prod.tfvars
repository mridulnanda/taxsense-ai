environment              = "prod"
project_name             = "taxsense"
aws_region               = "us-east-1"
vpc_cidr                 = "10.0.0.0/16"
availability_zones       = ["us-east-1a", "us-east-1b", "us-east-1c"]
kubernetes_version       = "1.28"

# Node group configuration
node_group_size = {
  min_size       = 3
  max_size       = 10
  desired_size   = 5
  instance_types = ["t3.xlarge"]
}

# Database configuration
database_name         = "taxsense"
database_user         = "taxsense"
db_instance_class     = "db.t4g.xlarge"
db_allocated_storage  = 100

# Redis configuration
redis_node_type  = "cache.t4g.medium"
redis_num_nodes  = 3

# Domain and certificates
domain_name = "taxsense.ai"

# Application configuration
helm_chart_version       = "1.0.0"
kubernetes_namespace     = "taxsense"
image_tag                = "latest"
app_replicas             = 3

# Monitoring
monitoring_addon_version = "v0.70.0"

# Backup retention
backup_retention_days = 30

# Common tags
tags = {
  Environment = "production"
  Project     = "TaxSense"
  ManagedBy   = "Terraform"
  CostCenter  = "Engineering"
}
