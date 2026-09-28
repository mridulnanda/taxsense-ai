# Enterprise Financial Data Warehouse Architecture

**Last Updated**: 2026-09-28  
**Scope**: Centralized analytics for TaxSense Global, AbroBot, Draftsman, and future products

---

## 1. Executive Overview

This data warehouse centralizes financial intelligence across all products:
- **Tax Products**: TaxSense Global, ITR-Pro
- **Education**: AbroBot (study-abroad)
- **Document AI**: Draftsman (SOP analysis)
- **Future**: Accounting, Payroll, HR products

**Key Objectives**:
✓ Single source of truth for financial data  
✓ Real-time analytics & dashboards  
✓ Regulatory compliance automation  
✓ Predictive analytics & ML-ready data  
✓ Multi-tenant data isolation  

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Data Sources (Operational)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │TaxSense  │ │ AbroBot  │ │Draftsman │ │Third-     │           │
│  │ (SaaS)   │ │ (SaaS)   │ │  (SaaS)  │ │ party API │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└──────────────────────────────────────────────────────────────────┘
           ↓              ↓              ↓              ↓
┌──────────────────────────────────────────────────────────────────┐
│                   Data Integration Layer                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐   │
│  │  Kafka Ingestion │  │  Batch ETL       │  │  API Adapters│   │
│  │  (Real-time)     │  │  (Airflow)       │  │  (GraphQL)   │   │
│  └──────────────────┘  └──────────────────┘  └──────────────┘   │
└──────────────────────────────────────────────────────────────────┘
           ↓              ↓              ↓
┌──────────────────────────────────────────────────────────────────┐
│              Data Quality & Transformation                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐   │
│  │  Schema Registry │  │  Data Validation │  │ De-duplication  │
│  │  (Avro)          │  │  (Great Expects) │  │ & Enrichment │   │
│  └──────────────────┘  └──────────────────┘  └──────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────────┐
│                  Data Warehouse (BigQuery)                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            Unified Fact & Dimension Tables              │   │
│  │  Fact: Transactions, Revenue, Users, Submissions        │   │
│  │  Dim:  Time, Geography, Products, Customers, Merchants  │   │
│  │                                                          │   │
│  │  Historical Layer: Slowly Changing Dimensions (SCD)     │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Staging Layer (Raw + Conformed)            │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────────┐
│                   Analytics & BI Layer                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐   │
│  │  Looker Dashboards  │  │ dbt Models      │  │ Tableau    │   │
│  │  (Real-time KPIs)   │  │ (Transformations)  │ Reports    │   │
│  └──────────────────┘  └──────────────────┘  └──────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────────┐
│              Advanced Analytics & ML Layer                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐   │
│  │ Vertex AI Models │  │  Forecasting     │  │ Anomaly      │   │
│  │ (TensorFlow)     │  │  (Time-series)   │  │ Detection    │   │
│  └──────────────────┘  └──────────────────┘  └──────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Unified Data Model

### 3.1 Fact Tables

#### `fact_transactions`
Central transaction hub for all financial movements across products.

```
fact_transactions:
├── transaction_id (PK)
├── transaction_type_id (FK)
├── source_system_id (FK) → product/system origin
├── product_id (FK)
├── customer_id (FK)
├── merchant_id (FK) [nullable]
├── amount_local_currency
├── amount_usd (normalized)
├── currency_code
├── transaction_date
├── processing_date
├── settlement_date
├── status (pending, completed, failed, reversed)
├── metadata_json
├── created_at
├── updated_at
├── etl_load_timestamp
├── data_lineage_id (FK)
```

**Grain**: One row per financial transaction across all systems
**Volume**: ~10M-100M rows/month
**Partitioning**: By `transaction_date` (daily)
**Clustering**: `customer_id`, `product_id`, `transaction_type_id`

#### `fact_subscription_metrics`
Recurring revenue and subscription lifecycle events.

```
fact_subscription_metrics:
├── subscription_metric_id (PK)
├── subscription_id (FK)
├── product_id (FK)
├── customer_id (FK)
├── metric_date
├── monthly_recurring_revenue (MRR)
├── annual_recurring_revenue (ARR)
├── subscription_status (active, churned, paused, upgraded)
├── customer_lifetime_value
├── churn_probability_score
├── created_at
├── etl_load_timestamp
```

#### `fact_user_events`
User behavior and engagement across all platforms.

