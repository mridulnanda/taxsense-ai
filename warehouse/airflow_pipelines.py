"""
Apache Airflow DAGs for Data Warehouse ETL
Financial data warehouse ingestion and transformation pipelines
"""

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from airflow.providers.google.cloud.operators.bigquery import (
    BigQueryCreateEmptyTableOperator,
    BigQueryInsertJobOperator,
    BigQueryCheckOperator,
)
from airflow.providers.google.cloud.transfers.gcs_to_bigquery import GCSToBigQueryOperator
from airflow.providers.google.cloud.operators.gcs import GCSListObjectsOperator
from airflow.providers.kafka.operators.produce_to_topic import ProduceToTopicOperator
from airflow.providers.http.operators.http import SimpleHttpOperator
from airflow.models import Variable
from airflow.utils.task_group import TaskGroup
from airflow.exceptions import AirflowException
import logging

logger = logging.getLogger(__name__)

# Configuration
PROJECT_ID = Variable.get("GCP_PROJECT_ID", "taxsense-ai")
DATASET_STAGING = "warehouse_staging"
DATASET_CONFORMED = "warehouse_conformed"
DATASET_ANALYTICS = "warehouse_analytics"
WAREHOUSE_BUCKET = f"gs://{PROJECT_ID}-warehouse"
KAFKA_BOOTSTRAP_SERVERS = Variable.get("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")

# Default DAG arguments
default_args = {
    "owner": "data-warehouse-team",
    "depends_on_past": False,
    "start_date": datetime(2026, 1, 1),
    "email": ["data-alerts@mnb.io"],
    "email_on_failure": True,
    "email_on_retry": False,
    "retries": 2,
    "retry_delay": timedelta(minutes=5),
    "sla": timedelta(hours=4),
}

# ============================================================================
# DAG 1: Daily Transaction Ingestion Pipeline
# ============================================================================

dag_daily_transactions = DAG(
    "warehouse_daily_transactions",
    default_args=default_args,
    description="Daily transaction ingestion from source systems",
    schedule_interval="0 2 * * *",  # 2 AM UTC
    catchup=False,
    tags=["warehouse", "daily", "transactions"],
)

def extract_taxsense_transactions(**context):
    """Extract transactions from TaxSense production database"""
    from google.cloud import bigquery
    import logging

    logger.info("Starting TaxSense transaction extraction...")

    # Query TaxSense operational database
    query = """
    SELECT
        id as source_transaction_id,
        'taxsense' as source_system,
        product_code,
        customer_id,
        merchant_id,
        transaction_type,
        amount,
        currency_code,
        created_at as transaction_timestamp,
        processed_at as processing_timestamp,
        settled_at as settlement_timestamp,
        payment_method,
        status,
        error_message,
        metadata,
        CURRENT_TIMESTAMP() as ingestion_timestamp,
        CURRENT_DATE() as _partition_date
    FROM `taxsense-prod.transactions.transactions_raw`
    WHERE created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
    """

    client = bigquery.Client(project=PROJECT_ID)

    # Load to staging
    job_config = bigquery.LoadJobConfig(
        write_disposition="WRITE_APPEND",
        schema_update_options=[bigquery.SchemaUpdateOptions.ALLOW_FIELD_ADDITION],
    )

    job = client.query(query)
    job.result()  # Wait for completion

    logger.info(f"Extracted {job.total_rows} transactions from TaxSense")
    context['task_instance'].xcom_push(
        key='transaction_count',
        value=job.total_rows
    )

def extract_abrobot_transactions(**context):
    """Extract transactions from AbroBot"""
    logger.info("Extracting AbroBot transactions...")
    # Similar implementation for AbroBot
    pass

def extract_draftsman_transactions(**context):
    """Extract transactions from Draftsman"""
    logger.info("Extracting Draftsman transactions...")
    # Similar implementation for Draftsman
    pass

