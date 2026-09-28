-- Data Warehouse Schema Definitions
-- BigQuery schema for enterprise financial data warehouse
-- Created: 2026-09-28

-- ============================================================================
-- STAGING DATASETS
-- ============================================================================

-- Raw data layer - minimal transformation
CREATE DATASET IF NOT EXISTS `{PROJECT_ID}.warehouse_staging`
OPTIONS(
  description="Raw data from source systems",
  location="US",
  default_table_expiration=7776000  -- 90 days
);

-- Conformed data layer - validated and deduplicated
CREATE DATASET IF NOT EXISTS `{PROJECT_ID}.warehouse_conformed`
OPTIONS(
  description="Conformed data after quality checks",
  location="US",
  default_table_expiration=15552000  -- 180 days
);

-- ============================================================================
-- ANALYTICS DATASETS
-- ============================================================================

-- Production analytics schema
CREATE DATASET IF NOT EXISTS `{PROJECT_ID}.warehouse_analytics`
OPTIONS(
  description="Fact and dimension tables for analytics",
  location="US"
);

-- Machine learning feature store
CREATE DATASET IF NOT EXISTS `{PROJECT_ID}.ml_features`
OPTIONS(
  description="ML features and training datasets",
  location="US"
);

-- ============================================================================
-- STAGING TABLES (Raw)
-- ============================================================================

-- Source system transactions (raw)
CREATE OR REPLACE TABLE `{PROJECT_ID}.warehouse_staging.raw_transactions` (
  source_transaction_id STRING NOT NULL,
  source_system STRING NOT NULL,
  product_code STRING NOT NULL,
  customer_id STRING NOT NULL,
  merchant_id STRING,
  transaction_type STRING NOT NULL,
  amount_decimal NUMERIC(20, 2) NOT NULL,
  currency_code STRING NOT NULL,
  transaction_timestamp TIMESTAMP NOT NULL,
  processing_timestamp TIMESTAMP,
  settlement_timestamp TIMESTAMP,
  payment_method STRING,
  status STRING NOT NULL,
  error_message STRING,
  metadata JSON,
  raw_payload STRING,
  ingestion_timestamp TIMESTAMP NOT NULL,
  _raw_line_number INT64,
  _partition_date DATE NOT NULL
)
PARTITION BY _partition_date
CLUSTER BY source_system, customer_id, product_code
OPTIONS(
  description="Raw transactions from all source systems",
  require_partition_filter=false
);

-- Source system user events (raw)
CREATE OR REPLACE TABLE `{PROJECT_ID}.warehouse_staging.raw_user_events` (
  source_event_id STRING NOT NULL,
  source_system STRING NOT NULL,
  user_id STRING NOT NULL,
  event_type STRING NOT NULL,
  event_timestamp TIMESTAMP NOT NULL,
  session_id STRING,
  device_type STRING,
  device_id STRING,
  browser STRING,
  browser_version STRING,
  operating_system STRING,
  country_code STRING,
  state_code STRING,
  city STRING,
  ip_address_hash STRING,
  page_url STRING,
  referrer_url STRING,
  event_duration_ms INT64,
  properties JSON,
  errors JSON,
  metadata JSON,
  raw_payload STRING,
  ingestion_timestamp TIMESTAMP NOT NULL,
  _partition_date DATE NOT NULL
)
PARTITION BY _partition_date
CLUSTER BY source_system, user_id, event_type
OPTIONS(
  description="Raw user events from all products"
);

-- Source system subscriptions (raw)
CREATE OR REPLACE TABLE `{PROJECT_ID}.warehouse_staging.raw_subscriptions` (
  source_subscription_id STRING NOT NULL,
  source_system STRING NOT NULL,
  customer_id STRING NOT NULL,
  product_code STRING NOT NULL,
  billing_account_id STRING,
  plan_code STRING NOT NULL,
  plan_name STRING,
  subscription_status STRING NOT NULL,
  started_date DATE NOT NULL,
  renewal_date DATE,
  canceled_date DATE,
  pause_date DATE,
  billing_interval STRING,  -- MONTHLY, YEARLY
  billing_currency STRING,
  plan_amount_decimal NUMERIC(20, 2),
  discount_amount_decimal NUMERIC(20, 2),
  tax_amount_decimal NUMERIC(20, 2),
  actual_payment_amount_decimal NUMERIC(20, 2),
  last_payment_date DATE,
  next_payment_date DATE,
  payment_method STRING,
  failure_count INT64,
  metadata JSON,
  raw_payload STRING,
  ingestion_timestamp TIMESTAMP NOT NULL,
  _partition_date DATE NOT NULL
)
PARTITION BY _partition_date
CLUSTER BY source_system, customer_id, subscription_status
OPTIONS(
  description="Raw subscription data from billing systems"
);