```
fact_user_events:
├── event_id (PK)
├── user_id (FK)
├── product_id (FK)
├── event_type (login, form_submission, file_upload, api_call)
├── event_timestamp
├── session_id
├── page_url
├── duration_seconds
├── device_id (FK)
├── ip_address (anonymized)
├── status (success, error)
├── error_code [nullable]
├── metadata_json
├── created_at
├── etl_load_timestamp
```

#### `fact_revenue_recognition`
Accounting & revenue recognition per IFRS 15.

```
fact_revenue_recognition:
├── revenue_id (PK)
├── transaction_id (FK)
├── customer_id (FK)
├── product_id (FK)
├── revenue_amount
├── revenue_date
├── recognition_status (unrecognized, partially_recognized, recognized)
├── performance_obligation_id (FK)
├── revenue_category (subscription, one-time, professional_services)
├── tax_jurisdiction (FK)
├── deferred_revenue_amount
├── created_at
├── updated_at
├── etl_load_timestamp
```

#### `fact_compliance_events`
Audit trail for all compliance-related activities.

```
fact_compliance_events:
├── compliance_event_id (PK)
├── event_type (data_access, data_export, data_deletion, policy_change)
├── user_id (FK)
├── customer_id (FK)
├── resource_id
├── action (read, write, delete)
├── timestamp
├── ip_address (anonymized)
├── justification
├── approved_by (FK)
├── status (pending, approved, rejected)
├── created_at
├── etl_load_timestamp
```

---

### 3.2 Dimension Tables

#### `dim_customer`
Slowly Changing Dimension (SCD Type 2) for customer attributes.

```
dim_customer (SCD Type 2):
├── customer_sk (PK - Surrogate Key)
├── customer_id (Business Key)
├── customer_name
├── customer_email
├── company_name
├── industry_code
├── country
├── state_province
├── timezone
├── signup_date
├── customer_type (individual, enterprise, partner)
├── customer_segment (SMB, mid-market, enterprise)
├── annual_contract_value (ACV)
├── churn_risk_score
├── is_current (Y/N)
├── effective_date (SCD)
├── end_date (SCD)
├── created_at
├── updated_at
```

#### `dim_product`
Product catalog and metadata.

```
dim_product:
├── product_sk (PK)
├── product_id (Business Key)
├── product_name
├── product_code
├── product_category (tax, accounting, education, ai, compliance)
├── product_tier (free, pro, enterprise)
├── launch_date
├── sunset_date [nullable - for deprecated products]
├── pricing_model (subscription, usage-based, one-time)
├── is_active (Y/N)
├── feature_json
├── created_at
├── updated_at
```

#### `dim_time`
Time dimension for temporal analysis.

```
dim_time:
├── date_key (YYYYMMDD)
├── date
├── day_of_week
├── week_of_year
├── month
├── quarter
├── fiscal_year
├── fiscal_quarter
├── is_weekend (Y/N)
├── is_holiday (Y/N)
├── holiday_name [nullable]
```

#### `dim_geography`
Geographic dimension with hierarchies.

```
dim_geography:
├── geography_sk (PK)
├── geography_id
├── country_code
├── country_name
├── state_code
├── state_name
├── city
├── postal_code
├── region
├── timezone
├── tax_jurisdiction
├── regulatory_framework (GST, VAT, Sales Tax)
├── created_at
├── updated_at
```

#### `dim_payment_method`
Payment method tracking.

```
dim_payment_method:
├── payment_method_sk (PK)
├── payment_method_id
├── payment_type (credit_card, debit_card, bank_transfer, upi, wallet)
├── provider (stripe, razorpay, wise, etc.)
├── is_recurring (Y/N)
├── is_active (Y/N)
├── created_at
├── updated_at
```

---

## 4. Data Integration Strategy

### 4.1 Real-Time Streaming (Kafka)

**Topics**:
- `transactions`: All financial transactions
- `user.events`: User behavior events
- `subscription.changes`: Subscription lifecycle
- `compliance.events`: Audit trail

**Schema Registry**: Avro with versioning
**Consumer Groups**: 
- `warehouse-consumer` → BigQuery staging
- `analytics-consumer` → Real-time dashboards
- `ml-consumer` → Feature store

### 4.2 Batch ETL (Apache Airflow)

**Daily Pipelines** (runs at 2 AM UTC):
1. Extract from operational databases (SQL queries)
2. Transform with dbt (data modeling)
3. Load to BigQuery staging
4. Run data quality checks (Great Expectations)
5. Execute dimensional updates (SCD processing)
6. Generate audit logs

