# DevOps Infrastructure - TaxSense AI

## Overview

This directory contains the complete DevOps infrastructure, CI/CD pipelines, monitoring, and deployment automation for TaxSense AI. The infrastructure is designed for **99.9% uptime**, automatic scaling, and disaster recovery across multiple regions.

## 📁 Directory Structure

```
taxsense-ai/
├── docker/                          # Docker configuration
│   ├── Dockerfile                  # Multi-stage production image
│   ├── docker-compose.yml          # Local development environment
│   ├── .dockerignore               # Docker build excludes
│   └── prometheus.yml              # Prometheus configuration
│
├── k8s/                            # Kubernetes manifests
│   ├── namespace.yml               # Namespace definition
│   ├── configmap.yml               # ConfigMaps and Secrets
│   ├── deployment.yml              # Web and worker deployments
│   ├── service.yml                 # Services and Ingress
│   ├── hpa.yml                     # Horizontal Pod Autoscaler
│   ├── rbac.yml                    # RBAC configuration
│   ├── network-policy.yml          # Network policies
│   └── storage.yml                 # PersistentVolumes
│
├── helm/                           # Helm charts for deployment
│   ├── Chart.yaml                  # Helm chart metadata
│   └── values.yaml                 # Default values
│
├── .github/workflows/              # GitHub Actions CI/CD
│   ├── build.yml                   # Build and push Docker image
│   ├── test.yml                    # Run test suite
│   ├── security.yml                # Security scanning
│   ├── performance.yml             # Performance testing
│   ├── deploy-staging.yml          # Deploy to staging
│   └── deploy-production.yml       # Deploy to production
│
├── terraform/                      # Infrastructure as Code
│   ├── main.tf                     # Main Terraform config
│   ├── variables.tf                # Input variables
│   ├── outputs.tf                  # Output values
│   ├── modules/                    # Terraform modules
│   │   ├── vpc/                    # VPC module
│   │   ├── eks/                    # EKS cluster
│   │   ├── rds/                    # RDS database
│   │   ├── redis/                  # ElastiCache
│   │   ├── s3/                     # S3 buckets
│   │   ├── iam/                    # IAM roles
│   │   ├── monitoring/             # Prometheus/Grafana
│   │   ├── logging/                # ELK stack
│   │   ├── backup/                 # Backup & DR
│   │   ├── cdn/                    # CloudFront CDN
│   │   ├── certificates/           # ACM certificates
│   │   └── load_balancer/          # ALB/NLB
│   └── environments/               # Environment configs
│       ├── prod.tfvars
│       ├── staging.tfvars
│       └── dev.tfvars
│
├── src/lib/monitoring/             # Monitoring utilities
│   ├── metrics.ts                  # Prometheus metrics
│   └── logger.ts                   # Structured logging
│
├── migrations/                     # Database migrations
│   └── 001_initial_schema.sql     # Initial schema
│
├── scripts/                        # Operational scripts
│   └── backup.sh                   # Backup automation
│
├── load-tests/                     # k6 load testing
│   └── api.js                      # API load tests
│
├── docs/
│   └── INFRASTRUCTURE.md           # Infrastructure guide
│
├── DEVOPS_README.md               # This file
└── DEPLOYMENT_CHECKLIST.md        # Deployment checklist
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- kubectl
- Helm 3+
- Terraform 1.0+
- AWS CLI v2
- Node.js 20+
- k6 (for load testing)

### Local Development (5 minutes)

```bash
# 1. Setup environment
cp .env.example .env

# 2. Start development environment
docker-compose -f docker/docker-compose.yml up -d

# 3. Install dependencies and run
npm install
npm run dev

