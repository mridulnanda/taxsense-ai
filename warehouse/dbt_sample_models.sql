-- Sample dbt models for data warehouse analytics
-- These models transform raw/conformed data into analytics-ready facts and dimensions

-- ============================================================================
-- STAGING MODELS (Minimal transformation, validation)
-- ============================================================================

-- File: models/staging/stg_transactions.sql
-- Purpose: Clean and validate raw transactions

{{ config(
    materialized='view',
    tags=['staging', 'daily'],
    description='Staged transactions with basic validation and cleaning'
) }}

WITH raw_transactions AS (
    SELECT
        source_transaction_id,
        source_system,
        product_code,
        customer_id,
        merchant_id,
        transaction_type,
        amount_decimal,
        currency_code,
        transaction_timestamp,
        processing_timestamp,
        settlement_timestamp,
        payment_method,
        status,
        error_message,
        metadata,
        ingestion_timestamp,
        _partition_date
    FROM {{ source('staging', 'raw_transactions') }}
    WHERE _partition_date = CURRENT_DATE()
),

validated_amounts AS (
    SELECT
        *,
        CASE
            WHEN amount_decimal IS NULL THEN 'NULL_AMOUNT'
            WHEN amount_decimal < 0 AND transaction_type NOT IN ('REFUND', 'CHARGEBACK') THEN 'INVALID_NEGATIVE'
            WHEN amount_decimal = 0 THEN 'ZERO_AMOUNT'
            ELSE NULL
        END AS validation_error
    FROM raw_transactions
),

deduped AS (
    SELECT
        *,
        ROW_NUMBER() OVER (PARTITION BY source_transaction_id ORDER BY ingestion_timestamp DESC) as rn
    FROM validated_amounts
    WHERE validation_error IS NULL  -- Filter out invalid records
)

SELECT
    source_transaction_id AS transaction_id,
    source_system,
    product_code,
    customer_id,
    merchant_id,
    transaction_type,
    amount_decimal,
    currency_code,
    transaction_timestamp,
    processing_timestamp,
    settlement_timestamp,
    payment_method,
    status,
    error_message,
    metadata,
    ingestion_timestamp,
    _partition_date
FROM deduped
WHERE rn = 1  -- Keep only the latest version


-- File: models/staging/stg_customers.sql
-- Purpose: Clean and deduplicate customer data

{{ config(
    materialized='view',
    tags=['staging', 'daily'],
    description='Staged customer records with deduplication'
) }}

WITH raw_customers AS (
    SELECT
        customer_id,
        customer_name,
        customer_email,
        company_name,
        industry_code,
        country,
        state_province,
        timezone,
        signup_date,
        customer_type,
        customer_segment,
        annual_contract_value,
        updated_at,
        _partition_date
    FROM {{ source('staging', 'raw_customers') }}
    WHERE _partition_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
),

deduped AS (
    SELECT
        *,
        ROW_NUMBER() OVER (
            PARTITION BY customer_id
            ORDER BY updated_at DESC
        ) AS rn
    FROM raw_customers
)

SELECT
    customer_id,
    customer_name,
    customer_email,
    company_name,
    industry_code,
    country,
    state_province,
    timezone,
    signup_date,
    customer_type,
    customer_segment,
    annual_contract_value
FROM deduped
WHERE rn = 1


-- ============================================================================
-- DIMENSION MODELS (SCD Type 2 Implementation)
-- ============================================================================

-- File: models/marts/finance/dim_customer.sql
-- Purpose: Customer dimension with slowly changing dimensions (Type 2)

{{ config(
    materialized='table',
    tags=['finance', 'dimension', 'daily'],
    description='Customer dimension with historical tracking (SCD Type 2)',
    indexes=[{'columns': ['customer_id', 'is_current']}]
) }}

WITH source_data AS (
    SELECT * FROM {{ ref('stg_customers') }}
),

