terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }

  backend "s3" {
    bucket         = "taxsense-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-lock"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
      CreatedAt   = formatdate("YYYY-MM-DD", timestamp())
    }
  }
}

provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_ca_certificate)
  token                  = data.aws_eks_cluster_auth.default.token
}

provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_ca_certificate)
    token                  = data.aws_eks_cluster_auth.default.token
  }
}

data "aws_eks_cluster_auth" "default" {
  name = module.eks.cluster_name
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  environment      = var.environment
  project_name     = var.project_name
  vpc_cidr         = var.vpc_cidr
  availability_zones = var.availability_zones

  tags = var.tags
}

# EKS Cluster Module
module "eks" {
  source = "./modules/eks"

  environment        = var.environment
  project_name       = var.project_name
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnet_ids
  cluster_version    = var.kubernetes_version
  node_group_size    = var.node_group_size

  tags = var.tags
}

# RDS Database Module
module "rds" {
  source = "./modules/rds"

  environment          = var.environment
  project_name         = var.project_name
  vpc_id               = module.vpc.vpc_id
  private_subnet_ids   = module.vpc.private_subnet_ids
  database_name        = var.database_name
  database_user        = var.database_user
  database_password    = var.database_password
  instance_class       = var.db_instance_class
  allocated_storage    = var.db_allocated_storage

  tags = var.tags
}

# Redis Cache Module
module "redis" {
  source = "./modules/redis"

  environment        = var.environment
  project_name       = var.project_name
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  node_type          = var.redis_node_type
  num_cache_nodes    = var.redis_num_nodes

  tags = var.tags
}

# S3 Buckets Module
module "s3" {
  source = "./modules/s3"

  environment  = var.environment
  project_name = var.project_name

  tags = var.tags
}

# IAM Roles Module
module "iam" {
  source = "./modules/iam"

  environment  = var.environment
  project_name = var.project_name
  cluster_arn  = module.eks.cluster_arn

  tags = var.tags
}

# Monitoring Stack (Prometheus, Grafana, ELK)
module "monitoring" {
  source = "./modules/monitoring"

  environment    = var.environment
  project_name   = var.project_name
  cluster_name   = module.eks.cluster_name
  eks_addon_version = var.monitoring_addon_version

  tags = var.tags
}

# Logging Stack (Elasticsearch, Kibana, Logstash)
module "logging" {
  source = "./modules/logging"

  environment  = var.environment
  project_name = var.project_name
  vpc_id       = module.vpc.vpc_id

  tags = var.tags
}

# Backup & Disaster Recovery
module "backup" {
  source = "./modules/backup"

  environment  = var.environment
  project_name = var.project_name
  rds_instance = module.rds.db_instance_id
  s3_buckets   = module.s3.bucket_names

  tags = var.tags
}

# CloudFront CDN
module "cdn" {
  source = "./modules/cdn"

  environment  = var.environment
  project_name = var.project_name
  s3_buckets   = module.s3.bucket_names

  tags = var.tags
}

# Certificate Manager
module "certificates" {
  source = "./modules/certificates"

  environment  = var.environment
  project_name = var.project_name
  domain_name  = var.domain_name

  tags = var.tags
}

# ALB/NLB Load Balancer
module "load_balancer" {
  source = "./modules/load_balancer"

  environment       = var.environment
  project_name      = var.project_name
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  certificate_arn   = module.certificates.certificate_arn

  tags = var.tags
}

# Deploy Helm chart
resource "helm_release" "taxsense" {
  name       = "taxsense"
  repository = "oci://ghcr.io/taxsense"
  chart      = "taxsense"
  version    = var.helm_chart_version
  namespace  = var.kubernetes_namespace

  create_namespace = true

  values = [
    templatefile("${path.module}/values.tpl", {
      environment       = var.environment
      image_tag         = var.image_tag
      replica_count     = var.app_replicas
      database_host     = module.rds.db_host
      database_name     = module.rds.db_name
      redis_host        = module.redis.cache_endpoint
      api_key           = var.anthropic_api_key
      slack_webhook_url = var.slack_webhook_url
    })
  ]

  depends_on = [
    module.eks,
    module.rds,
    module.redis
  ]
}