# 4. Access services
# App: http://localhost:3000
# Kibana: http://localhost:5601
# Grafana: http://localhost:3001
# Prometheus: http://localhost:9090
```

### Production Deployment

See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for complete deployment procedures.

## 🏗️ Architecture

### System Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Container Runtime** | Docker | Application containerization |
| **Orchestration** | Kubernetes (EKS) | Container orchestration |
| **Database** | PostgreSQL (RDS) | Primary data store |
| **Cache** | Redis (ElastiCache) | Session and data caching |
| **Storage** | AWS S3 | File storage and backups |
| **CDN** | CloudFront | Content delivery |
| **Load Balancer** | ALB | Traffic distribution |
| **Monitoring** | Prometheus | Metrics collection |
| **Visualization** | Grafana | Dashboard and alerting |
| **Logging** | ELK Stack | Log aggregation |
| **Tracing** | Jaeger (Optional) | Distributed tracing |
| **CI/CD** | GitHub Actions | Automated pipelines |
| **IaC** | Terraform | Infrastructure management |

### High Availability

- **Multi-AZ Deployment**: 3 availability zones
- **Auto-scaling**: 3-10 replicas based on load
- **Database Replication**: Master-standby in primary + cross-region
- **Backup**: Daily snapshots with point-in-time recovery
- **CDN**: CloudFront caching for 90% of requests
- **Blue-Green Deployment**: Zero-downtime updates

## 📊 Monitoring & Observability

### Metrics

**Application:**
- HTTP request rate and latency
- Error rate and types
- Tax computation performance
- Cache hit rates

**Infrastructure:**
- CPU, memory, disk usage
- Network I/O
- Database connections
- Container resource usage

**Business:**
- Active users
- Daily computations
- User retention
- Revenue metrics

### Access Dashboards

```bash
# Port forward to access locally
kubectl port-forward -n taxsense svc/prometheus 9090:9090
kubectl port-forward -n taxsense svc/grafana 3001:3000
kubectl port-forward -n taxsense svc/kibana 5601:5601
```

### Alerting

Critical alerts automatically page on-call engineer via PagerDuty:
- Availability < 99%
- Error rate > 1%
- API latency p95 > 1000ms
- Database issues

## 🔐 Security

### Network Security

- Network policies restrict pod-to-pod communication
- Private subnets for all workloads
- Public subnets only for load balancers
- WAF rules on CloudFront

### Data Security

- AES-256 encryption at rest
- TLS 1.3 for all connections
- Database encryption enabled
- Regular penetration testing

### Access Control

- RBAC for Kubernetes
- IAM roles for AWS services
- Secrets Manager for sensitive data
- Audit logging of all access

## 🧪 Testing & CI/CD

### Automated Testing

```bash
npm run test              # Unit tests
npm run test:integration  # Integration tests
npm run test:e2e         # End-to-end tests
npm run test:smoke       # Smoke tests
npm run typecheck        # Type checking
```

### CI/CD Pipelines

| Pipeline | Trigger | Purpose |
|----------|---------|---------|
| **Build** | Push to main/develop | Build and scan image |
| **Test** | Push, Pull Request | Run all tests |
| **Security** | Daily, Push | Security scanning |
| **Performance** | Daily, Push to main | Performance benchmarks |
| **Staging** | Push to develop | Deploy to staging |
| **Production** | Push to main, Manual | Deploy to production |

### Load Testing

```bash
k6 run load-tests/api.js --vus 100 --duration 5m \
  --env TARGET_URL=https://app.taxsense.ai
```

## 📈 Scaling & Performance

### Horizontal Scaling

Auto-scaling configured with HPA:
- Min replicas: 3
- Max replicas: 10
- Target CPU: 70%
- Target memory: 80%

### Performance Targets

| Metric | Target |
|--------|--------|
| API latency (p95) | < 500ms |
| API latency (p99) | < 1000ms |
| Error rate | < 0.1% |
| Availability | 99.9% |
| Time to first byte | < 200ms |

### Database Optimization

- Connection pooling (min: 5, max: 20)
- Query indexes on frequent filters
- Automatic VACUUM and ANALYZE
- Slow query logging and analysis

## 🔄 Backup & Disaster Recovery

### Backup Strategy

- **Frequency**: Daily full backups at 2 AM UTC
- **Incremental**: Every 6 hours
- **Retention**: 30 days
- **Cross-Region**: Replicated to us-west-2
- **Encryption**: AES-256 with GPG

### Recovery Objectives

- **RTO** (Recovery Time Objective): 1 hour
- **RPO** (Recovery Point Objective): 15 minutes

### Restore Procedure

```bash
# Point-in-time restore
rds-restore-db-instance-from-db-snapshot \
  --db-instance-identifier taxsense-prod-restore \
  --db-snapshot-identifier taxsense-prod-2026-09-28-02-00

# Verify restore
psql -h <restored-endpoint> -U taxsense -d taxsense -c "SELECT 1;"

# Update connection string and restart pods
```

## 📝 Logs & Debugging

### Viewing Logs

```bash
# Application logs
kubectl logs -n taxsense deployment/taxsense-app --follow

# Previous pod logs (if crashed)
kubectl logs -n taxsense <pod-name> --previous

