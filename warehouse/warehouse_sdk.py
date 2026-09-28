"""
Financial Data Warehouse SDK
Python library for interacting with the enterprise data warehouse

Usage:
    from warehouse.warehouse_sdk import Warehouse

    wh = Warehouse('your-gcp-project')

    # Get transaction data
    transactions = wh.get_transactions(
        customer_id='cust-123',
        date_range=('2026-01-01', '2026-09-28')
    )

    # Get KPIs
    mrr = wh.get_monthly_recurring_revenue(product_id='taxsense-pro')

    # Run custom query
    results = wh.query('SELECT * FROM warehouse_analytics.fct_transactions LIMIT 100')
"""

from typing import List, Dict, Tuple, Optional, Any
from datetime import datetime, date
import json
import logging
from functools import lru_cache
import pandas as pd
from google.cloud import bigquery
from google.cloud.exceptions import NotFound, PermissionDenied
import pyarrow

logger = logging.getLogger(__name__)


class WarehouseConnection:
    """Connection management for BigQuery data warehouse"""

    def __init__(self, project_id: str, location: str = 'US'):
        self.project_id = project_id
        self.location = location
        self.client = bigquery.Client(project=project_id, location=location)
        self._verify_connection()

    def _verify_connection(self):
        """Verify connection to BigQuery"""
        try:
            self.client.query("SELECT 1").result(timeout=5)
            logger.info(f"Connected to BigQuery project: {self.project_id}")
        except PermissionDenied:
            raise Exception(f"Permission denied to access project {self.project_id}")
        except Exception as e:
            raise Exception(f"Failed to connect to BigQuery: {str(e)}")

    def query(self, sql: str, timeout: int = 300) -> bigquery.QueryJob:
        """Execute SQL query against warehouse"""
        job_config = bigquery.QueryJobConfig()
        return self.client.query(sql, job_config=job_config, timeout=timeout)

    def get_dataframe(self, sql: str) -> pd.DataFrame:
        """Get query results as pandas DataFrame"""
        return self.client.query(sql).to_pandas()

    def get_list(self, sql: str) -> List[Dict]:
        """Get query results as list of dicts"""
        results = self.client.query(sql).result()
        return [dict(row) for row in results]


class TransactionService:
    """Service for transaction data access"""

    def __init__(self, conn: WarehouseConnection):
        self.conn = conn

    def get_transactions(
        self,
        customer_id: Optional[str] = None,
        product_id: Optional[str] = None,
        date_range: Optional[Tuple[str, str]] = None,
        status: Optional[str] = None,
        limit: int = 10000
    ) -> pd.DataFrame:
        """Fetch transactions with filters"""

        query = "SELECT * FROM warehouse_analytics.fct_transactions WHERE 1=1"

        if customer_id:
            query += f" AND customer_sk IN (SELECT customer_sk FROM warehouse_analytics.dim_customer WHERE customer_id = '{customer_id}')"

        if product_id:
            query += f" AND product_sk IN (SELECT product_sk FROM warehouse_analytics.dim_product WHERE product_id = '{product_id}')"

        if date_range:
            start_date, end_date = date_range
            query += f" AND _partition_date BETWEEN '{start_date}' AND '{end_date}'"

        if status:
            query += f" AND status = '{status}'"

        query += f" LIMIT {limit}"

        logger.info(f"Fetching transactions with filters: customer={customer_id}, product={product_id}")
        return self.conn.get_dataframe(query)

    def get_transaction_count(
        self,
        date_range: Optional[Tuple[str, str]] = None
    ) -> int:
        """Get total transaction count"""

        query = "SELECT COUNT(*) as count FROM warehouse_analytics.fct_transactions WHERE 1=1"

        if date_range:
            start_date, end_date = date_range
            query += f" AND _partition_date BETWEEN '{start_date}' AND '{end_date}'"

        result = self.conn.client.query(query).result()
        return list(result)[0]['count']

    def get_transaction_volume_by_day(
        self,
        date_range: Optional[Tuple[str, str]] = None
    ) -> pd.DataFrame:
        """Get daily transaction volume"""

        query = """
        SELECT
            dd.date_actual as date,
            COUNT(*) as transaction_count,
            SUM(amount_usd) as total_amount_usd,
            COUNT(DISTINCT customer_sk) as unique_customers
        FROM warehouse_analytics.fct_transactions ft
        JOIN warehouse_analytics.dim_date dd ON ft.date_sk = dd.date_sk
        WHERE 1=1
        """

        if date_range:
            start_date, end_date = date_range
            query += f" AND dd.date_actual BETWEEN '{start_date}' AND '{end_date}'"

        query += " GROUP BY date ORDER BY date DESC"

        return self.conn.get_dataframe(query)


