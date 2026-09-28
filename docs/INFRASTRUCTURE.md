# TaxSense AI Infrastructure Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Kubernetes Deployment](#kubernetes-deployment)
3. [Docker Configuration](#docker-configuration)
4. [CI/CD Pipelines](#cicd-pipelines)
5. [Infrastructure as Code (Terraform)](#infrastructure-as-code)
6. [Monitoring & Observability](#monitoring--observability)
7. [Database Management](#database-management)
8. [Backup & Disaster Recovery](#backup--disaster-recovery)
9. [Performance Optimization](#performance-optimization)
10. [Security](#security)
11. [Troubleshooting](#troubleshooting)
12. [SLO & Metrics](#slo--metrics)

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CDN (CloudFront)                       │
└────────────────────────┬──────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────────────┐
│              Application Load Balancer (ALB)                │
└────────────────────────┬──────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼────┐      ┌────▼────┐      ┌──▼─────┐
   │ EKS Pod │      │ EKS Pod │      │EKS Pod │
   │ (Web)   │      │ (Web)   │      │(Web)   │
   └────┬────┘      └────┬────┘      └──┬─────┘
        │                │              │
        └────────────────┼──────────────┘
                         │
        ┌────────────────┼──────────────────┐
        │                │                  │
   ┌────▼────┐      ┌────▼────┐       ┌───▼──┐
   │RDS (PG) │      │ Redis   │       │  S3  │
   │ Primary │      │ Cluster │       │      │
   └────┬────┘      └────┬────┘       └──────┘
        │                │
   ┌────▼────────────────▼────┐
   │  Monitoring & Logging    │
   │  (Prometheus/ELK Stack)  │
   └──────────────────────────┘
```

### Regional Redundancy

- **Primary Region**: us-east-1
- **Secondary Region**: us-west-2
- **Disaster Recovery**: Multi-region replication with RTO: 1 hour, RPO: 15 minutes

---

## Kubernetes Deployment

### Prerequisites

```bash
# Install required tools
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
aws eks update-kubeconfig --region us-east-1 --name taxsense-prod
```

### Cluster Configuration

**EKS Cluster Details:**
- Kubernetes Version: 1.28+
- Node Groups: 3 (min) to 10 (max) nodes
- Instance Type: t3.xlarge (4vCPU, 16GB RAM)
- Availability Zones: 3 (us-east-1a, us-east-1b, us-east-1c)

### Deployment

```bash
# Deploy using kubectl
kubectl apply -f k8s/namespace.yml
kubectl apply -f k8s/configmap.yml
kubectl apply -f k8s/rbac.yml
kubectl apply -f k8s/storage.yml
kubectl apply -f k8s/deployment.yml
kubectl apply -f k8s/service.yml
kubectl apply -f k8s/hpa.yml
kubectl apply -f k8s/network-policy.yml

# Or deploy using Helm
helm install taxsense helm/ \
  --namespace taxsense \
  --create-namespace \
  -f helm/values.yaml \
  --values helm/values-prod.yaml
```

### Verify Deployment

```bash
# Check deployment status
kubectl get deployments -n taxsense
kubectl get pods -n taxsense
kubectl get svc -n taxsense

# Check pod logs
kubectl logs -n taxsense deployment/taxsense-app --follow

# Port forward for testing
kubectl port-forward -n taxsense svc/taxsense-app 3000:80
```

### Scaling

**Horizontal Scaling (HPA):**
- Minimum Replicas: 3
- Maximum Replicas: 10
- Target CPU Utilization: 70%
- Target Memory Utilization: 80%

```bash
# View HPA status
kubectl get hpa -n taxsense
kubectl describe hpa taxsense-app-hpa -n taxsense

# Manual scaling
kubectl scale deployment taxsense-app --replicas=5 -n taxsense
```

---

## Docker Configuration

### Building Images

```bash
# Build Docker image
docker build -f docker/Dockerfile -t taxsense:latest .

# Build for specific platform
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f docker/Dockerfile \
  -t ghcr.io/taxsense/taxsense:latest \
  .

# Push to registry
docker push ghcr.io/taxsense/taxsense:latest
```

### Local Development

```bash
# Start development environment
docker-compose -f docker/docker-compose.yml up -d

# Stop environment
docker-compose -f docker/docker-compose.yml down

# View logs
docker-compose -f docker/docker-compose.yml logs -f app

# Access services
# Application: http://localhost:3000
# Kibana: http://localhost:5601
# Grafana: http://localhost:3001
# Prometheus: http://localhost:9090
```

### Image Security

```bash
# Scan image with Trivy
trivy image ghcr.io/taxsense/taxsense:latest

# Sign image
docker trust sign ghcr.io/taxsense/taxsense:latest

# Verify signature
docker trust inspect --pretty ghcr.io/taxsense/taxsense:latest
```

---

## CI/CD Pipelines

### GitHub Actions Workflows

#### 1. Build Pipeline (`.github/workflows/build.yml`)

Triggers: `push` to main/develop, `pull_request`

**Steps:**
1. Checkout code
2. Setup Docker buildx
3. Build Docker image
4. Run security scanning (Trivy)
5. Upload to container registry
6. Notify Slack

**Run Workflow:**
```bash
# View workflow runs
gh workflow view build -w

# Manually trigger workflow
gh workflow run build --ref main
```

#### 2. Test Pipeline (`.github/workflows/test.yml`)

Triggers: `push`, `pull_request`

**Steps:**
1. Setup Node.js environment
2. Install dependencies
3. Type checking
4. Run unit tests (1000+ tests)
5. Upload coverage reports
6. Comment on PR with coverage

**Run Tests Locally:**
```bash
npm ci
npm run typecheck
npm run test
npm run test:watch
```

#### 3. Security Pipeline (`.github/workflows/security.yml`)

Triggers: `push`, `pull_request`, `schedule` (daily)

**Checks:**
- npm audit (SAST)
- Snyk vulnerability scanning
- CodeQL analysis
- Container image scanning (Trivy)
- Secret detection (TruffleHog)
- License compliance (FOSSA)

**View Results:**
```bash
# GitHub Security Tab
gh api repos/:owner/:repo/security-advisories
```

#### 4. Performance Pipeline (`.github/workflows/performance.yml`)

Triggers: `push` to main, scheduled daily

**Tests:**
- Lighthouse CI (Core Web Vitals)
- Bundle size analysis
- Load testing (k6)

#### 5. Staging Deployment (`.github/workflows/deploy-staging.yml`)

Triggers: `push` to develop, `workflow_dispatch`

**Steps:**
1. Build and push image
2. Update K8s deployment
3. Run smoke tests
4. Execute health checks

#### 6. Production Deployment (`.github/workflows/deploy-production.yml`)

Triggers: `push` to main, `tag`, `workflow_dispatch`

**Steps:**
1. Pre-deployment checks
2. Create database backup
3. Run migrations
4. Blue-green deployment
5. Smoke tests
6. Health checks
7. Notify stakeholders

**Production Checklist:**
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Deployment window scheduled
- [ ] Rollback plan prepared
- [ ] Communication sent to team

---

## Infrastructure as Code

### Terraform

**File Structure:**
```
terraform/
├── main.tf              # Main configuration
├── variables.tf         # Input variables
├── outputs.tf          # Output values
├── values.tpl          # Helm values template
├── modules/
│   ├── vpc/            # VPC module
│   ├── eks/            # EKS cluster
│   ├── rds/            # RDS database
│   ├── redis/          # ElastiCache
│   ├── s3/             # S3 buckets
│   ├── iam/            # IAM roles
│   ├── monitoring/     # Prometheus/Grafana
│   ├── logging/        # ELK stack
│   ├── backup/         # Backup & recovery
│   ├── cdn/            # CloudFront
│   ├── certificates/   # ACM certificates
│   └── load_balancer/  # ALB/NLB
└── environments/
    ├── prod.tfvars     # Production values
    ├── staging.tfvars  # Staging values
    └── dev.tfvars      # Development values
```

### Deployment

```bash
# Initialize Terraform
terraform init -backend-config="key=prod/terraform.tfstate"

# Plan changes
terraform plan -var-file=environments/prod.tfvars -out=tfplan

# Apply changes
terraform apply tfplan

# Destroy resources (caution!)
terraform destroy -var-file=environments/prod.tfvars

# Migrate state
terraform state mv module.old_name module.new_name
```

### State Management

```bash
# Backup state
aws s3 cp s3://taxsense-terraform-state/prod/terraform.tfstate backup-$(date +%Y%m%d).tfstate

# List state
terraform state list

# Inspect resource
terraform state show module.eks.aws_eks_cluster.main

# Import existing resource
terraform import aws_instance.example i-1234567890abcdef0
```

---

## Monitoring & Observability

### Prometheus

**Metrics Collection:**
- Application metrics (HTTP latency, error rates)
- Database metrics (query duration, connections)
- System metrics (CPU, memory, disk)
- Business metrics (computations, users)

**Access Prometheus:**
```bash
# Port forward
kubectl port-forward -n taxsense svc/prometheus 9090:9090
# http://localhost:9090
```

**Useful Queries:**
```promql
# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status=~"5.."}[5m])

# API latency (p95)
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Active connections
pg_connections_active
```

### Grafana

**Dashboards:**
1. Application Overview
2. API Performance
3. Database Metrics
4. System Resources
5. Business Metrics
6. Error Analysis

**Access Grafana:**
```bash
# Port forward
kubectl port-forward -n taxsense svc/grafana 3001:3000
# http://localhost:3001 (admin/admin)
```

### Elasticsearch & Kibana

**Log Aggregation:**
- Application logs
- API access logs
- Error logs
- Audit logs
- Security events

**Access Kibana:**
```bash
# Port forward
kubectl port-forward -n taxsense svc/kibana 5601:5601
# http://localhost:5601
```

**Sample Queries:**
```json
{
  "query": {
    "match": {
      "log.level": "ERROR"
    }
  }
}
```

### Alerting

**Alert Rules:**
- CPU utilization > 80%
- Memory utilization > 85%
- Error rate > 1%
- API latency p95 > 500ms
- Database connections > 80% of pool

**Configuration:**
```yaml
groups:
  - name: taxsense
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
```

---

## Database Management

### PostgreSQL

**Connection Details:**
```bash
Host: postgres.taxsense.svc.cluster.local
Port: 5432
Database: taxsense
User: taxsense
```

### Accessing Database

```bash
# Port forward to local
kubectl port-forward -n taxsense svc/postgres 5432:5432

# Connect with psql
psql -h localhost -U taxsense -d taxsense

# Or use remote connection
psql postgresql://taxsense:password@rds-endpoint:5432/taxsense
```

### Migrations

```bash
# Apply migrations
npm run migrate:up

# Rollback migrations
npm run migrate:down

# Create new migration
npm run migrate:create -- migration_name

# Check migration status
npm run migrate:status
```

### Backups

**Automated Backups:**
- Daily full backups
- Cross-region replication
- 30-day retention
- Point-in-time recovery available

```bash
# Manual backup
./scripts/backup.sh full prod

# Restore from backup
psql -h localhost -U taxsense -d taxsense < backup-file.sql

# List backups
aws s3 ls s3://taxsense-backups/prod/backups/
```

---

## Backup & Disaster Recovery

### RTO/RPO Targets

- **RTO (Recovery Time Objective)**: 1 hour
- **RPO (Recovery Point Objective)**: 15 minutes

### Backup Strategy

**Backup Types:**
1. **Full Backup**: Daily at 2:00 AM UTC
2. **Incremental**: Every 6 hours
3. **Cross-region**: Replicated to us-west-2
4. **Encryption**: AES-256 at rest

**Backup Storage:**
- AWS Backup vault
- S3 (Standard-IA)
- Glacier for long-term retention

### Disaster Recovery

```bash
# Test disaster recovery (monthly)
# 1. Create snapshot from production
aws ec2 create-snapshot --volume-id vol-123456 --description "DR Test"

# 2. Launch test environment in secondary region
./scripts/dr-test.sh

# 3. Verify application functionality
# 4. Document findings
# 5. Teardown test environment
```

### Failover Procedure

```bash
# 1. Detect primary region failure
# 2. Promote secondary region
aws rds promote-read-replica --db-instance-identifier taxsense-read-replica-us-west-2

# 3. Update DNS
aws route53 change-resource-record-sets --hosted-zone-id Z123... \
  --change-batch file://failover.json

# 4. Verify data integrity
./scripts/verify-failover.sh

# 5. Notify stakeholders
```

---

## Performance Optimization

### Caching Strategy

**Multi-Layer Caching:**
1. **Browser Cache**: 1 day (static assets)
2. **CDN Cache**: 1 hour (HTML, JS, CSS)
3. **Redis Cache**: Variable TTL
   - Computations: 1 hour
   - User data: 30 minutes
   - Tax rules: 24 hours
4. **Database Query Cache**: 5 minutes

### Database Optimization

```sql
-- Index optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_computations_user_id ON computations(user_id);

-- Query optimization
EXPLAIN ANALYZE SELECT * FROM computations WHERE user_id = $1;

-- Vacuum & analyze
VACUUM ANALYZE;
```

### Image Optimization

**Configuration:**
- Image compression: 80% quality (JPEG), 9 compression level (PNG)
- Responsive images: srcset with multiple sizes
- WebP format: Fallback to JPEG/PNG
- Lazy loading: Intersection Observer API

### Code Splitting

**Bundle Analysis:**
```bash
npm run build
npm run analyze:bundle
```

**Bundle Size Targets:**
- Main bundle: < 200 KB (gzipped)
- Vendor bundle: < 150 KB
- CSS: < 50 KB

---

## Security

### Network Security

**Network Policies:**
- Default deny all ingress/egress
- Allow specific service-to-service traffic
- Restrict outbound to whitelisted domains

**SSL/TLS:**
- TLS 1.3 enforced
- Certificates: AWS Certificate Manager
- Auto-renewal 30 days before expiry

### Data Security

**Encryption:**
- At rest: AES-256 (RDS, S3, Redis)
- In transit: TLS 1.3
- Backups: Encrypted with GPG

**Secret Management:**
```bash
# Rotate secrets
kubectl delete secret taxsense-secrets -n taxsense
kubectl create secret generic taxsense-secrets \
  --from-literal=DATABASE_PASSWORD=$(openssl rand -base64 32) \
  -n taxsense
```

### Access Control

**IAM Policies:**
- Principle of least privilege
- Role-based access control (RBAC)
- Service accounts for workloads

**Audit Logging:**
- All API access logged
- Database query logging
- CloudTrail for AWS API calls

---

## Troubleshooting

### Common Issues

#### 1. Pod Crashes

```bash
# Check pod status
kubectl describe pod <pod-name> -n taxsense

# View pod logs
kubectl logs <pod-name> -n taxsense
kubectl logs <pod-name> -n taxsense --previous

# Check events
kubectl get events -n taxsense --sort-by='.lastTimestamp'
```

#### 2. Database Connection Issues

```bash
# Check connection pool
psql -h localhost -U taxsense -d taxsense -c "SELECT * FROM pg_stat_activity;"

# Increase pool size
kubectl set env deployment/taxsense-app \
  DATABASE_POOL_MAX=30 \
  -n taxsense
```

#### 3. High Memory Usage

```bash
# Check memory metrics
kubectl top pods -n taxsense
kubectl top nodes

# Adjust resource limits
kubectl set resources deployment taxsense-app \
  --limits=memory=2Gi,cpu=2 \
  -n taxsense
```

#### 4. High Latency

```bash
# Check Prometheus metrics
# Query: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Check slow queries
psql -h localhost -U taxsense -d taxsense -c \
  "SELECT query, calls, total_time FROM pg_stat_statements ORDER BY total_time DESC;"

# Enable query logging
kubectl exec -it postgres-pod -- psql -U taxsense -d taxsense -c \
  "ALTER SYSTEM SET log_min_duration_statement = 1000;"
```

---

## SLO & Metrics

### Service Level Objectives

| Metric | SLO | Threshold |
|--------|-----|-----------|
| Availability | 99.9% | < 43.2 minutes downtime/month |
| Error Rate | < 0.1% | < 1 error per 1000 requests |
| Latency (p95) | < 500ms | Dashboard response in 500ms |
| Latency (p99) | < 1000ms | Most requests under 1 second |

### Key Performance Indicators

**Application Metrics:**
- Requests per second: Target 1000+ RPS
- Error rate: Target < 0.1%
- API latency (p95): Target < 500ms
- Tax computation time: Average 5-30 seconds

**Infrastructure Metrics:**
- CPU utilization: Target 70% max
- Memory utilization: Target 80% max
- Disk usage: Target 80% max
- Database connections: Target 75% of pool

**Business Metrics:**
- Active users
- Daily computations
- User retention rate
- Revenue per user

---

## Support & Escalation

### On-Call Support

**Escalation Path:**
1. PagerDuty alert triggered
2. On-call engineer notified
3. Incident channel created in Slack
4. Post-incident review within 24 hours

**Contact Information:**
- Slack: #devops-incidents
- PagerDuty: https://taxsense.pagerduty.com
- Email: devops@taxsense.ai

---

## References

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Helm Documentation](https://helm.sh/docs/)
- [Terraform Documentation](https://www.terraform.io/docs/)
- [AWS EKS Best Practices](https://docs.aws.amazon.com/eks/latest/userguide/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Last Updated**: 2026-09-28
**Maintained By**: DevOps Team
**Version**: 1.0.0