# Logs from specific container
kubectl logs -n taxsense <pod-name> -c <container-name>

# Stream logs from multiple pods
kubectl logs -n taxsense -l app=taxsense --all-containers=true -f
```

### Searching Logs

```bash
# Kibana query
{
  "query": {
    "bool": {
      "must": [
        { "match": { "level": "ERROR" } },
        { "range": { "timestamp": { "gte": "now-1h" } } }
      ]
    }
  }
}
```

## 🛠️ Common Operations

### Deployment

```bash
# Deploy via Helm
helm upgrade --install taxsense helm/ -n taxsense -f values-prod.yaml

# Rollback previous release
helm rollback taxsense -n taxsense

# Check Helm status
helm status taxsense -n taxsense
```

### Scaling

```bash
# Manual pod scaling
kubectl scale deployment taxsense-app --replicas=5 -n taxsense

# Check HPA status
kubectl get hpa -n taxsense
kubectl describe hpa taxsense-app-hpa -n taxsense
```

### Secrets Management

```bash
# Create secret
kubectl create secret generic taxsense-secrets \
  --from-literal=DATABASE_PASSWORD=$(openssl rand -base64 32) \
  -n taxsense

# Update secret
kubectl delete secret taxsense-secrets -n taxsense
kubectl create secret generic taxsense-secrets \
  --from-literal=DATABASE_PASSWORD=new-password \
  -n taxsense
```

## 🚨 Troubleshooting

### Pod Restart Loop

```bash
# Check pod status
kubectl describe pod <pod-name> -n taxsense

# Check logs
kubectl logs <pod-name> -n taxsense
kubectl logs <pod-name> -n taxsense --previous

# Check resource limits
kubectl describe nodes
kubectl top pods -n taxsense
```

### Database Connection Issues

```bash
# Check connection pool
psql -c "SELECT count(*) FROM pg_stat_activity;"

# Check RDS status
aws rds describe-db-instances --db-instance-identifier taxsense-prod

# Increase pool size
kubectl set env deployment/taxsense-app DATABASE_POOL_MAX=30 -n taxsense
```

### High Memory Usage

```bash
# Monitor memory
kubectl top pods -n taxsense --sort-by=memory

# Adjust resource limits
kubectl set resources deployment taxsense-app \
  --limits=memory=2Gi --requests=memory=1Gi \
  -n taxsense
```

## 📚 Documentation

- [Infrastructure Guide](./docs/INFRASTRUCTURE.md) - Comprehensive infrastructure documentation
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) - Step-by-step deployment procedures
- [Kubernetes Docs](https://kubernetes.io/docs/)
- [Terraform Docs](https://www.terraform.io/docs/)
- [AWS EKS Docs](https://docs.aws.amazon.com/eks/)

## 📞 Support

**Issues & Questions:**
- Slack: #devops-support
- Email: devops@taxsense.ai
- PagerDuty: oncall@taxsense.ai (emergencies)

**On-Call Support:**
- Mon-Fri: 9 AM - 6 PM (UTC)
- 24/7: PagerDuty escalation

## 📋 Maintenance

### Daily
- [ ] Monitor error rates and latency
- [ ] Check database backup completion
- [ ] Review security logs

### Weekly
- [ ] Test backup restoration
- [ ] Analyze performance trends
- [ ] Review incident logs
- [ ] Update runbooks

### Monthly
- [ ] Test disaster recovery
- [ ] Capacity planning review
- [ ] Security audit
- [ ] Cost optimization review

## 📊 Metrics & SLOs

**Service Level Objectives:**
- Availability: 99.9%
- Error rate: < 0.1%
- Latency p95: < 500ms
- Latency p99: < 1000ms

**Key Metrics:**
- Requests per second
- Error rate
- API latency
- Database query performance
- Cache hit rate
- Active users

## 🎯 Roadmap

- [ ] Service mesh (Istio) integration
- [ ] Automated canary deployments
- [ ] Advanced cost optimization
- [ ] Multi-region active-active setup
- [ ] Enhanced security (MFA, SAML)
- [ ] Automated performance testing

## 📄 License

This infrastructure is part of TaxSense AI and follows the same license terms.

---

**Last Updated:** 2026-09-28
**Maintained By:** DevOps Team
**Version:** 1.0.0

For detailed infrastructure guide, see [docs/INFRASTRUCTURE.md](./docs/INFRASTRUCTURE.md)
