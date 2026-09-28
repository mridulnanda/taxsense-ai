# Enterprise Financial Data Warehouse

**Status**: Production-Ready Architecture (Ready for Implementation)  
**Last Updated**: 2026-09-28  
**Project**: Centralized analytics for TaxSense Global, AbroBot, Draftsman, and future products

---

## Overview

This is a comprehensive, enterprise-grade data warehouse architecture for centralizing financial data across the MNB Research product empire. It provides:

✓ **Unified Data Model** - Standardized schemas across all products  
✓ **Real-Time Ingestion** - Kafka streams + batch ETL pipelines  
✓ **Advanced Analytics** - Fact & dimension tables with SCD Type 2  
✓ **Compliance & Governance** - GDPR, audit trails, data lineage  
✓ **ML-Ready** - Feature store for predictive analytics  
✓ **Executive Dashboards** - Looker BI integration  
✓ **Cost Optimized** - Partitioned, clustered, materialized views  

---

## 📁 Architecture Files

### Core Documentation
- **`DATA_WAREHOUSE_ARCHITECTURE.md`** - Complete architectural design (12 sections)
  - Unified data model (8 fact + 5 dimension tables)
  - Real-time & batch ingestion strategies
  - Advanced analytics & ML framework
  - Compliance & governance framework
  - Implementation roadmap (Phase 1-4)

### Implementation Files

#### 1. **Schema Definitions** (`schemas.sql`)
- 3 datasets (staging, conformed, analytics)
- 8 fact tables (transactions, events, subscriptions, revenue, compliance, etc.)
- 5 dimension tables with SCD Type 2 tracking
- Materialized views for performance
- Audit & lineage tables

#### 2. **dbt Transformations** (`dbt_models.yml`, `dbt_sample_models.sql`)
- Complete dbt project configuration
- 25+ transformation models (staging, marts, analytics)
- Data quality tests & validation rules
- Metrics & cohort analysis models
- Compliance & governance models

#### 3. **ETL Orchestration** (`airflow_pipelines.py`)
- 5 production DAGs
  - Daily transaction ingestion (TaxSense, AbroBot, Draftsman)
  - Real-time Kafka streaming
  - Weekly revenue recognition (IFRS 15)
  - Monthly compliance & audit
  - Continuous data quality monitoring

#### 4. **Real-Time Streaming** (`kafka_config.yml`)
- 3-broker Kafka cluster with HA
- Schema Registry & Kafka Connect setup
- 5 topics with Avro schemas
- BigQuery & GCS sink connectors
- Kafka UI for monitoring

#### 5. **Data Access SDK** (`warehouse_sdk.py`)
- Python SDK for easy data access
- Services: Transactions, Subscriptions, Customers, Analytics, Compliance
- 25+ pre-built methods for common queries
- Supports pandas DataFrames & raw queries

#### 6. **Implementation Guide** (`IMPLEMENTATION_GUIDE.md`)
- Week-by-week 12-week implementation plan
- Technology setup instructions
- Data ingestion patterns
- dbt local & production workflows
- Compliance & GDPR implementation
- Monitoring & troubleshooting

---

## 🚀 Quick Start (1 Hour)

### Prerequisites
```bash
# Required
- GCP account with BigQuery
- Python 3.9+
- Docker & Docker Compose
- dbt CLI: pip install dbt-bigquery
```

### Setup
```bash
# 1. Create BigQuery datasets
bq mk --dataset --location=US warehouse_staging
bq mk --dataset --location=US warehouse_conformed
bq mk --dataset --location=US warehouse_analytics

# 2. Deploy schema
bq query --use_legacy_sql=false < warehouse/schemas.sql

# 3. Initialize dbt
dbt debug
dbt seed
dbt run --select stg_*

# 4. Start Kafka (optional, for real-time)
docker-compose -f warehouse/kafka_config.yml up -d

# 5. Test SDK
python -c "from warehouse.warehouse_sdk import Warehouse; wh = Warehouse('your-project'); print(wh.analytics.get_daily_kpis())"
```

---

## 📊 Data Model Overview

### Fact Tables (8)