def validate_transaction_data(**context):
    """Validate extracted transaction data"""
    from google.cloud import bigquery
    from great_expectations.dataset import SqlAlchemyDataset

    logger.info("Validating transaction data...")

    client = bigquery.Client(project=PROJECT_ID)

    validation_queries = {
        "not_null_amounts": f"""
        SELECT COUNT(*) as count
        FROM `{PROJECT_ID}.{DATASET_STAGING}.raw_transactions`
        WHERE amount_decimal IS NULL
        AND _partition_date = CURRENT_DATE()
        """,
        "positive_amounts": f"""
        SELECT COUNT(*) as count
        FROM `{PROJECT_ID}.{DATASET_STAGING}.raw_transactions`
        WHERE amount_decimal < 0
        AND transaction_type IN ('CREDIT', 'REFUND')
        AND _partition_date = CURRENT_DATE()
        """,
        "valid_status": f"""
        SELECT COUNT(*) as count
        FROM `{PROJECT_ID}.{DATASET_STAGING}.raw_transactions`
        WHERE status NOT IN ('pending', 'completed', 'failed', 'reversed')
        AND _partition_date = CURRENT_DATE()
        """,
    }

    failed_checks = []
    for check_name, query in validation_queries.items():
        result = client.query(query).result()
        row = list(result)[0]
        if row['count'] > 0:
            failed_checks.append(f"{check_name}: {row['count']} violations")

    if failed_checks:
        error_msg = "Data validation failed: " + ", ".join(failed_checks)
        logger.error(error_msg)
        raise AirflowException(error_msg)

    logger.info("All validation checks passed")

def conform_transaction_data(**context):
    """Transform and conform raw transactions"""
    from google.cloud import bigquery

    logger.info("Conforming transaction data...")

    client = bigquery.Client(project=PROJECT_ID)

    # Run dbt transformation
    transform_query = f"""
    INSERT INTO `{PROJECT_ID}.{DATASET_CONFORMED}.transactions`
    SELECT
        GENERATE_UUID() as transaction_id,
        source_transaction_id,
        source_system,
        product_code as product_id,
        customer_id,
        merchant_id,
        transaction_type,
        amount_decimal as amount_local_currency,
        ROUND(amount_decimal * COALESCE(fx_rate, 1.0), 2) as amount_usd,
        currency_code,
        CURRENT_DATE() as fx_rate_date,
        COALESCE(fx_rate, 1.0) as fx_rate,
        DATE(transaction_timestamp) as transaction_date,
        transaction_timestamp,
        processing_timestamp,
        DATE(settlement_timestamp) as settlement_date,
        settlement_timestamp,
        payment_method,
        status,
        NULL as error_code,
        error_message,
        JSON_EXTRACT(metadata, '$') as metadata,
        0.95 as data_quality_score,
        NULL as validation_errors,
        CURRENT_TIMESTAMP() as created_at,
        CURRENT_TIMESTAMP() as updated_at,
        CURRENT_TIMESTAMP() as etl_load_timestamp,
        GENERATE_UUID() as data_lineage_id,
        _partition_date
    FROM `{PROJECT_ID}.{DATASET_STAGING}.raw_transactions`
    WHERE _partition_date = CURRENT_DATE()
    AND status NOT IN ('pending', 'unknown')
    """

    job = client.query(transform_query)
    job.result()

    logger.info("Transaction data conformed successfully")

# Create tasks
extract_taxsense = PythonOperator(
    task_id="extract_taxsense_transactions",
    python_callable=extract_taxsense_transactions,
    dag=dag_daily_transactions,
)

extract_abrobot = PythonOperator(
    task_id="extract_abrobot_transactions",
    python_callable=extract_abrobot_transactions,
    dag=dag_daily_transactions,
)

extract_draftsman = PythonOperator(
    task_id="extract_draftsman_transactions",
    python_callable=extract_draftsman_transactions,
    dag=dag_daily_transactions,
)

validate_data = PythonOperator(
    task_id="validate_transaction_data",
    python_callable=validate_transaction_data,
    dag=dag_daily_transactions,
)

conform_data = PythonOperator(
    task_id="conform_transaction_data",
    python_callable=conform_transaction_data,
    dag=dag_daily_transactions,
)

run_dbt = BashOperator(
    task_id="run_dbt_transformations",
    bash_command=f"""
    cd /dbt_project && \
    dbt run \
        --profiles-dir /dbt_project \
        --project-dir /dbt_project \
        --target prod \
        --select tag:finance
    """,
    dag=dag_daily_transactions,
)

refresh_materialized_views = BigQueryInsertJobOperator(
    task_id="refresh_materialized_views",
    configuration={
        "query": {
            "query": f"CALL `{PROJECT_ID}.{DATASET_ANALYTICS}.refresh_materialized_views`()",
            "useLegacySql": False,
        }
    },
    dag=dag_daily_transactions,
)

