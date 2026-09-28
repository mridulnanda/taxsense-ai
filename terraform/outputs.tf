output "cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "cluster_security_group_id" {
  description = "EKS cluster security group ID"
  value       = module.eks.cluster_security_group_id
}

output "cluster_ca_certificate" {
  description = "EKS cluster CA certificate"
  value       = module.eks.cluster_ca_certificate
  sensitive   = true
}

output "rds_endpoint" {
  description = "RDS database endpoint"
  value       = module.rds.db_endpoint
}

output "rds_instance_id" {
  description = "RDS instance ID"
  value       = module.rds.db_instance_id
}

output "redis_endpoint" {
  description = "Redis primary endpoint"
  value       = module.redis.cache_endpoint
}

output "s3_bucket_names" {
  description = "S3 bucket names"
  value       = module.s3.bucket_names
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "load_balancer_dns" {
  description = "Load balancer DNS name"
  value       = module.load_balancer.lb_dns_name
}

output "load_balancer_arn" {
  description = "Load balancer ARN"
  value       = module.load_balancer.lb_arn
}

output "monitoring_endpoints" {
  description = "Monitoring service endpoints"
  value = {
    prometheus = "http://prometheus.taxsense.svc.cluster.local:9090"
    grafana    = "http://grafana.taxsense.svc.cluster.local:3000"
    alertmanager = "http://alertmanager.taxsense.svc.cluster.local:9093"
  }
}

output "logging_endpoints" {
  description = "Logging service endpoints"
  value = {
    elasticsearch = "http://elasticsearch.taxsense.svc.cluster.local:9200"
    kibana        = "http://kibana.taxsense.svc.cluster.local:5601"
  }
}

output "certificate_arn" {
  description = "ACM certificate ARN"
  value       = module.certificates.certificate_arn
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = module.cdn.cloudfront_domain_name
}

output "backup_vault_arn" {
  description = "AWS Backup vault ARN"
  value       = module.backup.backup_vault_arn
}

output "helm_release_status" {
  description = "Helm release deployment status"
  value       = helm_release.taxsense.status
}