| Table | Grain | Volume | Use Case |
|-------|-------|--------|----------|
| **fct_transactions** | One row per transaction | 10M-100M/mo | Financial transactions, revenue |
| **fct_subscription_metrics** | One row per subscription per day | 1M/mo | MRR, ARR, churn |
| **fct_user_events** | One row per user event | 100M-1B/mo | Engagement, adoption |
| **fct_revenue_recognition** | One row per revenue event | 1M/mo | Accounting, IFRS 15 |
| **fct_compliance_events** | One row per audit event | 100K/mo | GDPR, audit trail |
| **fct_feature_adoption** | One row per feature activation | 5M/mo | Product analytics |
| **fct_cohort_analysis** | Cohort metrics by month | 10K/mo | Retention, LTV |
| **fct_anomaly_detection** | Detected anomalies | 1K-10K/mo | Risk management |

### Dimension Tables (5)

| Table | Type | Rows | SCD |
|-------|------|------|-----|
| **dim_customer** | Entity | 100K-1M | Type 2 |
| **dim_product** | Reference | 50-100 | Type 1 |
| **dim_date** | Time | 40K | Type 1 |
| **dim_geography** | Reference | 10K | Type 1 |
| **dim_payment_method** | Reference | 100 | Type 1 |

---

## 🔄 Data Flow

```
Source Systems          Integration Layer      Warehouse                 Analytics
(TaxSense,     →  Kafka + Batch ETL    →  BigQuery      →  Looker
AbroBot,              (Airflow)          (Staged/Analytics)   Dashboards
Draftsman)                                                   Reports
                                          dbt
                     ↓                   Transforms
                 Schema Validation      (Fact/Dim)
                 Data Quality Checks    Lineage Tracking
```

---

## 🛠️ Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Data Warehouse** | BigQuery | Scalable, serverless OLAP |
| **Real-Time Ingestion** | Kafka + Schema Registry | Event streaming |
| **Batch ETL** | Apache Airflow | Orchestration & scheduling |
| **Transformation** | dbt + SQL | Analytics engineering |
| **Quality** | Great Expectations | Data validation |
| **ML** | Vertex AI | Model training & deployment |
| **BI/Analytics** | Looker | Self-service dashboards |
| **Data Access** | Python SDK | Programmatic queries |
| **Monitoring** | Datadog + Cloud Logging | Observability |

---

## 📋 Implementation Phases

### Phase 1: Foundation (Weeks 1-4)
- GCP setup & BigQuery datasets
- Kafka infrastructure
- Daily batch ETL pipeline
- First 5 dbt models
- Data quality framework

**Cost**: ~$5K-8K  
**Effort**: 80 hours  
**Deliverable**: Core warehouse operational

### Phase 2: Integration (Weeks 5-8)
- All products integrated
- Advanced analytics models
- Compliance & governance
- Looker dashboards (20+)
- RBAC & access control

**Cost**: ~$8K-12K  
**Effort**: 80 hours  
**Deliverable**: Multi-product analytics platform

### Phase 3: ML & Advanced Analytics (Weeks 9-12)
- ML feature store
- Churn prediction model
- Revenue forecasting
- Anomaly detection
- Optimization & cost reduction

**Cost**: ~$10K-15K  
**Effort**: 60 hours  
**Deliverable**: Predictive analytics platform

---

## 📚 Key Features

### Real-Time Analytics
- Sub-second query performance via BI Engine
- Materialized views for common aggregations
- Kafka-to-BigQuery streaming (5-minute latency)

### Compliance & Governance
- Complete audit trail (GDPR-compliant)
- Data lineage tracking (Neo4j)
- Automated deletion workflows (Right to be Forgotten)
- Row-level security (Looker RLS)
- 7-year retention for audit logs

### Predictive Analytics
- Churn prediction (weekly updates)
- Revenue forecasting (12-month outlook)
- Anomaly detection (real-time)
- Cohort retention analysis
- Customer lifetime value calculation

### Cost Optimization
- Partitioning by date (90-day retention in staging)
- Clustering on frequently filtered columns
- Materialized views for 80% query cache
- Scheduled queries at off-peak hours
- Expected cost: $73K-120K/year for 100GB+ warehouse

---