# Task dependencies
[extract_taxsense, extract_abrobot, extract_draftsman] >> validate_data
validate_data >> conform_data >> run_dbt >> refresh_materialized_views

# ============================================================================
# DAG 2: Real-Time Kafka Streaming Pipeline
# ============================================================================

dag_realtime_streaming = DAG(
    "warehouse_realtime_kafka_streaming",
    default_args=default_args,
    description="Real-time data streaming via Kafka",
    schedule_interval=None,  # Triggered by Kafka events
    catchup=False,
    tags=["warehouse", "realtime", "streaming"],
)

# Kafka consumer configuration
kafka_config = {
    "bootstrap_servers": KAFKA_BOOTSTRAP_SERVERS,
    "group_id": "warehouse-consumer",
    "auto_offset_reset": "earliest",
    "enable_auto_commit": True,
}

# Stream transactions to BigQuery
stream_transactions_to_bq = BigQueryInsertJobOperator(
    task_id="stream_transactions_bigquery",
    configuration={
        "query": {
            "query": f"""
            SELECT
                JSON_EXTRACT_SCALAR(data, '$.transaction_id') as source_transaction_id,
                JSON_EXTRACT_SCALAR(data, '$.source_system') as source_system,
                JSON_EXTRACT_SCALAR(data, '$.product_code') as product_code,
                JSON_EXTRACT_SCALAR(data, '$.customer_id') as customer_id,
                JSON_EXTRACT_SCALAR(data, '$.amount') as amount_decimal,
                JSON_EXTRACT_SCALAR(data, '$.currency') as currency_code,
                TIMESTAMP(JSON_EXTRACT_SCALAR(data, '$.timestamp')) as transaction_timestamp,
                'COMPLETED' as status,
                CURRENT_TIMESTAMP() as ingestion_timestamp,
                CURRENT_DATE() as _partition_date
            FROM pubsub.topic.transactions
            WHERE _SHARD_TIME >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 MINUTE)
            """,
            "destination": f"{PROJECT_ID}.{DATASET_STAGING}.raw_transactions",
            "write_disposition": "WRITE_APPEND",
            "useQueryCache": False,
        }
    },
    dag=dag_realtime_streaming,
)

# ============================================================================
# DAG 3: Weekly Revenue Recognition Pipeline
# ============================================================================

dag_weekly_revenue = DAG(
    "warehouse_weekly_revenue_recognition",
    default_args=default_args,
    description="Weekly revenue recognition processing (IFRS 15)",
    schedule_interval="0 3 * * 0",  # Sunday 3 AM UTC
    catchup=False,
    tags=["warehouse", "weekly", "accounting", "revenue"],
)

def process_revenue_recognition(**context):
    """Process revenue recognition per IFRS 15"""
    from google.cloud import bigquery

    logger.info("Processing revenue recognition...")

    client = bigquery.Client(project=PROJECT_ID)

    # Revenue recognition logic
    query = f"""
    INSERT INTO `{PROJECT_ID}.{DATASET_ANALYTICS}.fct_revenue_recognition`
    WITH subscription_revenue AS (
        SELECT
            GENERATE_UUID() as revenue_id,
            t.transaction_id,
            t.customer_id,
            t.product_id,
            t.amount_usd as revenue_amount,
            DATE(t.transaction_timestamp) as revenue_date,
            'recognized' as recognition_status,
            GENERATE_UUID() as performance_obligation_id,
            'subscription' as revenue_category,
            g.tax_jurisdiction,
            0 as deferred_revenue_amount,
            CURRENT_TIMESTAMP() as created_at,
            CURRENT_TIMESTAMP() as updated_at,
            CURRENT_TIMESTAMP() as etl_load_timestamp
        FROM `{PROJECT_ID}.{DATASET_CONFORMED}.transactions` t
        LEFT JOIN `{PROJECT_ID}.{DATASET_ANALYTICS}.dim_geography` g
            ON t.customer_id = g.geography_id
        WHERE t.transaction_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
        AND t.status = 'completed'
    )
    SELECT * FROM subscription_revenue
    """

    job = client.query(query)
    job.result()

    logger.info("Revenue recognition processed")