-- ============================================================================
-- CONFORMED TABLES (Validated)
-- ============================================================================

-- Conformed transactions
CREATE OR REPLACE TABLE `{PROJECT_ID}.warehouse_conformed.transactions` (
  transaction_id STRING NOT NULL,
  source_transaction_id STRING NOT NULL,
  source_system STRING NOT NULL,
  product_id STRING NOT NULL,
  customer_id STRING NOT NULL,
  merchant_id STRING,
  transaction_type STRING NOT NULL,
  amount_local_currency NUMERIC(20, 2) NOT NULL,
  amount_usd NUMERIC(20, 2) NOT NULL,
  currency_code STRING NOT NULL,
  fx_rate_date DATE,
  fx_rate NUMERIC(10, 4),
  transaction_date DATE NOT NULL,
  transaction_timestamp TIMESTAMP NOT NULL,
  processing_timestamp TIMESTAMP,
  settlement_date DATE,
  settlement_timestamp TIMESTAMP,
  payment_method STRING,
  status STRING NOT NULL,
  error_code STRING,
  error_message STRING,
  metadata JSON,
  data_quality_score NUMERIC(3, 2),
  validation_errors STRING,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  etl_load_timestamp TIMESTAMP NOT NULL,
  data_lineage_id STRING,
  _partition_date DATE NOT NULL
)
PARTITION BY _partition_date
CLUSTER BY customer_id, product_id, transaction_date
OPTIONS(
  description="Conformed transaction data"
);

-- Conformed user events
CREATE OR REPLACE TABLE `{PROJECT_ID}.warehouse_conformed.user_events` (
  event_id STRING NOT NULL,
  source_event_id STRING NOT NULL,
  source_system STRING NOT NULL,
  user_id STRING NOT NULL,
  event_type STRING NOT NULL,
  event_timestamp TIMESTAMP NOT NULL,
  event_date DATE NOT NULL,
  event_hour INT64,
  session_id STRING,
  device_type STRING,
  device_id STRING,
  browser STRING,
  operating_system STRING,
  country_code STRING,
  state_code STRING,
  city STRING,
  ip_address_anonymized STRING,
  page_url STRING,
  event_duration_ms INT64,
  event_properties JSON,
  error_code STRING,
  error_message STRING,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  etl_load_timestamp TIMESTAMP NOT NULL,
  data_lineage_id STRING,
  _partition_date DATE NOT NULL
)
PARTITION BY _partition_date
CLUSTER BY user_id, event_type, event_date
OPTIONS(
  description="Conformed user events"
);

-- Conformed subscriptions
CREATE OR REPLACE TABLE `{PROJECT_ID}.warehouse_conformed.subscriptions` (
  subscription_id STRING NOT NULL,
  source_subscription_id STRING NOT NULL,
  source_system STRING NOT NULL,
  customer_id STRING NOT NULL,
  product_id STRING NOT NULL,
  billing_account_id STRING,
  plan_id STRING NOT NULL,
  plan_name STRING,
  subscription_status STRING NOT NULL,
  started_date DATE NOT NULL,
  renewal_date DATE,
  canceled_date DATE,
  pause_date DATE,
  billing_interval STRING,
  billing_currency STRING,
  plan_amount_decimal NUMERIC(20, 2),
  discount_amount_decimal NUMERIC(20, 2),
  tax_amount_decimal NUMERIC(20, 2),
  actual_payment_amount_decimal NUMERIC(20, 2),
  mrr NUMERIC(20, 2),
  arr NUMERIC(20, 2),
  last_payment_date DATE,
  next_payment_date DATE,
  payment_method STRING,
  failure_count INT64,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  etl_load_timestamp TIMESTAMP NOT NULL,
  data_lineage_id STRING,
  _partition_date DATE NOT NULL
)
PARTITION BY _partition_date
CLUSTER BY customer_id, subscription_status, renewal_date
OPTIONS(
  description="Conformed subscription data"
);

