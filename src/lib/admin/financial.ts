/**
 * Financial Analytics Engine
 * MRR, ARR, churn, LTV, and revenue forecasting
 */

import {
  FinancialMetrics,
  RevenueData,
  ChurnAnalysis,
  CustomerLTV,
  RevenueProjection,
} from "./types";

export class FinancialAnalytics {
  /**
   * Calculate Monthly Recurring Revenue (MRR)
   * Sum of all recurring revenue from active subscriptions
   */
  static calculateMRR(subscriptions: any[]): number {
    return subscriptions
      .filter((s) => s.status === "active")
      .reduce((sum, s) => sum + (s.monthly_price || s.annual_price / 12), 0);
  }

  /**
   * Calculate Annual Recurring Revenue (ARR)
   * MRR * 12
   */
  static calculateARR(subscriptions: any[]): number {
    return this.calculateMRR(subscriptions) * 12;
  }

  /**
   * Calculate Average Revenue Per User (ARPU)
   * Total revenue / active users
   */
  static calculateARPU(
    totalRevenue: number,
    activeUserCount: number
  ): number {
    return activeUserCount > 0 ? totalRevenue / activeUserCount : 0;
  }

  /**
   * Calculate Churn Rate
   * (Cancelled subscriptions / Starting subscriptions) * 100
   */
  static calculateChurnRate(
    cancelledCount: number,
    startingCount: number
  ): number {
    return startingCount > 0 ? (cancelledCount / startingCount) * 100 : 0;
  }

  /**
   * Calculate Net Retention Rate (NRR)
   * Measure of how much revenue is retained and expanded in a period
   * NRR = (Starting MRR + Expansion - Churn) / Starting MRR
   */
  static calculateNRR(
    startingMRR: number,
    endingMRR: number,
    expansionMRR: number,
    churnMRR: number
  ): number {
    if (startingMRR === 0) return 0;
    return ((endingMRR + expansionMRR - churnMRR) / startingMRR) * 100;
  }

  /**
   * Calculate Customer Lifetime Value (LTV)
   * (ARPU / Monthly Churn Rate) * Gross Margin
   */
  static calculateLTV(
    arpu: number,
    monthlyChurnRate: number,
    grossMargin: number = 0.75
  ): number {
    if (monthlyChurnRate >= 1 || monthlyChurnRate === 0) return 0;
    const customerLifetimeMonths = 1 / monthlyChurnRate;
    return arpu * customerLifetimeMonths * grossMargin;
  }

  /**
   * Calculate LTV to CAC Ratio
   * LTV / Customer Acquisition Cost (should be > 3 for healthy business)
   */
  static calculateLTVtoCACRatio(ltv: number, cac: number): number {
    return cac > 0 ? ltv / cac : 0;
  }

  /**
   * Calculate Growth Rate
   * ((Current - Previous) / Previous) * 100
   */
  static calculateGrowthRate(current: number, previous: number): number {
    return previous > 0 ? ((current - previous) / previous) * 100 : 0;
  }