scd_input AS (
    SELECT
        customer_id,
        customer_name,
        customer_email,
        company_name,
        industry_code,
        country,
        state_province,
        timezone,
        customer_type,
        customer_segment,
        annual_contract_value,
        signup_date,
        updated_at
    FROM source_data
)

SELECT
    {{ dbt_utils.generate_surrogate_key(['customer_id']) }} AS customer_sk,
    customer_id,
    customer_name,
    customer_email,
    company_name,
    industry_code,
    country,
    state_province,
    timezone,
    customer_type,
    customer_segment,
    annual_contract_value,
    signup_date,
    TRUE AS is_current,
    CURRENT_DATE() AS effective_date,
    CAST('2099-12-31' AS DATE) AS end_date,
    CURRENT_TIMESTAMP() AS created_at,
    CURRENT_TIMESTAMP() AS updated_at
FROM scd_input


-- ============================================================================
-- FACT TABLE MODELS
-- ============================================================================

-- File: models/marts/finance/fct_transactions.sql
-- Purpose: Central transaction fact table

{{ config(
    materialized='table',
    tags=['finance', 'fact', 'daily'],
    description='Central transaction fact table with all financial movements',
    partition_by={
        'field': '_partition_date',
        'data_type': 'date',
        'granularity': 'day'
    },
    cluster_by=['customer_sk', 'product_sk', 'date_sk'],
    indexes=[
        {'columns': ['customer_sk', '_partition_date']},
        {'columns': ['product_sk', '_partition_date']}
    ]
) }}

WITH transactions AS (
    SELECT
        transaction_id,
        source_system,
        product_code,
        customer_id,
        merchant_id,
        transaction_type,
        amount_local_currency,
        amount_usd,
        currency_code,
        transaction_timestamp,
        settlement_timestamp,
        payment_method,
        status,
        error_message,
        _partition_date
    FROM {{ ref('stg_transactions') }}
),

dim_customers AS (
    SELECT customer_sk, customer_id
    FROM {{ ref('dim_customer') }}
    WHERE is_current = TRUE
),

dim_products AS (
    SELECT product_sk, product_code
    FROM {{ ref('dim_product') }}
),

dim_dates AS (
    SELECT date_sk, date_actual
    FROM {{ ref('dim_date') }}
),

enhanced_transactions AS (
    SELECT
        {{ dbt_utils.generate_surrogate_key(['t.transaction_id']) }} AS transaction_sk,
        t.transaction_id,
        t.source_system,
        dc.customer_sk,
        dp.product_sk,
        dd.date_sk,
        CAST(EXTRACT(HOUR FROM t.transaction_timestamp) AS INT64) * 100
            + CAST(EXTRACT(MINUTE FROM t.transaction_timestamp) AS INT64) AS time_of_day_sk,
        t.amount_local_currency,
        t.amount_usd,
        t.currency_code,
        CASE
            WHEN t.status = 'failed' THEN TRUE
            ELSE FALSE
        END AS is_failed,
        CASE
            WHEN t.transaction_type = 'REVERSAL' THEN TRUE
            ELSE FALSE
        END AS is_reversed,
        t.payment_method,
        t.status,
        CURRENT_TIMESTAMP() AS created_at,
        CURRENT_TIMESTAMP() AS updated_at,
        CURRENT_TIMESTAMP() AS etl_load_timestamp,
        t._partition_date
    FROM transactions t
    LEFT JOIN dim_customers dc ON t.customer_id = dc.customer_id
    LEFT JOIN dim_products dp ON t.product_code = dp.product_code
    LEFT JOIN dim_dates dd ON DATE(t.transaction_timestamp) = dd.date_actual
    WHERE t._partition_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 365 DAY)
)

SELECT * FROM enhanced_transactions


-- File: models/marts/finance/fct_revenue.sql
-- Purpose: Revenue recognition facts per IFRS 15