**Weekly Pipelines** (Sunday midnight UTC):
1. Financial close processes
2. Revenue recognition calculations
3. Subscription metrics aggregation
4. Customer cohort analysis

**Monthly Pipelines** (1st of month, 3 AM UTC):
1. Compliance reporting
2. Regulatory export preparation
3. Audit trail archival
4. Data retention policy enforcement

### 4.3 API Integration

**Real-Time API Polling** (every 5 minutes):
- Tax authority updates
- Regulatory framework changes
- Exchange rates (for multi-currency)
- Industry benchmarks

---

## 5. Data Quality Framework

### Validation Rules

**Schema Validation**:
- All required fields present
- Data types match definition
- No invalid enum values

**Business Rules**:
- Amount > 0 for credit transactions
- Transaction date ≤ processing date
- Customer exists in dim_customer
- Product exists in dim_product

**Completeness**:
- No NULL in key fields (except nullable ones)
- >95% completeness for all fact tables

**Freshness**:
- Transactions loaded within 2 hours of creation
- Daily batch completes before 4 AM UTC

**Uniqueness**:
- No duplicate transaction_ids
- No duplicate customer_ids within time period

### Implementation
- **Tool**: Great Expectations (Python-based)
- **Monitoring**: Data quality dashboards in Looker
- **Alerts**: PagerDuty for critical failures

---

## 6. Analytics Models

### 6.1 KPI Models (dbt)

```
models:
├── staging/
│   ├── stg_transactions.sql
│   ├── stg_customers.sql
│   └── stg_subscriptions.sql
├── marts/
│   ├── finance/
│   │   ├── fct_revenue.sql
│   │   ├── fct_payment_flow.sql
│   │   └── dim_customers.sql
│   ├── product/
│   │   ├── fct_user_events.sql
│   │   ├── fct_feature_adoption.sql
│   │   └── fct_engagement_metrics.sql
│   └── compliance/
│       ├── fct_audit_trail.sql
│       └── fct_data_lineage.sql
```

### 6.2 Core Analytics Metrics

**Product Metrics**:
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Feature adoption rates
- Form completion rates
- File upload volumes

**Financial Metrics**:
- Monthly Recurring Revenue (MRR)
- Annual Recurring Revenue (ARR)
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- Churn rate
- Expansion revenue

**Operational Metrics**:
- Processing time (avg, p95, p99)
- Error rates by transaction type
- API response times
- System uptime

---

## 7. Compliance & Governance

### 7.1 Data Lineage

**Tracking Approach**:
1. Every transform records its lineage ID
2. Lineage graph stored in Neo4j
3. Source → Transform → Destination mapping

**Use Cases**:
- Impact analysis: "Which reports break if this table changes?"
- Audit trail: "Trace this metric back to source"
- Compliance: "Find all data related to this customer"

### 7.2 GDPR Compliance

**Right to Be Forgotten**:
1. Receive deletion request
2. Query data_lineage to find all references
3. Mark customer records as deleted (logical)
4. Run reconciliation to verify deletion
5. Generate deletion certificate

**Data Anonymization**:
- PII fields: Encrypted at rest, anonymized for analysis
- Email, phone: Hashed for analytics
- IP address: Anonymized to country/state level

### 7.3 Access Control (RBAC)

**Roles**:
- `executive`: All dashboards, aggregated data only
- `analyst`: Analytics models, no PII
- `finance`: Revenue, payment data
- `compliance`: Audit trails, deletion requests
- `developer`: Full access to dev warehouse

**Implementation**:
- BigQuery IAM policies
- Looker role-based access
- API authentication tokens

### 7.4 Audit Logging

**Captured Events**:
- Data access (which analyst accessed which table)
- Data exports (when and what was exported)
- Configuration changes (ETL schedule changes)
- Model updates (dbt deployments)

**Retention**: 7 years (regulatory requirement)

---

## 8. Advanced Analytics & ML

### 8.1 Predictive Models

**Churn Prediction**:
- Target: Customer will churn in next 30 days
- Features: Usage patterns, support tickets, billing issues
- Model: Gradient boosting (XGBoost)
- Retrain: Weekly

**Revenue Forecasting**:
- Target: MRR for next 12 months
- Features: Historical revenue, seasonality, growth rate
- Model: Time-series forecasting (Prophet)
- Retrain: Monthly

**Anomaly Detection**:
- Detect unusual transaction patterns
- Detect fraudulent activity
- Detect data quality issues
- Model: Isolation Forests