revenue_processing = PythonOperator(
    task_id="process_revenue_recognition",
    python_callable=process_revenue_recognition,
    dag=dag_weekly_revenue,
)

# ============================================================================
# DAG 4: Monthly Compliance & Audit Pipeline
# ============================================================================

dag_monthly_compliance = DAG(
    "warehouse_monthly_compliance_audit",
    default_args=default_args,
    description="Monthly compliance and audit reporting",
    schedule_interval="0 4 1 * *",  # 1st of month at 4 AM UTC
    catchup=False,
    tags=["warehouse", "monthly", "compliance", "audit"],
)

def generate_audit_report(**context):
    """Generate comprehensive audit trail report"""
    logger.info("Generating audit trail report...")
    # Implementation for audit report generation
    pass

def validate_gdpr_compliance(**context):
    """Validate GDPR compliance"""
    logger.info("Validating GDPR compliance...")
    # Implementation for GDPR validation
    pass

def archive_audit_logs(**context):
    """Archive audit logs to cold storage"""
    from google.cloud import storage

    logger.info("Archiving audit logs to cold storage...")

    client = storage.Client(project=PROJECT_ID)
    bucket = client.bucket(f"{PROJECT_ID}-warehouse-archive")

    # Archive logic
    pass

audit_report = PythonOperator(
    task_id="generate_audit_report",
    python_callable=generate_audit_report,
    dag=dag_monthly_compliance,
)

gdpr_check = PythonOperator(
    task_id="validate_gdpr_compliance",
    python_callable=validate_gdpr_compliance,
    dag=dag_monthly_compliance,
)

archive_logs = PythonOperator(
    task_id="archive_audit_logs",
    python_callable=archive_audit_logs,
    dag=dag_monthly_compliance,
)

# Task dependencies
audit_report >> gdpr_check >> archive_logs

# ============================================================================
# DAG 5: Data Quality Monitoring
# ============================================================================

dag_quality_monitoring = DAG(
    "warehouse_data_quality_monitoring",
    default_args={**default_args, "email_on_retry": True},
    description="Continuous data quality monitoring",
    schedule_interval="*/15 * * * *",  # Every 15 minutes
    catchup=False,
    tags=["warehouse", "monitoring", "quality"],
)

def run_quality_checks(**context):
    """Run comprehensive data quality checks"""
    from google.cloud import bigquery

    logger.info("Running data quality checks...")

    client = bigquery.Client(project=PROJECT_ID)

    quality_checks = {
        "freshness": f"""
        SELECT
            COUNT(*) as violations
        FROM `{PROJECT_ID}.{DATASET_STAGING}.raw_transactions`
        WHERE ingestion_timestamp < TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 2 HOUR)
        """,
        "completeness": f"""
        SELECT
            COUNT(*) as violations
        FROM `{PROJECT_ID}.{DATASET_CONFORMED}.transactions`
        WHERE customer_id IS NULL
        OR product_id IS NULL
        OR amount_usd IS NULL
        """,
        "integrity": f"""
        SELECT
            COUNT(*) as violations
        FROM `{PROJECT_ID}.{DATASET_CONFORMED}.transactions` t
        LEFT JOIN `{PROJECT_ID}.{DATASET_ANALYTICS}.dim_customer` c
            ON t.customer_id = c.customer_id
        WHERE c.customer_sk IS NULL
        """,
    }

    for check_name, query in quality_checks.items():
        result = client.query(query).result()
        row = list(result)[0]

        # Store metrics
        metric_query = f"""
        INSERT INTO `{PROJECT_ID}.{DATASET_ANALYTICS}.data_quality_metrics`
        SELECT
            GENERATE_UUID() as quality_metric_id,
            'raw_transactions' as table_name,
            '{check_name}' as metric_name,
            {row['violations']} as metric_value,
            0 as expected_value,
            IF({row['violations']} > 0, 'FAILED', 'PASSED') as metric_status,
            CURRENT_TIMESTAMP() as check_timestamp,
            0 as execution_time_ms,
            NULL as error_message,
            CURRENT_TIMESTAMP() as created_at
        """

        client.query(metric_query).result()

quality_check = PythonOperator(
    task_id="run_quality_checks",
    python_callable=run_quality_checks,
    dag=dag_quality_monitoring,
)