-- ============================================================================
-- FACT TABLES
-- ============================================================================

-- Transactions fact table
CREATE OR REPLACE TABLE `{PROJECT_ID}.warehouse_analytics.fct_transactions` (
  transaction_sk INT64 NOT NULL,
  transaction_id STRING NOT NULL,
  source_system STRING NOT NULL,
  product_sk INT64 NOT NULL,
  customer_sk INT64 NOT NULL,
  merchant_sk INT64,
  transaction_type_sk INT64 NOT NULL,
  payment_method_sk INT64,
  date_sk INT64 NOT NULL,
  time_of_day_sk INT64 NOT NULL,
  amount_local_currency NUMERIC(20, 2) NOT NULL,
  amount_usd NUMERIC(20, 2) NOT NULL,
  currency_code STRING NOT NULL,
  fx_rate NUMERIC(10, 4),
  status STRING NOT NULL,
  error_code STRING,
  is_reversed BOOL,
  is_failed BOOL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  etl_load_timestamp TIMESTAMP NOT NULL,
  _partition_date DATE NOT NULL
)
PARTITION BY _partition_date
CLUSTER BY customer_sk, product_sk, date_sk
OPTIONS(
  description="Core transaction facts",
  require_partition_filter=true
);

-- User events fact table
CREATE OR REPLACE TABLE `{PROJECT_ID}.warehouse_analytics.fct_user_events` (
  event_sk INT64 NOT NULL,
  event_id STRING NOT NULL,
  source_system STRING NOT NULL,
  user_sk INT64 NOT NULL,
  product_sk INT64 NOT NULL,
  device_sk INT64,
  geography_sk INT64,
  event_type_sk INT64 NOT NULL,
  date_sk INT64 NOT NULL,
  time_of_day_sk INT64 NOT NULL,
  session_duration_seconds INT64,
  page_views INT64,
  is_conversion BOOL,
  is_error BOOL,
  error_code STRING,
  created_at TIMESTAMP NOT NULL,
  etl_load_timestamp TIMESTAMP NOT NULL,
  _partition_date DATE NOT NULL
)
PARTITION BY _partition_date
CLUSTER BY user_sk, product_sk, date_sk
OPTIONS(
  description="User engagement events"
);

-- Subscription metrics fact table
CREATE OR REPLACE TABLE `{PROJECT_ID}.warehouse_analytics.fct_subscription_metrics` (
  subscription_metric_sk INT64 NOT NULL,
  subscription_id STRING NOT NULL,
  customer_sk INT64 NOT NULL,
  product_sk INT64 NOT NULL,
  plan_sk INT64 NOT NULL,
  date_sk INT64 NOT NULL,
  mrr NUMERIC(20, 2) NOT NULL,
  arr NUMERIC(20, 2) NOT NULL,
  subscription_status STRING NOT NULL,
  days_active INT64,
  month_number_in_cohort INT64,
  is_active_as_of_date BOOL,
  is_churned_this_period BOOL,
  churn_probability_score NUMERIC(5, 4),
  ltv_estimate NUMERIC(20, 2),
  created_at TIMESTAMP NOT NULL,
  etl_load_timestamp TIMESTAMP NOT NULL,
  _partition_date DATE NOT NULL
)
PARTITION BY _partition_date
CLUSTER BY customer_sk, subscription_status, date_sk
OPTIONS(
  description="Subscription metrics and KPIs"
);

-- ============================================================================
-- DIMENSION TABLES
-- ============================================================================