{{ config(
    materialized='table',
    tags=['finance', 'accounting', 'fact'],
    description='Revenue recognition facts per IFRS 15 standards',
    partition_by={
        'field': 'revenue_date',
        'data_type': 'date',
        'granularity': 'month'
    }
) }}

WITH transactions AS (
    SELECT
        transaction_id,
        customer_id,
        product_sk,
        amount_usd,
        transaction_timestamp,
        status
    FROM {{ ref('fct_transactions') }}
    WHERE status = 'completed'
),

revenue_recognition_logic AS (
    SELECT
        {{ dbt_utils.generate_surrogate_key(['t.transaction_id']) }} AS revenue_sk,
        t.transaction_id,
        t.customer_id,
        t.product_sk,
        t.amount_usd AS revenue_amount,
        DATE(t.transaction_timestamp) AS revenue_date,
        'subscription' AS revenue_category,
        CASE
            WHEN EXTRACT(DAY FROM CURRENT_DATE()) = 1 THEN 'recognized'
            ELSE 'recognized'
        END AS recognition_status,
        0 AS deferred_revenue_amount,
        CURRENT_TIMESTAMP() AS created_at,
        CURRENT_TIMESTAMP() AS updated_at,
        CURRENT_TIMESTAMP() AS etl_load_timestamp
    FROM transactions t
)

SELECT * FROM revenue_recognition_logic


-- ============================================================================
-- ANALYTICS MODELS (KPIs and Metrics)
-- ============================================================================

-- File: models/marts/analytics/metrics_daily_mrr.sql
-- Purpose: Daily Monthly Recurring Revenue (MRR) calculation

{{ config(
    materialized='table',
    tags=['metrics', 'daily'],
    description='Daily MRR (Monthly Recurring Revenue) by product',
    partition_by={
        'field': 'metric_date',
        'data_type': 'date',
        'granularity': 'day'
    }
) }}

WITH subscriptions AS (
    SELECT
        subscription_id,
        customer_sk,
        product_sk,
        billing_amount,
        billing_interval,
        subscription_status,
        renewal_date
    FROM {{ ref('fct_subscription_metrics') }}
    WHERE subscription_status = 'active'
),

mrr_calc AS (
    SELECT
        CURRENT_DATE() AS metric_date,
        product_sk,
        COUNT(DISTINCT customer_sk) AS active_subscriptions,
        ROUND(
            SUM(
                CASE
                    WHEN billing_interval = 'MONTHLY' THEN billing_amount
                    WHEN billing_interval = 'ANNUAL' THEN billing_amount / 12
                    ELSE 0
                END
            ),
            2
        ) AS mrr,
        ROUND(
            SUM(
                CASE
                    WHEN billing_interval = 'MONTHLY' THEN billing_amount * 12
                    WHEN billing_interval = 'ANNUAL' THEN billing_amount
                    ELSE 0
                END
            ),
            2
        ) AS arr,
        CURRENT_TIMESTAMP() AS calculated_at
    FROM subscriptions
    GROUP BY product_sk
)

SELECT * FROM mrr_calc


-- File: models/marts/analytics/cohort_retention.sql
-- Purpose: Cohort retention analysis

{{ config(
    materialized='table',
    tags=['cohort', 'analytics'],
    description='Monthly cohort retention analysis by signup month'
) }}

WITH customer_cohorts AS (
    SELECT
        customer_sk,
        EXTRACT(YEAR FROM signup_date) AS cohort_year,
        EXTRACT(MONTH FROM signup_date) AS cohort_month,
        {{ dbt_utils.generate_surrogate_key(['EXTRACT(YEAR FROM signup_date)', 'EXTRACT(MONTH FROM signup_date)']) }} AS cohort_id
    FROM {{ ref('dim_customer') }}
),