  /**
   * Analyze Revenue Trends
   */
  static analyzeRevenueData(
    revenueHistory: RevenueData[]
  ): FinancialMetrics {
    const sorted = [...revenueHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    if (sorted.length === 0) {
      return {
        mrr: 0,
        arr: 0,
        arpu: 0,
        churn_rate: 0,
        ltv: 0,
        ltv_cac_ratio: 0,
        growth_rate: 0,
        net_retention_rate: 0,
      };
    }

    const latest = sorted[sorted.length - 1];
    const previous =
      sorted.length > 1 ? sorted[sorted.length - 2] : sorted[0];

    const mrr = latest.subscription_revenue;
    const arr = mrr * 12;
    const arpu = latest.subscription_count > 0
      ? latest.subscription_revenue / latest.subscription_count
      : 0;

    const churnRate = this.calculateChurnRate(
      latest.cancelled_subscriptions,
      latest.active_subscriptions
    );

    const cac = 50; // Default acquisition cost
    const ltv = this.calculateLTV(arpu, churnRate / 100, 0.75);
    const ltvCacRatio = this.calculateLTVtoCACRatio(ltv, cac);

    const growthRate = this.calculateGrowthRate(
      latest.subscription_revenue,
      previous.subscription_revenue
    );

    const nrr = this.calculateNRR(
      previous.subscription_revenue || mrr,
      latest.subscription_revenue,
      latest.addon_revenue || 0,
      (latest.cancelled_subscriptions || 0) * (arpu || 0)
    );

    return {
      mrr,
      arr,
      arpu,
      churn_rate: churnRate,
      ltv,
      ltv_cac_ratio: ltvCacRatio,
      growth_rate: growthRate,
      net_retention_rate: nrr,
    };
  }

  /**
   * Analyze Churn Patterns
   */
  static analyzeChurn(
    subscriptions: any[],
    period: "1m" | "3m" | "6m" | "12m" = "3m"
  ): ChurnAnalysis {
    const periodMs = {
      "1m": 30 * 24 * 60 * 60 * 1000,
      "3m": 90 * 24 * 60 * 60 * 1000,
      "6m": 180 * 24 * 60 * 60 * 1000,
      "12m": 365 * 24 * 60 * 60 * 1000,
    }[period];

    const cutoff = new Date(Date.now() - periodMs);

    const churned = subscriptions.filter(
      (s) =>
        s.status === "cancelled" &&
        new Date(s.cancelled_at) > cutoff
    );

    const retained = subscriptions.filter(
      (s) =>
        s.status === "active" &&
        new Date(s.created_at) < cutoff
    );

    const total = churned.length + retained.length;
    const churnRate = total > 0 ? (churned.length / total) * 100 : 0;

    // Analyze churn reasons
    const reasons: Record<string, number> = {};
    churned.forEach((s) => {
      const reason = s.churn_reason || "unknown";
      reasons[reason] = (reasons[reason] || 0) + 1;
    });

    // Identify high-risk users (approaching end of billing cycle)
    const highRiskUsers = subscriptions
      .filter((s) => {
        if (s.status !== "active") return false;
        const daysUntilRenewal = Math.ceil(
          (new Date(s.renewal_date).getTime() - Date.now()) /
            (24 * 60 * 60 * 1000)
        );
        return daysUntilRenewal <= 7 && daysUntilRenewal >= 0;
      })
      .map((s) => s.user_id);

    return {
      period,
      churn_rate: churnRate,
      churned_users: churned.length,
      retained_users: retained.length,
      reasons,
      high_risk_users: highRiskUsers,
    };
  }

  /**
   * Calculate Customer Cohort Metrics
   */
  static calculateCohortLTV(
    cohortData: any
  ): CustomerLTV {
    const totalMonths = cohortData.age_months || 0;
    const retention = cohortData.retention_rate || 0;
    const averageSpend = cohortData.average_monthly_spend || 0;

    // LTV = Average Monthly Spend * Customer Lifetime
    const customerLifetimeMonths =
      retention > 0 ? (1 / (1 - retention / 100)) * 12 : 12;
    const ltv = averageSpend * customerLifetimeMonths;

    const churnRisk = retention >= 80
      ? "low"
      : retention >= 50
        ? "medium"
        : "high";

    const retentionActions = [];
    if (churnRisk === "high") {
      retentionActions.push("personalized_outreach", "discount_offer");
    } else if (churnRisk === "medium") {
      retentionActions.push("feature_education", "usage_incentive");
    }

    return {
      customer_id: cohortData.customer_id,
      cohort_date: new Date(cohortData.cohort_date),
      total_revenue: averageSpend * totalMonths,
      months_active: totalMonths,
      ltv_prediction: ltv,
      churn_risk: churnRisk,
      retention_actions:
        retentionActions.length > 0 ? retentionActions : undefined,
    };
  }

  /**
   * Project Future Revenue
   */
  static projectRevenue(
    historicalData: RevenueData[],
    period: "30d" | "90d" | "1y" = "90d"
  ): RevenueProjection {
    const sorted = [...historicalData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    if (sorted.length < 2) {
      return {
        period,
        projected_mrr: 0,
        projected_arr: 0,
        growth_rate: 0,
        confidence: 0,
        scenarios: { conservative: 0, optimistic: 0 },
      };
    }

    // Calculate average monthly growth rate
    const revenues = sorted.map((d) => d.subscription_revenue);
    const growthRates = [];
    for (let i = 1; i < revenues.length; i++) {
      const rate = ((revenues[i] - revenues[i - 1]) / revenues[i - 1]) * 100;
      growthRates.push(rate);
    }

    const avgGrowthRate =
      growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
    const currentMRR = revenues[revenues.length - 1];

    // Project based on period
    const months = {
      "30d": 1,
      "90d": 3,
      "1y": 12,
    }[period];

    const projectedMRR = currentMRR * Math.pow(1 + avgGrowthRate / 100, months);
    const confidence = Math.min(
      100,
      (growthRates.filter((r) => !isNaN(r)).length / growthRates.length) * 100
    );

    return {
      period,
      projected_mrr: projectedMRR,
      projected_arr: projectedMRR * 12,
      growth_rate: avgGrowthRate,
      confidence,
      scenarios: {
        conservative: projectedMRR * 0.85,
        optimistic: projectedMRR * 1.15,
      },
    };
  }

  /**
   * Segment customers by revenue contribution
   */
  static segmentByRevenue(
    subscriptions: any[]
  ): Record<string, any> {
    const segments = {
      high_value: { count: 0, revenue: 0 },
      medium_value: { count: 0, revenue: 0 },
      low_value: { count: 0, revenue: 0 },
    };

    const values = subscriptions
      .filter((s) => s.status === "active")
      .map((s) => s.monthly_price || s.annual_price / 12);

    if (values.length === 0) return segments;

    const median = values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
    const q3 = values.sort((a, b) => a - b)[Math.floor(values.length * 0.75)];

    subscriptions.forEach((s) => {
      if (s.status !== "active") return;
      const value = s.monthly_price || s.annual_price / 12;

      if (value >= q3) {
        segments.high_value.count++;
        segments.high_value.revenue += value;
      } else if (value >= median) {
        segments.medium_value.count++;
        segments.medium_value.revenue += value;
      } else {
        segments.low_value.count++;
        segments.low_value.revenue += value;
      }
    });

    return segments;
  }
}