-- Customer dimension (SCD Type 2)
CREATE OR REPLACE TABLE `{PROJECT_ID}.warehouse_analytics.dim_customer` (
  customer_sk INT64 NOT NULL,
  customer_id STRING NOT NULL,
  customer_name STRING,
  customer_email STRING,
  company_name STRING,
  company_size STRING,
  industry_code STRING,
  country STRING,
  state_province STRING,
  city STRING,
  timezone STRING,
  language_code STRING,
  signup_date DATE,
  customer_type STRING,
  customer_segment STRING,
  annual_contract_value NUMERIC(20, 2),
  lifetime_value NUMERIC(20, 2),
  churn_risk_score NUMERIC(5, 4),
  is_current BOOL,
  effective_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
)
OPTIONS(
  description="Customer dimension (SCD Type 2)"
);

-- Product dimension
CREATE OR REPLACE TABLE `{PROJECT_ID}.warehouse_analytics.dim_product` (
  product_sk INT64 NOT NULL,
  product_id STRING NOT NULL,
  product_name STRING,
  product_code STRING,
  product_category STRING,
  product_tier STRING,
  pricing_model STRING,
  launch_date DATE,
  sunset_date DATE,
  is_active BOOL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
)
OPTIONS(
  description="Product dimension"
);

-- Time dimension
CREATE OR REPLACE TABLE `{PROJECT_ID}.warehouse_analytics.dim_date` (
  date_sk INT64 NOT NULL,
  date_actual DATE NOT NULL,
  day_of_week INT64,
  day_name STRING,
  day_of_month INT64,
  day_of_year INT64,
  week_of_year INT64,
  month INT64,
  month_name STRING,
  quarter INT64,
  quarter_name STRING,
  year INT64,
  fiscal_year INT64,
  fiscal_quarter INT64,
  is_weekend BOOL,
  is_holiday BOOL,
  holiday_name STRING
)
OPTIONS(
  description="Time dimension"
);

-- Geography dimension
CREATE OR REPLACE TABLE `{PROJECT_ID}.warehouse_analytics.dim_geography` (
  geography_sk INT64 NOT NULL,
  country_code STRING NOT NULL,
  country_name STRING,
  state_code STRING,
  state_name STRING,
  city STRING,
  postal_code STRING,
  region STRING,
  timezone STRING,
  tax_jurisdiction STRING,
  regulatory_framework STRING,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
)
OPTIONS(
  description="Geography dimension"
);

-- ============================================================================
-- COMPLIANCE & AUDIT TABLES
-- ============================================================================

-- Data lineage tracking
CREATE OR REPLACE TABLE `{PROJECT_ID}.warehouse_analytics.data_lineage` (
  data_lineage_id STRING NOT NULL,
  source_system STRING NOT NULL,
  source_table STRING NOT NULL,
  source_record_id STRING NOT NULL,
  transform_pipeline STRING NOT NULL,
  transform_step STRING,
  target_system STRING NOT NULL,
  target_table STRING NOT NULL,
  target_record_id STRING NOT NULL,
  transform_timestamp TIMESTAMP NOT NULL,
  transform_status STRING,
  error_message STRING,
  created_at TIMESTAMP NOT NULL
)
PARTITION BY DATE(transform_timestamp)
CLUSTER BY source_system, target_system
OPTIONS(
  description="Data lineage for compliance and debugging"
);

-- Compliance audit trail
CREATE OR REPLACE TABLE `{PROJECT_ID}.warehouse_analytics.compliance_audit_trail` (
  audit_event_id STRING NOT NULL,
  event_type STRING NOT NULL,
  user_id STRING NOT NULL,
  customer_id STRING,
  resource_type STRING NOT NULL,
  resource_id STRING NOT NULL,
  action STRING NOT NULL,
  old_values JSON,
  new_values JSON,
  timestamp TIMESTAMP NOT NULL,
  ip_address_anonymized STRING,
  justification STRING,
  approved_by STRING,
  approval_timestamp TIMESTAMP,
  status STRING,
  created_at TIMESTAMP NOT NULL,
  _partition_date DATE NOT NULL
)
PARTITION BY _partition_date
CLUSTER BY event_type, user_id, customer_id
OPTIONS(
  description="Compliance and data access audit trail"
);