transactions_with_cohort AS (
    SELECT
        cc.cohort_id,
        cc.cohort_year,
        cc.cohort_month,
        EXTRACT(YEAR FROM CAST(dd.date_actual AS DATE)) AS activity_year,
        EXTRACT(MONTH FROM CAST(dd.date_actual AS DATE)) AS activity_month,
        DATEDIFF(
            MONTH,
            DATE(cc.cohort_year || '-' || cc.cohort_month || '-01'),
            dd.date_actual
        ) AS month_in_cohort,
        COUNT(DISTINCT ft.customer_sk) AS users_active
    FROM {{ ref('fct_transactions') }} ft
    JOIN customer_cohorts cc ON ft.customer_sk = cc.customer_sk
    JOIN {{ ref('dim_date') }} dd ON ft.date_sk = dd.date_sk
    WHERE ft.status = 'completed'
    GROUP BY
        cc.cohort_id, cc.cohort_year, cc.cohort_month,
        activity_year, activity_month, month_in_cohort
)

SELECT
    cohort_id,
    cohort_year,
    cohort_month,
    month_in_cohort,
    users_active,
    CURRENT_TIMESTAMP() AS calculated_at
FROM transactions_with_cohort
WHERE month_in_cohort >= 0
ORDER BY cohort_year DESC, cohort_month DESC, month_in_cohort


-- ============================================================================
-- DATA QUALITY & MONITORING MODELS
-- ============================================================================

-- File: models/marts/quality/quality_metrics.sql
-- Purpose: Data quality KPIs

{{ config(
    materialized='incremental',
    tags=['quality', 'monitoring'],
    description='Data quality metrics for monitoring'
) }}

WITH transaction_quality AS (
    SELECT
        CURRENT_TIMESTAMP() AS check_timestamp,
        'fct_transactions' AS table_name,
        'row_count' AS metric_name,
        COUNT(*) AS metric_value,
        COUNT(*) >= 100 AS is_healthy
    FROM {{ ref('fct_transactions') }}
    WHERE _partition_date = CURRENT_DATE()

    UNION ALL

    SELECT
        CURRENT_TIMESTAMP() AS check_timestamp,
        'fct_transactions' AS table_name,
        'null_customer_sk' AS metric_name,
        COUNT(*) AS metric_value,
        COUNT(*) = 0 AS is_healthy
    FROM {{ ref('fct_transactions') }}
    WHERE _partition_date = CURRENT_DATE()
    AND customer_sk IS NULL

    UNION ALL

    SELECT
        CURRENT_TIMESTAMP() AS check_timestamp,
        'fct_transactions' AS table_name,
        'null_amount_usd' AS metric_name,
        COUNT(*) AS metric_value,
        COUNT(*) = 0 AS is_healthy
    FROM {{ ref('fct_transactions') }}
    WHERE _partition_date = CURRENT_DATE()
    AND amount_usd IS NULL
)

SELECT * FROM transaction_quality

{% if execute %}
    {% if flags.FULL_REFRESH %}
        -- Full refresh - no incremental logic
    {% else %}
        -- Incremental - last 7 days
        WHERE check_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
    {% endif %}
{% endif %}


-- ============================================================================
-- COMPLIANCE MODELS
-- ============================================================================

-- File: models/marts/compliance/gdpr_data_subjects.sql
-- Purpose: Track data subject records for GDPR compliance

{{ config(
    materialized='table',
    tags=['compliance', 'gdpr'],
    description='Data subject tracking for GDPR compliance',
    persist_docs={'relation': true, 'columns': true}
) }}

WITH customer_records AS (
    SELECT
        customer_sk,
        customer_id,
        customer_email,
        country,
        signup_date,
        is_current,
        effective_date
    FROM {{ ref('dim_customer') }}
),

gdpr_status AS (
    SELECT
        cr.*,
        'ACTIVE' AS data_subject_status,
        CURRENT_TIMESTAMP() AS last_activity,
        FALSE AS deletion_requested,
        NULL AS deletion_request_date
    FROM customer_records cr
)

SELECT * FROM gdpr_status
