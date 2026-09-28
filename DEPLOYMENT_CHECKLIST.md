# TaxSense AI - Deployment Checklist

## Pre-Deployment

### Infrastructure Prerequisites
- [ ] AWS account with appropriate permissions
- [ ] Terraform state S3 bucket created
- [ ] GitHub repository with secrets configured
- [ ] Docker registry (ghcr.io) access configured
- [ ] PostgreSQL RDS instance details noted
- [ ] Redis cluster details noted

### Team & Permissions
- [ ] All team members have AWS CLI configured
- [ ] GitHub organization members have repo access
- [ ] PagerDuty on-call schedule established
- [ ] Slack channel for incidents created (#devops-incidents)
- [ ] Communication plan documented

### Documentation
- [ ] Architecture diagrams reviewed
- [ ] Deployment procedures documented
- [ ] Runbook for incident response prepared
- [ ] SLO targets agreed upon
- [ ] Change management policy reviewed

---

## Development Environment Setup

### Local Development

```bash
# 1. Clone repository
git clone https://github.com/taxsense/taxsense-ai.git
cd taxsense-ai

# 2. Setup environment variables
cp .env.example .env
# Edit .env with your values

# 3. Install dependencies
npm install

# 4. Start development environment
docker-compose -f docker/docker-compose.yml up -d

# 5. Run migrations
npm run migrate:up

# 6. Start application
npm run dev
```

**Checklist:**
- [ ] Application running at http://localhost:3000
- [ ] Database accessible at localhost:5432
- [ ] Redis accessible at localhost:6379
- [ ] Kibana accessible at http://localhost:5601
- [ ] Grafana accessible at http://localhost:3001

---

## Staging Deployment

### Pre-Deployment Checks

- [ ] All tests passing in GitHub Actions
- [ ] Security scans completed with no critical issues
- [ ] Code reviewed and approved
- [ ] Database migrations tested locally
- [ ] Performance benchmarks within acceptable range
- [ ] Dependency updates reviewed

### Deploy to Staging

```bash
# 1. Create Terraform workspace
terraform workspace new staging
terraform workspace select staging

# 2. Plan infrastructure
terraform plan -var-file=environments/staging.tfvars -out=tfplan

# 3. Apply infrastructure
terraform apply tfplan

# 4. Get kubeconfig
aws eks update-kubeconfig --region us-east-1 --name taxsense-staging

# 5. Deploy application
kubectl apply -f k8s/namespace.yml
helm install taxsense helm/ \
  --namespace taxsense-staging \
  -f helm/values-staging.yaml

# 6. Verify deployment
kubectl get pods -n taxsense-staging
kubectl logs -n taxsense-staging deployment/taxsense-app --follow
```

**Checklist:**
- [ ] All pods running and healthy
- [ ] Services accessible via load balancer
- [ ] Database migrations completed successfully
- [ ] Application logs show no errors
- [ ] Health checks passing (200 OK)
- [ ] Load balancer responding to HTTPS requests

### Staging Testing

```bash
# 1. Smoke tests
kubectl run smoke-tests --image=taxsense:staging-$SHA \
  --rm -it -n taxsense-staging -- npm run test:smoke

# 2. Integration tests
kubectl run integration-tests --image=taxsense:staging-$SHA \
  --rm -it -n taxsense-staging -- npm run test:integration

# 3. Load testing
k6 run load-tests/api.js --vus 50 --duration 5m \
  --env TARGET_URL=https://staging.taxsense.ai
```

**Checklist:**
- [ ] All smoke tests passed
- [ ] Integration tests passed
- [ ] Load test metrics acceptable
- [ ] No memory leaks detected
- [ ] Database queries performant

---

## Production Deployment

### Pre-Production Checklist

**72 Hours Before Deployment:**
- [ ] Deployment window scheduled and communicated
- [ ] Team members assigned to support
- [ ] On-call engineer prepared
- [ ] Rollback procedure tested
- [ ] Customer support notified of maintenance window
- [ ] External dependencies verified (payment providers, APIs)

**24 Hours Before Deployment:**
- [ ] Database backup created and tested
- [ ] Backup restoration procedure verified
- [ ] Terraform workspace created (prod)
- [ ] All secrets configured in AWS Secrets Manager
- [ ] CloudFront cache configured for invalidation
- [ ] Monitoring and alerting configured

**1 Hour Before Deployment:**
- [ ] Team in war room (Slack, video call)
- [ ] Monitoring dashboards open
- [ ] Production database backed up (final)
- [ ] Rollback procedure reviewed with team
- [ ] Change log updated

### Deploy to Production

```bash
# 1. Authenticate to AWS
aws sts get-caller-identity

# 2. Select Terraform workspace
terraform workspace select prod

# 3. Plan infrastructure changes
terraform plan -var-file=environments/prod.tfvars -out=tfplan

# 4. Review and apply changes
terraform apply tfplan

# 5. Get production kubeconfig
aws eks update-kubeconfig --region us-east-1 --name taxsense-prod

# 6. Create database backup
./scripts/backup.sh full prod

# 7. Run database migrations
kubectl run migrate-$(date +%s) \
  --image=taxsense:prod-$SHA \
  --rm -it -n taxsense -- npm run migrate:up

# 8. Blue-Green Deployment
kubectl set image deployment/taxsense-app \
  taxsense-app=ghcr.io/taxsense/taxsense:prod-$SHA \
  -n taxsense

# 9. Wait for rollout
kubectl rollout status deployment/taxsense-app -n taxsense --timeout=10m

# 10. Verify deployment
kubectl get pods -n taxsense
curl -I https://app.taxsense.ai/api/health
```

**Deployment Checklist:**
- [ ] All pods running with new image
- [ ] Health checks passing
- [ ] Application responding to requests
- [ ] Database migrations applied successfully
- [ ] No errors in application logs
- [ ] Monitoring metrics nominal
- [ ] Error rate < 0.1%
- [ ] Latency p95 < 500ms

### Post-Deployment Verification

```bash
# 1. API endpoint health checks
curl -I https://app.taxsense.ai/api/health
curl -I https://app.taxsense.ai/api/ready

# 2. Database connectivity
psql -h <rds-endpoint> -U taxsense -d taxsense -c "SELECT 1;"

# 3. Cache connectivity
redis-cli -h <redis-endpoint> PING

# 4. Check metrics
# - Visit Grafana dashboard
# - Verify request rates, error rates, latency
# - Check database connection pool

# 5. Check logs
kubectl logs -n taxsense deployment/taxsense-app --tail=100

# 6. Run smoke tests
kubectl run smoke-tests --image=taxsense:prod-$SHA \
  --rm -it -n taxsense -- npm run test:smoke

# 7. Monitor error rates
# Check Sentry, Prometheus, or your error tracking service
```

**Post-Deployment Checklist:**
- [ ] Health endpoints responding (200 OK)
- [ ] API endpoints responding normally
- [ ] Database queries executing successfully
- [ ] Cache hit rates nominal
- [ ] Error rate < 0.1%
- [ ] Latency metrics normal
- [ ] No spike in exceptions
- [ ] CDN serving content correctly
- [ ] SSL certificates valid
- [ ] Monitoring showing data points

### Team Communication

**Slack Notification:**
```
🚀 Production Deployment Complete

Version: v1.2.3
Commit: abc123def456
Deployed: 2026-09-28 14:30 UTC
Status: ✅ Healthy

Health Check: https://app.taxsense.ai/api/health
Monitoring: https://grafana.taxsense.ai/dashboards
Logs: https://kibana.taxsense.ai/

Issues? @devops-oncall
```

---

## Rollback Procedures

### Automatic Rollback (Immediate)

**If 5% error rate detected:**
```bash
kubectl rollout undo deployment/taxsense-app -n taxsense
kubectl rollout status deployment/taxsense-app -n taxsense
```

### Manual Rollback

```bash
# 1. Get previous image version
kubectl rollout history deployment/taxsense-app -n taxsense

# 2. Rollback to previous version
kubectl rollout undo deployment/taxsense-app \
  --to-revision=<revision-number> \
  -n taxsense

# 3. Verify rollback
kubectl get pods -n taxsense
kubectl logs -n taxsense deployment/taxsense-app --tail=50

# 4. If database migration caused issue, rollback migration
npm run migrate:down -- --steps=1
```

**Rollback Checklist:**
- [ ] Previous version verified in registry
- [ ] Rollback command executed
- [ ] Pods successfully restarted with old image
- [ ] Health checks passing
- [ ] Error rate returned to normal
- [ ] Team notified
- [ ] Post-incident review scheduled

---

## Monitoring & Alerts

### Alert Channels

**Critical (Page On-Call):**
- Availability < 99%
- Error rate > 1%
- Response time p95 > 1000ms
- Database connection pool > 90%

**Warning (Slack Notification):**
- Availability < 99.5%
- Error rate > 0.5%
- Response time p95 > 500ms
- CPU utilization > 80%

**Info (Dashboard Only):**
- Deployment events
- Configuration changes
- Cache hit rate drops

### Daily Monitoring Tasks

- [ ] Check error rate trends
- [ ] Review slow query logs
- [ ] Monitor disk usage on all systems
- [ ] Check database backup completion
- [ ] Review security logs for anomalies

### Weekly Review

- [ ] Performance trends analysis
- [ ] Capacity planning review
- [ ] Test backup restoration
- [ ] Review incident logs
- [ ] Update runbooks if needed

---

## Incident Response

### Incident Severity Levels

**CRITICAL** (P1): Service completely unavailable
**HIGH** (P2): Service partially unavailable or severely degraded
**MEDIUM** (P3): Service degraded but functional
**LOW** (P4): Non-critical functionality affected

### Incident Response Steps

1. **Declare Incident** → Create #incident channel in Slack
2. **Assemble Team** → Notify on-call engineer, TL, DevOps
3. **Assess Impact** → Determine severity and scope
4. **Mitigate** → Apply immediate fixes (restart, rollback, scale)
5. **Investigate** → Identify root cause
6. **Communicate** → Update status page and stakeholders
7. **Resolve** → Apply permanent fix
8. **Document** → Post-incident review within 24 hours

---

## Success Criteria

**Deployment is considered successful when:**
- ✅ All pods healthy and running (replicas == ready)
- ✅ Health endpoints returning 200 OK
- ✅ No critical errors in application logs
- ✅ Error rate < 0.1%
- ✅ API latency p95 < 500ms
- ✅ Database and cache connectivity verified
- ✅ All smoke tests passing
- ✅ Monitoring shows normal metrics
- ✅ CDN content serving correctly
- ✅ SSL certificates valid

---

## Contacts & Escalation

| Role | Name | Email | On-Call Schedule |
|------|------|-------|------------------|
| DevOps Lead | TBD | devops-lead@taxsense.ai | Mon-Fri |
| On-Call Engineer | TBD | oncall@taxsense.ai | 24/7 |
| Engineering Manager | TBD | manager@taxsense.ai | Business hours |
| CTO | Mridul Nanda | mridul@taxsense.ai | Escalation |

**Emergency Contact:** +1-XXX-XXX-XXXX (TBD)

---

## Version History

| Version | Date | Changes | Deployed By |
|---------|------|---------|------------|
| 1.0.0 | 2026-09-28 | Initial infrastructure setup | DevOps Team |

---

**Last Updated:** 2026-09-28
**Maintained By:** DevOps Team
**Next Review:** 2026-10-28