-- Data quality metrics
CREATE OR REPLACE TABLE `{PROJECT_ID}.warehouse_analytics.data_quality_metrics` (
  quality_metric_id STRING NOT NULL,
  table_name STRING NOT NULL,
  metric_name STRING NOT NULL,
  metric_value NUMERIC(20, 4),
  expected_value NUMERIC(20, 4),
  metric_status STRING,
  check_timestamp TIMESTAMP NOT NULL,
  execution_time_ms INT64,
  error_message STRING,
  created_at TIMESTAMP NOT NULL
)
PARTITION BY DATE(check_timestamp)
CLUSTER BY table_name, metric_name
OPTIONS(
  description="Data quality check results"
);

-- ============================================================================
-- INDEXES (BigQuery doesn't have traditional indexes, but clustering helps)
-- ============================================================================

-- Create search indexes for common queries
CREATE SEARCH INDEX idx_transactions_customer
ON `{PROJECT_ID}.warehouse_analytics.fct_transactions` (customer_sk)
WHERE _partition_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY);

CREATE SEARCH INDEX idx_user_events_user
ON `{PROJECT_ID}.warehouse_analytics.fct_user_events` (user_sk)
WHERE _partition_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY);

-- ============================================================================
-- MATERIALIZED VIEWS (for common queries)
-- ============================================================================

-- Daily transaction summary
CREATE OR REPLACE MATERIALIZED VIEW `{PROJECT_ID}.warehouse_analytics.mv_daily_transactions` AS
SELECT
  date_sk,
  product_sk,
  COUNT(*) as transaction_count,
  SUM(amount_usd) as total_amount_usd,
  COUNT(DISTINCT customer_sk) as unique_customers,
  AVG(amount_usd) as avg_transaction_amount,
  SUM(CASE WHEN is_failed THEN 1 ELSE 0 END) as failed_count
FROM `{PROJECT_ID}.warehouse_analytics.fct_transactions`
WHERE _partition_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 180 DAY)
GROUP BY date_sk, product_sk;

-- Monthly revenue summary
CREATE OR REPLACE MATERIALIZED VIEW `{PROJECT_ID}.warehouse_analytics.mv_monthly_revenue` AS
SELECT
  DATE_TRUNC(CURRENT_DATE(), MONTH) as month_date,
  product_sk,
  SUM(mrr) as monthly_recurring_revenue,
  SUM(arr) as annual_recurring_revenue,
  COUNT(DISTINCT customer_sk) as active_customers,
  COUNT(DISTINCT CASE WHEN is_churned_this_period THEN customer_sk END) as churned_customers
FROM `{PROJECT_ID}.warehouse_analytics.fct_subscription_metrics`
WHERE is_active_as_of_date = TRUE
GROUP BY month_date, product_sk;

-- ============================================================================
-- STORED PROCEDURES FOR COMMON OPERATIONS
-- ============================================================================

-- Procedure to refresh materialized views
CREATE OR REPLACE PROCEDURE `{PROJECT_ID}.warehouse_analytics.refresh_materialized_views`()
BEGIN
  CALL BQ.REFRESH_MATERIALIZED_VIEW('warehouse_analytics.mv_daily_transactions');
  CALL BQ.REFRESH_MATERIALIZED_VIEW('warehouse_analytics.mv_monthly_revenue');
END;

-- ============================================================================
-- VIEWS FOR SECURITY AND DATA MASKING
-- ============================================================================

-- Customer view with PII masking
CREATE OR REPLACE VIEW `{PROJECT_ID}.warehouse_analytics.v_customer_safe` AS
SELECT
  customer_sk,
  customer_id,
  SUBSTR(customer_name, 1, 1) || '***' as customer_name_masked,
  SUBSTR(customer_email, 1, 3) || '***@***' as customer_email_masked,
  company_name,
  customer_type,
  customer_segment,
  churn_risk_score
FROM `{PROJECT_ID}.warehouse_analytics.dim_customer`
WHERE is_current = TRUE;

-- Transaction view with sensitive data access control
CREATE OR REPLACE VIEW `{PROJECT_ID}.warehouse_analytics.v_transactions_analytics_only` AS
SELECT
  transaction_sk,
  transaction_id,
  product_sk,
  customer_sk,
  transaction_type_sk,
  amount_usd,
  currency_code,
  status,
  date_sk
FROM `{PROJECT_ID}.warehouse_analytics.fct_transactions`
WHERE _partition_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 365 DAY);
