# Data Warehouse Implementation Guide

**Project**: Enterprise Financial Data Warehouse  
**Timeline**: 12-week phased implementation  
**Last Updated**: 2026-09-28

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Week-by-Week Timeline](#week-by-week-timeline)
3. [Technology Setup](#technology-setup)
4. [Data Ingestion Setup](#data-ingestion-setup)
5. [Transformation & dbt](#transformation--dbt)
6. [Analytics & BI](#analytics--bi)
7. [Compliance & Governance](#compliance--governance)
8. [Monitoring & Alerting](#monitoring--alerting)
9. [Cost Optimization](#cost-optimization)
10. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites
- GCP Project with BigQuery enabled
- Kafka cluster (or Confluent Cloud account)
- Python 3.9+
- Docker & Docker Compose
- dbt CLI installed
- Looker instance (or Looker Studio)

### 1-Hour Setup (Development Environment)

```bash
# Clone warehouse repository
git clone https://github.com/mnb-research/financial-warehouse.git
cd financial-warehouse

# Install dependencies
pip install -r requirements.txt
dbt deps

# Set up local environment
export GCP_PROJECT_ID="your-project-id"
export KAFKA_BOOTSTRAP_SERVERS="localhost:9092"

# Start Kafka locally
docker-compose -f warehouse/kafka_config.yml up -d

# Initialize BigQuery datasets
bq mk --dataset --location=US warehouse_staging
bq mk --dataset --location=US warehouse_conformed
bq mk --dataset --location=US warehouse_analytics

# Deploy schemas
bq query --use_legacy_sql=false < warehouse/schemas.sql

# Test connection
python -m warehouse.tests.test_connection
```

---

## Week-by-Week Timeline

### Phase 1: Foundation (Weeks 1-4)

#### Week 1: Architecture & Setup
- [ ] GCP project setup & billing configuration
- [ ] BigQuery datasets created (staging, conformed, analytics)
- [ ] Service accounts & IAM roles configured
- [ ] Git repository initialized with warehouse code
- [ ] dbt project initialized and connected to BigQuery

**Deliverables**:
- BigQuery project with 3 datasets
- dbt project with profiles.yml configured
- First dbt run successful

**Time**: 8 hours  
**Owner**: Data Engineering Lead

```bash
# Deploy schemas
bq query --use_legacy_sql=false < warehouse/schemas.sql

# Test dbt connection
dbt debug
dbt seed  # Load reference data
dbt run --select stg_*  # Test staging models
```

#### Week 2: Kafka & Streaming Setup
- [ ] Kafka cluster deployed (3 brokers minimum)
- [ ] Schema Registry configured with Avro schemas
- [ ] Kafka topics created (transactions, user_events, subscriptions, compliance)
- [ ] Kafka Connect setup for GCS & BigQuery sinks
- [ ] Producer libraries added to TaxSense, AbroBot, Draftsman

**Deliverables**:
- Production Kafka cluster
- 4 topics with schemas
- BigQuery sink connector operational

**Time**: 16 hours  
**Owner**: Data Infrastructure, Backend Engineers

```bash
# Deploy Kafka
docker-compose -f warehouse/kafka_config.yml up -d

# Create topics
kafka-topics --create --topic transactions \
  --partitions 12 --replication-factor 3

# Verify connectivity
kafka-console-producer --broker-list localhost:9092 \
  --topic transactions --property parse.key=true
```

#### Week 3: ETL Pipelines & Airflow
- [ ] Airflow infrastructure deployed (HA setup on Cloud Run or GKE)
- [ ] DAG created for daily transaction batch load
- [ ] DAG created for real-time Kafka streaming
- [ ] Data quality checks implemented (Great Expectations)
- [ ] First test load from TaxSense production database

**Deliverables**:
- Airflow cluster running
- 3 DAGs deployed (daily batch, real-time, quality)
- First 48 hours of data loaded

**Time**: 20 hours  
**Owner**: Data Engineers

```bash
# Deploy Airflow to Cloud Composer
gcloud composer environments create warehouse-prod \
  --python-version 3 \
  --machine-type n1-standard-4 \
  --node-count 3

# Upload DAGs
gsutil -m cp warehouse/airflow_pipelines.py \
  gs://warehouse-dags-bucket/dags/

# Trigger manual run
airflow dags trigger warehouse_daily_transactions
```

#### Week 4: First Analytics Model
- [ ] dbt models created for core fact/dimension tables
- [ ] Dim_customer model with SCD Type 2 implemented
- [ ] Fct_transactions model deployed
- [ ] First materialized view created (daily_transactions)
- [ ] Data validation tests written

**Deliverables**:
- 5 dbt models in production
- First analytics data available
- Data quality dashboard created

**Time**: 16 hours  
**Owner**: Analytics Engineer

```bash
# Deploy dbt models
dbt run --select tags:daily --target prod
dbt test
dbt docs generate
dbt docs serve  # View documentation at localhost:8000
```

**Phase 1 Summary**:
- ✓ Infrastructure in place
- ✓ Data flowing into warehouse
- ✓ First analytics models live
- ✓ Data quality monitoring started

---

### Phase 2: Integration & Scale (Weeks 5-8)

#### Week 5: Integrate All Products
- [ ] AbroBot transaction ingestion pipeline
- [ ] Draftsman transaction ingestion pipeline
- [ ] Third-party API integrations (payment processors, tax services)
- [ ] Customer dimension enrichment from all products

**Deliverables**:
- All products integrated
- 50+ GB of historical data loaded
- Cross-product analytics possible

**Time**: 24 hours  
**Owner**: Data Engineers, Product Teams

#### Week 6: Advanced Analytics Models
- [ ] Revenue recognition model (IFRS 15)
- [ ] Customer lifetime value (LTV) calculation
- [ ] Subscription retention cohort analysis
- [ ] Churn probability scoring

**Deliverables**:
- 10+ dbt models created
- Executive financial dashboards live
- Revenue analytics in Looker

**Time**: 20 hours  
**Owner**: Analytics Engineers

#### Week 7: Compliance & Governance
- [ ] Data lineage tracking implemented (Neo4j)
- [ ] GDPR compliance framework
- [ ] Audit trail logging
- [ ] Data anonymization pipelines
- [ ] Access control (RBAC) in BigQuery & Looker

**Deliverables**:
- Audit logging production-ready
- GDPR deletion workflows functional
- Data governance dashboard

**Time**: 16 hours  
**Owner**: Security, Compliance, Data Engineers

#### Week 8: Looker Dashboards
- [ ] 20+ dashboards created
- [ ] Self-service analytics portal launched
- [ ] Row-level security (RLS) implemented
- [ ] Performance optimization (materialized views)

**Deliverables**:
- 100+ users with dashboard access
- Looker in production
- Dashboard adoption metrics tracked

**Time**: 20 hours  
**Owner**: Analytics, BI Engineers

**Phase 2 Summary**:
- ✓ All products integrated
- ✓ Advanced analytics live
- ✓ Governance framework operational
- ✓ Executive dashboards in production

---

### Phase 3: Machine Learning (Weeks 9-12)

#### Week 9: ML Features & Training
- [ ] Feature store created (Feast or Tecton)
- [ ] Churn prediction model trained (XGBoost)
- [ ] Revenue forecasting model (Prophet time-series)
- [ ] Model registry & versioning (MLflow)

**Deliverables**:
- 3 models in training
- Feature store operational
- Model performance baseline established

**Time**: 20 hours  
**Owner**: ML Engineers, Data Scientists

#### Week 10: Model Deployment
- [ ] Churn prediction model deployed to Vertex AI
- [ ] Real-time scoring API deployed
- [ ] Batch scoring pipeline created
- [ ] Model monitoring dashboards

**Deliverables**:
- Models serving predictions in production
- Batch scoring runs nightly
- Real-time scoring available via API

**Time**: 16 hours  
**Owner**: ML Engineers

#### Week 11: Anomaly Detection
- [ ] Anomaly detection model trained (Isolation Forests)
- [ ] Alert triggers configured
- [ ] Anomaly dashboard created
- [ ] PagerDuty integration for critical anomalies

**Deliverables**:
- Real-time anomaly detection live
- Alerts configured for key metrics
- False positive rate < 5%

**Time**: 12 hours  
**Owner**: Data Scientists

#### Week 12: Optimization & Handoff
- [ ] Query performance optimization (4-week run)
- [ ] Cost optimization completed (50% target reduction)
- [ ] Documentation updated
- [ ] Team training & knowledge transfer
- [ ] On-call schedule established

**Deliverables**:
- 50% cost reduction achieved
- All documentation complete
- Team ready for production support

**Time**: 16 hours  
**Owner**: Data Infrastructure, Data Teams

**Phase 3 Summary**:
- ✓ ML models in production
- ✓ Anomaly detection live
- ✓ Cost optimized
- ✓ Ready for scale

---

## Technology Setup

### GCP Resources Required

```bash
# 1. Create GCP project
gcloud projects create data-warehouse-prod \
  --billing-account=BILLING_ACCOUNT_ID

# 2. Enable required APIs
gcloud services enable \
  bigquery.googleapis.com \
  dataflow.googleapis.com \
  composer.googleapis.com \
  vertex-ai.googleapis.com \
  pubsub.googleapis.com \
  storage-api.googleapis.com \
  cloudlogging.googleapis.com \
  monitoring.googleapis.com

# 3. Create service accounts
gcloud iam service-accounts create warehouse-sa \
  --display-name="Data Warehouse Service Account"

gcloud iam service-accounts create dbt-sa \
  --display-name="dbt Service Account"

# 4. Grant IAM roles
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member=serviceAccount:warehouse-sa@PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/bigquery.dataEditor

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member=serviceAccount:warehouse-sa@PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/bigquery.user

# 5. Create storage buckets
gsutil mb gs://PROJECT_ID-warehouse/
gsutil mb gs://PROJECT_ID-warehouse-raw/
gsutil mb gs://PROJECT_ID-warehouse-archive/

# 6. Set up Cloud Composer for Airflow
gcloud composer environments create warehouse-prod \
  --location us-central1 \
  --python-version 3 \
  --machine-type n1-standard-4 \
  --node-count 3
```

### dbt Project Setup

```bash
# Initialize dbt project
dbt init financial_warehouse --adapter bigquery

cd financial_warehouse

# Create profiles.yml
cat > ~/.dbt/profiles.yml << EOF
financial_warehouse:
  outputs:
    dev:
      type: bigquery
      method: service-account
      project: PROJECT_ID
      dataset: warehouse_dev
      keyfile: /path/to/keyfile.json
      threads: 4
      timeout_seconds: 300
    prod:
      type: bigquery
      method: service-account
      project: PROJECT_ID
      dataset: warehouse_analytics
      keyfile: /path/to/keyfile.json
      threads: 8
      timeout_seconds: 600
  target: dev
EOF

# Create folders
mkdir -p models/{staging,marts/{finance,product,compliance}}
mkdir -p tests
mkdir -p macros
mkdir -p seeds
```

---

## Data Ingestion Setup

### TaxSense Integration

```python
# In TaxSense application code
from kafka import KafkaProducer
import json
from datetime import datetime

producer = KafkaProducer(
    bootstrap_servers=['kafka:9092'],
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

def emit_transaction(transaction_data):
    """Emit transaction to Kafka for warehouse ingestion"""
    
    event = {
        'transaction_id': transaction_data['id'],
        'source_system': 'taxsense',
        'product_code': 'taxsense-pro',
        'customer_id': transaction_data['customer_id'],
        'amount': float(transaction_data['amount']),
        'currency_code': transaction_data['currency'],
        'transaction_type': transaction_data['type'],
        'status': transaction_data['status'],
        'timestamp': datetime.utcnow().isoformat(),
        'metadata': transaction_data.get('metadata', {})
    }
    
    producer.send('transactions', value=event)
    producer.flush()

# Usage in your transaction processing code
def process_payment(payment_data):
    # ... existing payment processing logic ...
    
    # Emit to warehouse
    emit_transaction({
        'id': payment_data['transaction_id'],
        'customer_id': payment_data['user_id'],
        'amount': payment_data['amount'],
        'currency': 'INR',
        'type': 'SUBSCRIPTION_PAYMENT',
        'status': 'completed',
        'metadata': {
            'plan_id': payment_data['plan_id'],
            'billing_cycle': payment_data['billing_cycle']
        }
    })
```

### Batch Data Load (Initial Historical Load)

```bash
#!/bin/bash
# Script to load historical data from production database

# 1. Extract data from TaxSense production
sqlalchemy_url="postgresql://user:password@prod-db:5432/taxsense"

python -m warehouse.extract.taxsense_extract \
  --db-url "$sqlalchemy_url" \
  --start-date "2024-01-01" \
  --end-date "2026-09-28" \
  --output "gs://PROJECT_ID-warehouse-raw/taxsense-historical/"

# 2. Load to BigQuery staging
bq load \
  --source_format=AVRO \
  --autodetect \
  warehouse_staging.raw_transactions \
  gs://PROJECT_ID-warehouse-raw/taxsense-historical/*.avro

# 3. Verify data
bq query --use_legacy_sql=false \
  "SELECT COUNT(*) as transaction_count FROM warehouse_staging.raw_transactions"
```

---

## Transformation & dbt

### Running dbt Locally

```bash
# Development mode
dbt run --target dev --select models/staging/

# Test data quality
dbt test --select stg_transactions

# Generate documentation
dbt docs generate
dbt docs serve  # http://localhost:8000

# Production deployment
dbt run --target prod --full-refresh  # First time only
dbt run --target prod  # Incremental runs

# Snapshots (SCD tracking)
dbt snapshot --target prod
```

### dbt in Airflow

```python
from airflow.operators.bash import BashOperator

run_dbt = BashOperator(
    task_id='run_dbt',
    bash_command="""
    cd /dbt_project && \
    dbt run \
      --profiles-dir /dbt_project \
      --target prod \
      --select tag:daily \
      --threads 8 \
      --exclude config.materialized:'view'
    """,
)

test_dbt = BashOperator(
    task_id='test_dbt',
    bash_command="""
    cd /dbt_project && \
    dbt test \
      --profiles-dir /dbt_project \
      --target prod \
      --select tag:daily
    """,
)
```

---

## Analytics & BI

### Looker Setup

```yaml
# In Looker Admin Settings

# 1. Create new BigQuery connection
  - name: "warehouse"
    type: "bigquery"
    project_id: "PROJECT_ID"
    dataset: "warehouse_analytics"
    service_account_json: "{{ GOOGLE_SERVICE_ACCOUNT_JSON }}"
    
# 2. Set up scheduled queries
  - name: "Daily Revenue Summary"
    query: "SELECT * FROM warehouse_analytics.mv_monthly_revenue"
    schedule: "0 3 * * *"  # 3 AM daily
    
# 3. Create explores for self-service
  - explore: transactions
    from: fct_transactions
    view_name: transactions
```

### Sample Looker Dashboard

```sql
-- dashboard: finance_executive
# - title: "Revenue Overview"
#   elements:
#     - query: 
#         dimensions: [product, month]
#         measures: [total_revenue, growth_rate]
#         filters:
#           - date: last 12 months
#     - query:
#         dimensions: [customer_segment]
#         measures: [mrr, churn_rate]
#     - query:
#         dimensions: [day]
#         measures: [daily_active_users]
```

---

## Compliance & Governance

### GDPR Implementation

```python
# warehouse/compliance/gdpr.py

from google.cloud import bigquery
from typing import List

class GDPRCompliance:
    """Handles GDPR compliance requests"""
    
    def __init__(self, project_id: str):
        self.client = bigquery.Client(project=project_id)
    
    def get_customer_data(self, customer_id: str) -> dict:
        """Get all data for a specific customer (data subject access)"""
        
        query = f"""
        SELECT * FROM `{self.project_id}.warehouse_analytics.data_lineage`
        WHERE customer_id = '{customer_id}'
        UNION ALL
        SELECT * FROM `{self.project_id}.warehouse_analytics.fct_transactions`
        WHERE customer_id = '{customer_id}'
        """
        
        results = self.client.query(query).result()
        return [dict(row) for row in results]
    
    def delete_customer_data(self, customer_id: str):
        """Delete all data for a customer (right to be forgotten)"""
        
        tables_to_update = [
            'dim_customer',
            'fct_transactions',
            'fct_user_events',
            'fct_subscription_metrics'
        ]
        
        for table in tables_to_update:
            delete_query = f"""
            UPDATE `{self.project_id}.warehouse_analytics.{table}`
            SET customer_id = NULL, customer_email_anonymized = SHA256(customer_id)
            WHERE customer_id = '{customer_id}'
            """
            
            job = self.client.query(delete_query)
            job.result()
        
        # Log compliance event
        self.log_compliance_event(
            event_type='DATA_DELETION',
            customer_id=customer_id,
            status='COMPLETED'
        )

# Usage
compliance = GDPRCompliance('project-id')
compliance.delete_customer_data('customer-123')
```

### Data Lineage Tracking

```python
# warehouse/lineage/lineage_tracker.py

import uuid
from datetime import datetime
from google.cloud import bigquery

class DataLineageTracker:
    """Track data lineage for compliance and debugging"""
    
    def __init__(self, project_id: str):
        self.client = bigquery.Client(project=project_id)
        self.lineage_id = str(uuid.uuid4())
    
    def track_transformation(
        self,
        source_table: str,
        target_table: str,
        transform_name: str,
        row_count: int
    ):
        """Log a data transformation"""
        
        lineage_record = {
            'data_lineage_id': self.lineage_id,
            'source_system': source_table.split('.')[1],
            'source_table': source_table,
            'transform_pipeline': 'airflow-daily-batch',
            'transform_step': transform_name,
            'target_system': target_table.split('.')[1],
            'target_table': target_table,
            'row_count': row_count,
            'transform_timestamp': datetime.utcnow().isoformat(),
            'transform_status': 'COMPLETED'
        }
        
        table_id = f"{self.project_id}.warehouse_analytics.data_lineage"
        errors = self.client.insert_rows_json(table_id, [lineage_record])
        
        if errors:
            raise Exception(f"Lineage tracking failed: {errors}")

# Usage in ETL pipelines
def run_transformation():
    tracker = DataLineageTracker('project-id')
    
    # Run transformation
    result = bigquery.Client().query(...)
    
    # Track it
    tracker.track_transformation(
        source_table='warehouse_staging.raw_transactions',
        target_table='warehouse_conformed.transactions',
        transform_name='validate_and_conform',
        row_count=result.total_rows
    )
```

---

## Monitoring & Alerting

### Data Quality Monitoring

```yaml
# monitoring/data_quality_rules.yaml

rules:
  - name: "transaction_freshness"
    table: "warehouse_staging.raw_transactions"
    check: "SELECT COUNT(*) as violations FROM table WHERE ingestion_timestamp < CURRENT_TIMESTAMP() - INTERVAL 2 HOUR"
    threshold: 0
    severity: CRITICAL
    
  - name: "null_customer_ids"
    table: "warehouse_conformed.transactions"
    check: "SELECT COUNT(*) as violations FROM table WHERE customer_id IS NULL"
    threshold: 0
    severity: CRITICAL
    
  - name: "completeness_check"
    table: "warehouse_analytics.fct_transactions"
    check: "SELECT COUNT(*) as violations FROM table WHERE amount_usd IS NULL"
    threshold: 0
    severity: HIGH
```

### Looker Alerts

```sql
-- Alert: Revenue Drop
# Trigger when daily_revenue < average_last_7_days * 0.8
# Send to: data-alerts@mnb.io

# Alert: Data Freshness
# Trigger when max(etl_load_timestamp) < CURRENT_TIMESTAMP() - INTERVAL 3 HOUR
# Send to: pagerduty

# Alert: Anomaly Detected
# Trigger when anomaly_score > 0.95
# Send to: #data-alerts Slack channel
```

---

## Cost Optimization

### Query Cost Analysis

```bash
# Find most expensive queries
bq query --use_legacy_sql=false \
  'SELECT
    query_info.query_text,
    total_slot_ms / 1000.0 as slot_seconds,
    total_bytes_processed / (1024*1024*1024*1024.0) as gb_processed,
    ROUND(total_bytes_processed / (1024*1024*1024*1024.0) * 6.25, 2) as estimated_cost_usd
  FROM `region-us`.INFORMATION_SCHEMA.JOBS_BY_PROJECT
  WHERE creation_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
  ORDER BY estimated_cost_usd DESC
  LIMIT 20'
```

### Optimization Techniques

1. **Partitioning** - Already implemented (by date)
2. **Clustering** - On frequently filtered columns
3. **Materialized Views** - Pre-computed aggregations
4. **Query Caching** - Enable caching for repeated queries
5. **Scheduled Queries** - Off-peak execution
6. **BI Engine** - For sub-second query performance

```bash
# Estimate query cost before running
bq query --dry_run \
  --use_legacy_sql=false \
  'SELECT COUNT(*) FROM warehouse_analytics.fct_transactions'

# PartitionTime and ClusteringFields already in schemas.sql
```

---

## Troubleshooting

### Common Issues

#### 1. "Permission denied" errors in dbt
```bash
# Check service account permissions
gcloud projects get-iam-policy PROJECT_ID \
  --flatten="bindings[].members" \
  --format='table(bindings.role)' \
  --filter="bindings.members:warehouse-sa@PROJECT_ID.iam.gserviceaccount.com"

# Grant missing roles
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member=serviceAccount:warehouse-sa@PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/bigquery.dataEditor
```

#### 2. "Timeout" in Kafka producers
```python
# Increase timeout in KafkaProducer
producer = KafkaProducer(
    bootstrap_servers=['kafka:9092'],
    request_timeout_ms=30000,  # 30 seconds
    retries=5,
    retry_backoff_ms=100
)
```

#### 3. "Data freshness" alerts firing
```bash
# Check Airflow DAG status
airflow dags list-runs --dag-id warehouse_daily_transactions

# Check specific task
airflow tasks list warehouse_daily_transactions

# Check logs
airflow logs warehouse_daily_transactions extract_taxsense_transactions
```

#### 4. "Row count mismatch" in data quality checks
```sql
-- Compare row counts between source and target
SELECT
  'raw_transactions' as table_name,
  COUNT(*) as row_count,
  COUNT(DISTINCT source_transaction_id) as unique_ids
FROM warehouse_staging.raw_transactions
WHERE _partition_date = CURRENT_DATE()

UNION ALL

SELECT
  'conformed_transactions',
  COUNT(*),
  COUNT(DISTINCT transaction_id)
FROM warehouse_conformed.transactions
WHERE _partition_date = CURRENT_DATE()
```

---

## Next Steps

1. **Week 1**: Customize architecture for your specific products
2. **Week 2**: Deploy infrastructure and run first ETL
3. **Week 4**: Launch first Looker dashboards
4. **Week 8**: Full product integration complete
5. **Week 12**: ML models in production

---

## Support & Resources

- **Documentation**: [docs/warehouse](./docs)
- **Slack**: #data-warehouse
- **On-Call**: See Data Team wiki
- **Email**: data-team@mnb.io

---

## Appendix: Useful Commands

```bash
# BigQuery
bq ls  # List datasets
bq show warehouse_analytics  # Dataset details
bq query --use_legacy_sql=false "SELECT 1"  # Test connection

# dbt
dbt parse  # Check syntax
dbt run-operation macro_name  # Run macros
dbt freshness  # Check source freshness

# Airflow
airflow db init  # Initialize metadata database
airflow webserver  # Start web UI
airflow scheduler  # Start scheduler

# Kafka
kafka-topics --list --bootstrap-server localhost:9092
kafka-console-consumer --bootstrap-server localhost:9092 --topic transactions
```