## 🔒 Security & Compliance

### Data Protection
- Encryption at rest (BigQuery default)
- TLS for all data in transit
- Column-level encryption for PII (customer email, phone)
- Anonymization for analytics queries

### Access Control
- IAM-based roles (viewer, editor, admin)
- Looker RLS by customer & product
- Service accounts for automated pipelines
- MFA for sensitive operations

### Compliance
- **GDPR**: Deletion workflows, data subject access requests
- **SOC 2**: Audit logging, access controls
- **HIPAA**: Data segregation (if healthcare data)
- **Financial**: Audit trail, immutable records

---

## 📈 Analytics & KPIs

### Financial Metrics
- Daily Revenue, MRR, ARR
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- Churn Rate
- Expansion Revenue

### Product Metrics
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Feature Adoption Rate
- Form Completion Rate
- Error Rates by Product

### Operational Metrics
- Data Freshness (ingestion lag)
- Query Performance (p95 latency)
- Pipeline Success Rate
- Data Quality Score

---

## 🚦 Getting Started

### Step 1: Review Architecture (30 min)
```bash
# Read the comprehensive architecture document
less DATA_WAREHOUSE_ARCHITECTURE.md
```

### Step 2: Deploy Infrastructure (2 hours)
```bash
# Set up GCP & BigQuery
export PROJECT_ID="your-gcp-project"
bash warehouse/setup/deploy_infrastructure.sh $PROJECT_ID
```

### Step 3: Load Initial Data (30 min)
```bash
# Deploy schema & load seed data
bq query --use_legacy_sql=false < warehouse/schemas.sql
dbt seed --target prod
```

### Step 4: Run First ETL (15 min)
```bash
# Deploy Airflow DAG
airflow dags trigger warehouse_daily_transactions
```

### Step 5: Create Dashboards (1 hour)
```bash
# See IMPLEMENTATION_GUIDE.md for Looker dashboard setup
```

---

## 📖 Documentation

| Document | Purpose | Read Time |
|----------|---------|-----------|
| `DATA_WAREHOUSE_ARCHITECTURE.md` | Complete architectural design | 45 min |
| `IMPLEMENTATION_GUIDE.md` | Week-by-week implementation plan | 30 min |
| `warehouse/dbt_models.yml` | dbt configuration & models | 20 min |
| `warehouse/airflow_pipelines.py` | ETL pipeline code | 25 min |
| `warehouse/warehouse_sdk.py` | Python SDK documentation | 20 min |

---

## 💻 SDK Usage Examples

### Example 1: Get Daily KPIs
```python
from warehouse.warehouse_sdk import Warehouse

wh = Warehouse('taxsense-ai')
kpis = wh.analytics.get_daily_kpis()

print(f"Daily Revenue: ${kpis['daily_revenue']}")
print(f"Active Customers: {kpis['daily_active_customers']}")
```

### Example 2: Get Churn Predictions
```python
# Find customers likely to churn
churn_risk = wh.subscriptions.get_churn_prediction(
    days_ahead=30,
    min_probability=0.7
)

for _, customer in churn_risk.iterrows():
    print(f"{customer['customer_name']}: {customer['churn_probability_score']:.1%} risk")
```

### Example 3: Revenue Analysis
```python
# Get MRR by product
mrr = wh.subscriptions.get_monthly_recurring_revenue()

for product, metrics in mrr.items():
    print(f"{product}: ${metrics['mrr']:,.0f} MRR")
```

### Example 4: Customer Details
```python
# Get customer lifetime value
customer = wh.customers.get_customer('cust-123')
ltv = wh.customers.get_customer_lifetime_value('cust-123')

print(f"{customer['customer_name']}: ${ltv:,.0f} LTV")
```

### Example 5: Custom Query
```python
# Run custom SQL
top_products = wh.query("""
    SELECT
        p.product_name,
        COUNT(*) as transactions,
        SUM(amount_usd) as revenue
    FROM warehouse_analytics.fct_transactions ft
    JOIN warehouse_analytics.dim_product p ON ft.product_sk = p.product_sk
    WHERE ft._partition_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
    GROUP BY product_name
    ORDER BY revenue DESC
""", to_pandas=True)

print(top_products)
```