### 8.2 ML Pipeline (Vertex AI)

```
Training Pipeline:
├── Feature Engineering (from warehouse)
├── Train/Test Split (80/20, time-based)
├── Model Training (Vertex AutoML)
├── Hyperparameter Tuning
├── Model Evaluation
├── Registry & Versioning
└── Deploy to Prediction Service

Scoring:
├── Batch Scoring (daily)
├── Real-time Scoring (API)
└── Write Scores back to Warehouse
```

---

## 9. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)
- [ ] Set up BigQuery project & datasets
- [ ] Design core schemas (fact/dimension tables)
- [ ] Build Kafka infrastructure
- [ ] Create dbt project structure
- [ ] Implement data quality checks
- [ ] Deploy Looker dashboard templates

**Deliverables**:
- Core warehouse schema
- First ETL pipeline (TaxSense transactions)
- 5 executive dashboards
- Data dictionary

### Phase 2: Integration (Weeks 5-8)
- [ ] Build ETL for remaining products (AbroBot, Draftsman)
- [ ] Implement API integrations
- [ ] Set up real-time streaming (Kafka)
- [ ] Build data quality monitoring
- [ ] Implement RBAC & access controls

**Deliverables**:
- All products integrated
- Real-time dashboards live
- Data governance framework

### Phase 3: Advanced Analytics (Weeks 9-12)
- [ ] Build ML training pipelines
- [ ] Deploy churn prediction model
- [ ] Implement revenue forecasting
- [ ] Create anomaly detection
- [ ] Build self-service BI tools

**Deliverables**:
- 3 ML models in production
- Advanced analytics dashboards
- Self-service analytics portal

### Phase 4: Scale & Optimization (Weeks 13+)
- [ ] Performance optimization (partitioning, clustering)
- [ ] Cost optimization (storage, queries)
- [ ] High-availability setup
- [ ] Disaster recovery procedures
- [ ] Advanced governance (data lineage, metadata)

**Deliverables**:
- 50% cost reduction
- Sub-second query performance
- Enterprise-grade reliability

---

## 10. Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Warehouse** | BigQuery | Scalable, serverless analytics |
| **Ingestion** | Kafka | Real-time event streaming |
| **ETL Orchestration** | Apache Airflow | Workflow scheduling & monitoring |
| **Transformation** | dbt + SQL | Analytics engineering best practices |
| **Schema Registry** | Confluent Schema Registry | Data contracts |
| **Data Quality** | Great Expectations | Quality testing & monitoring |
| **ML Platform** | Vertex AI | Model training & deployment |
| **BI/Dashboards** | Looker | Self-service analytics |
| **Data Lineage** | Neo4j + Custom | Impact analysis & debugging |
| **Access Control** | BigQuery IAM | Role-based permissions |
| **Monitoring** | Datadog + Cloud Monitoring | System health & alerts |
| **Logging** | Cloud Logging | Audit trails & compliance |

---

## 11. Cost Estimates (Annual)

| Component | Estimate | Notes |
|-----------|----------|-------|
| BigQuery Storage | $15K-25K | ~100GB data, $6.25/TB |
| BigQuery Compute | $20K-35K | ~50K queries/day, on-demand |
| Kafka/Streaming | $8K-12K | Managed Kafka or Confluent |
| dbt/Transformations | $3K-5K | dbt Cloud team edition |
| Looker/BI | $12K-18K | Looker Standard per user |
| Vertex AI | $5K-10K | Model training & deployment |
| Infrastructure | $10K-15K | Orchestration, networking |
| **Total** | **$73K-120K** | Scales with data volume |

---

## 12. Success Metrics

✓ **Performance**: Query response <2 seconds for dashboards  
✓ **Availability**: 99.9% uptime  
✓ **Data Quality**: >99.5% accuracy  
✓ **Adoption**: 80%+ of team using dashboards  
✓ **Insight Velocity**: New report in <4 hours  
✓ **Compliance**: 100% audit trail completeness  
✓ **Cost**: <$120K annual for 100GB+ data warehouse  

---

## Appendix: Key Definitions

- **Fact Table**: Immutable event records with measures
- **Dimension Table**: Reference data with attributes
- **SCD (Slowly Changing Dimension)**: Type 2 tracks historical changes
- **Grain**: Level of detail in a fact table
- **Lineage**: Path data takes from source to report
- **dbt**: Data build tool for transforming raw data
- **Looker**: Google's BI platform for self-service analytics