class SubscriptionService:
    """Service for subscription and revenue metrics"""

    def __init__(self, conn: WarehouseConnection):
        self.conn = conn

    def get_monthly_recurring_revenue(
        self,
        product_id: Optional[str] = None,
        as_of_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get MRR (Monthly Recurring Revenue)"""

        as_of_date = as_of_date or str(date.today())

        query = f"""
        SELECT
            COALESCE(p.product_name, 'All Products') as product,
            SUM(sm.mrr) as mrr,
            SUM(sm.arr) as arr,
            COUNT(DISTINCT sm.customer_sk) as active_customers,
            COUNT(DISTINCT CASE WHEN sm.is_churned_this_period THEN sm.customer_sk END) as churned_customers
        FROM warehouse_analytics.fct_subscription_metrics sm
        JOIN warehouse_analytics.dim_product p ON sm.product_sk = p.product_sk
        WHERE sm.is_active_as_of_date = TRUE
        AND sm.date_sk <= (SELECT date_sk FROM warehouse_analytics.dim_date WHERE date_actual = '{as_of_date}')
        """

        if product_id:
            query += f" AND p.product_id = '{product_id}'"

        query += " GROUP BY product"

        results = self.conn.get_list(query)
        return {r['product']: r for r in results}

    def get_cohort_retention(
        self,
        product_id: Optional[str] = None
    ) -> pd.DataFrame:
        """Get cohort-based retention analysis"""

        query = """
        SELECT
            cohort_year,
            cohort_month,
            month_in_cohort,
            users_active
        FROM warehouse_analytics.fct_cohort_analysis
        WHERE 1=1
        """

        if product_id:
            query += f" AND product_id = '{product_id}'"

        query += " ORDER BY cohort_year DESC, cohort_month DESC, month_in_cohort"

        return self.conn.get_dataframe(query)

    def get_churn_prediction(
        self,
        days_ahead: int = 30,
        min_probability: float = 0.7
    ) -> pd.DataFrame:
        """Get customers likely to churn"""

        query = f"""
        SELECT
            dc.customer_id,
            dc.customer_name,
            dc.company_name,
            dc.annual_contract_value,
            sm.churn_probability_score,
            sm.mrr
        FROM warehouse_analytics.fct_subscription_metrics sm
        JOIN warehouse_analytics.dim_customer dc ON sm.customer_sk = dc.customer_sk
        WHERE sm.is_active_as_of_date = TRUE
        AND sm.churn_probability_score >= {min_probability}
        ORDER BY sm.churn_probability_score DESC
        LIMIT 500
        """

        logger.info(f"Fetching churn predictions (probability >= {min_probability})")
        return self.conn.get_dataframe(query)


class CustomerService:
    """Service for customer data access"""

    def __init__(self, conn: WarehouseConnection):
        self.conn = conn

    def get_customer(self, customer_id: str) -> Dict[str, Any]:
        """Get customer details"""

        query = f"""
        SELECT *
        FROM warehouse_analytics.dim_customer
        WHERE customer_id = '{customer_id}'
        AND is_current = TRUE
        LIMIT 1
        """

        results = self.conn.get_list(query)
        return results[0] if results else None

    def get_customer_lifetime_value(
        self,
        customer_id: str
    ) -> float:
        """Calculate customer lifetime value"""

        query = f"""
        SELECT
            COALESCE(SUM(amount_usd), 0) as ltv
        FROM warehouse_analytics.fct_transactions
        WHERE customer_sk IN (
            SELECT customer_sk FROM warehouse_analytics.dim_customer
            WHERE customer_id = '{customer_id}'
        )
        AND status = 'completed'
        """

        result = self.conn.client.query(query).result()
        row = list(result)[0]
        return float(row['ltv'])

    def get_customers_by_segment(
        self,
        segment: str
    ) -> pd.DataFrame:
        """Get customers by segment"""

        query = f"""
        SELECT
            customer_id,
            customer_name,
            company_name,
            annual_contract_value,
            lifetime_value,
            churn_risk_score
        FROM warehouse_analytics.dim_customer
        WHERE customer_segment = '{segment}'
        AND is_current = TRUE
        ORDER BY annual_contract_value DESC
        """

        return self.conn.get_dataframe(query)


class AnalyticsService:
    """Service for advanced analytics and reporting"""

    def __init__(self, conn: WarehouseConnection):
        self.conn = conn

    def get_daily_kpis(
        self,
        date: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get daily KPIs"""

        date = date or str(date.today())

        query = f"""
        SELECT
            COUNT(*) as daily_transactions,
            SUM(amount_usd) as daily_revenue,
            COUNT(DISTINCT customer_sk) as daily_active_customers,
            AVG(amount_usd) as avg_transaction_amount
        FROM warehouse_analytics.fct_transactions
        WHERE _partition_date = '{date}'
        AND status = 'completed'
        """

        result = self.conn.get_list(query)
        return result[0] if result else {}

    def get_product_performance(self) -> pd.DataFrame:
        """Get performance metrics by product"""

        query = """
        SELECT
            p.product_name,
            COUNT(DISTINCT ft.customer_sk) as active_customers,
            SUM(ft.amount_usd) as total_revenue,
            COUNT(*) as transaction_count,
            ROUND(SUM(ft.amount_usd) / COUNT(*), 2) as avg_transaction_amount,
            COUNT(DISTINCT CASE WHEN ft.is_failed THEN 1 END) as failed_transactions,
            ROUND(100 * COUNT(DISTINCT CASE WHEN ft.is_failed THEN 1 END) / COUNT(*), 2) as failure_rate_pct
        FROM warehouse_analytics.fct_transactions ft
        JOIN warehouse_analytics.dim_product p ON ft.product_sk = p.product_sk
        WHERE ft._partition_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
        AND ft.status = 'completed'
        GROUP BY p.product_name
        ORDER BY total_revenue DESC
        """

        return self.conn.get_dataframe(query)

    def get_geographic_performance(self) -> pd.DataFrame:
        """Get performance metrics by geography"""

        query = """
        SELECT
            COALESCE(g.country_name, 'Unknown') as country,
            COUNT(DISTINCT ft.customer_sk) as customers,
            SUM(ft.amount_usd) as revenue,
            COUNT(*) as transactions
        FROM warehouse_analytics.fct_transactions ft
        LEFT JOIN warehouse_analytics.dim_customer dc ON ft.customer_sk = dc.customer_sk
        LEFT JOIN warehouse_analytics.dim_geography g ON dc.country = g.country_code
        WHERE ft._partition_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
        AND ft.status = 'completed'
        GROUP BY country
        ORDER BY revenue DESC
        """

        return self.conn.get_dataframe(query)


class ComplianceService:
    """Service for compliance and data governance"""

    def __init__(self, conn: WarehouseConnection):
        self.conn = conn

    def get_audit_trail(
        self,
        customer_id: str,
        event_type: Optional[str] = None
    ) -> pd.DataFrame:
        """Get audit trail for a customer (for GDPR DSARs)"""

        query = f"""
        SELECT
            audit_event_id,
            event_type,
            user_id,
            action,
            timestamp,
            justification
        FROM warehouse_analytics.compliance_audit_trail
        WHERE customer_id = '{customer_id}'
        """

        if event_type:
            query += f" AND event_type = '{event_type}'"

        query += " ORDER BY timestamp DESC"

        logger.info(f"Retrieving audit trail for customer {customer_id}")
        return self.conn.get_dataframe(query)

    def get_data_lineage(
        self,
        table_name: str
    ) -> pd.DataFrame:
        """Get data lineage for impact analysis"""

        query = f"""
        SELECT
            source_table,
            transform_pipeline,
            target_table,
            transform_timestamp,
            transform_status
        FROM warehouse_analytics.data_lineage
        WHERE source_table = '{table_name}'
        OR target_table = '{table_name}'
        ORDER BY transform_timestamp DESC
        LIMIT 100
        """

        return self.conn.get_dataframe(query)

    def get_quality_metrics(
        self,
        table_name: Optional[str] = None
    ) -> pd.DataFrame:
        """Get data quality metrics"""

        query = """
        SELECT
            table_name,
            metric_name,
            metric_value,
            metric_status,
            check_timestamp
        FROM warehouse_analytics.data_quality_metrics
        WHERE check_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
        """

        if table_name:
            query += f" AND table_name = '{table_name}'"

        query += " ORDER BY check_timestamp DESC"

        return self.conn.get_dataframe(query)


class Warehouse:
    """Main warehouse API - unified access to all services"""

    def __init__(self, project_id: str, location: str = 'US'):
        """Initialize warehouse with GCP project"""

        self.conn = WarehouseConnection(project_id, location)

        # Initialize services
        self.transactions = TransactionService(self.conn)
        self.subscriptions = SubscriptionService(self.conn)
        self.customers = CustomerService(self.conn)
        self.analytics = AnalyticsService(self.conn)
        self.compliance = ComplianceService(self.conn)

    def query(self, sql: str, to_pandas: bool = False) -> Any:
        """Run custom SQL query"""

        if to_pandas:
            return self.conn.get_dataframe(sql)
        else:
            return self.conn.get_list(sql)

    def __repr__(self):
        return f"Warehouse(project_id={self.conn.project_id})"


# Example Usage
if __name__ == "__main__":
    # Initialize warehouse
    wh = Warehouse('taxsense-ai')

    # Get daily KPIs
    kpis = wh.analytics.get_daily_kpis()
    print(f"Daily KPIs: {kpis}")

    # Get customer details
    customer = wh.customers.get_customer('cust-123')
    print(f"Customer: {customer}")

    # Get churn predictions
    churn_risk = wh.subscriptions.get_churn_prediction(min_probability=0.7)
    print(f"\nCustomers at risk of churn:\n{churn_risk}")

    # Get product performance
    performance = wh.analytics.get_product_performance()
    print(f"\nProduct Performance:\n{performance}")

    # Custom query
    top_customers = wh.query("""
        SELECT
            dc.customer_name,
            SUM(ft.amount_usd) as lifetime_revenue
        FROM warehouse_analytics.fct_transactions ft
        JOIN warehouse_analytics.dim_customer dc ON ft.customer_sk = dc.customer_sk
        WHERE ft.status = 'completed'
        GROUP BY dc.customer_name
        ORDER BY lifetime_revenue DESC
        LIMIT 10
    """, to_pandas=True)

    print(f"\nTop 10 Customers:\n{top_customers}")