---

## 🔧 Configuration

### Environment Variables
```bash
export GCP_PROJECT_ID="taxsense-ai"
export KAFKA_BOOTSTRAP_SERVERS="kafka:9092"
export BQ_DATASET_STAGING="warehouse_staging"
export BQ_DATASET_ANALYTICS="warehouse_analytics"
export LOOKER_API_URL="https://looker.mnb.io/api"
```

### dbt Profiles
```yaml
# ~/.dbt/profiles.yml
financial_warehouse:
  outputs:
    dev:
      type: bigquery
      project: taxsense-ai
      dataset: warehouse_dev
      keyfile: ~/.gcp/keyfile.json
      threads: 4
    prod:
      type: bigquery
      project: taxsense-ai
      dataset: warehouse_analytics
      keyfile: ~/.gcp/keyfile.json
      threads: 8
  target: dev
```

---

## 📊 Monitoring & Alerts

### Key Metrics to Monitor
- **Data Freshness**: Max ingestion lag < 2 hours
- **Data Quality**: Validation pass rate > 99.5%
- **Query Performance**: P95 latency < 2 seconds
- **Pipeline Reliability**: Success rate > 99%
- **Cost**: < $120K/year (or 50% reduction from current)

### Alert Channels
- **Critical**: PagerDuty + Email
- **High**: Slack #data-alerts
- **Medium**: Looker dashboard only
- **Low**: Weekly report

---

## 🆘 Troubleshooting

### Common Issues

**Q: BigQuery queries are slow**  
A: Check if table is partitioned and clustered. Enable BI Engine for materialized views.

**Q: Kafka lag is increasing**  
A: Check consumer group lag via Kafka UI. Increase consumer threads in Airflow DAG.

**Q: GDPR deletion failing**  
A: Verify data lineage is complete. Check for orphaned references in fact tables.

**Q: dbt test failures**  
A: Run `dbt debug` to check connection. Review test logs in `target/compiled`.

See `IMPLEMENTATION_GUIDE.md` for detailed troubleshooting guide.

---

## 📝 Contributing

To contribute to the data warehouse:

1. Create a branch: `git checkout -b feature/new-model`
2. Make changes (dbt models, schemas, pipelines)
3. Test locally: `dbt test --select your_model`
4. Create pull request with documentation
5. Merge after code review & CI passing

---

## 📞 Support

- **Slack**: #data-warehouse
- **Email**: data-team@mnb.io
- **Wiki**: [Data Team Documentation](https://wiki.mnb.io/data)
- **On-Call**: See Data Team schedule

---

## 📋 Checklist: Getting Started

- [ ] Read `DATA_WAREHOUSE_ARCHITECTURE.md` (45 min)
- [ ] Review `IMPLEMENTATION_GUIDE.md` (30 min)
- [ ] Set up GCP project & BigQuery (30 min)
- [ ] Deploy schemas: `bq query < schemas.sql` (5 min)
- [ ] Initialize dbt: `dbt debug && dbt seed` (10 min)
- [ ] Run sample ETL: `airflow dags trigger warehouse_daily_transactions` (5 min)
- [ ] Test SDK: `python -m warehouse.warehouse_sdk` (5 min)
- [ ] Create first Looker dashboard (1 hour)

**Total Time: 3 hours to operational warehouse**

---

## 📅 Roadmap

**Q4 2026**:
- Production warehouse live (Phase 1)
- All products integrated (Phase 2)
- Executive dashboards active

**Q1 2027**:
- ML models in production (Phase 3)
- Cost optimizations complete
- Advanced analytics maturity

**Q2 2027**:
- Data marketplace (self-service)
- Real-time dashboards (sub-second)
- Multi-product insights

---

## 📄 License

Internal use only - MNB Research proprietary

---

## 📞 Questions?

For questions or issues:
1. Check `IMPLEMENTATION_GUIDE.md` troubleshooting section
2. Search existing GitHub issues
3. Post in #data-warehouse Slack
4. Email data-team@mnb.io

---

**Last Updated**: 2026-09-28  
**Status**: Ready for Production Implementation  
**Version**: 1.0.0
