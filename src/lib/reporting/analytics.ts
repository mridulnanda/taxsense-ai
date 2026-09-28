/**
 * Advanced tax analytics and insights
 * FY 2025-26 (AY 2026-27)
 */

import type { RegimeComputation, TaxProfile, ComparisonResult } from "../tax-engine";

export interface TaxInsights {
  /** Effective tax rate */
  effectiveTaxRate: number;
  /** Marginal tax rate */
  marginalRate: number;
  /** Average tax per rupee of income */
  taxPerRupee: number;
  /** Breakdown by income head */
  incomeHeadBreakdown: Record<string, { income: number; percentage: number }>;
  /** Tax composition */
  taxComposition: Record<string, { amount: number; percentage: number }>;
  /** Key metrics */
  metrics: TaxMetrics;
}

export interface TaxMetrics {
  /** Total income */
  totalIncome: number;
  /** Total deductions */
  totalDeductions: number;
  /** Gross income before deductions */
  grossIncome: number;
  /** Tax liability */
  taxLiability: number;
  /** Surcharge amount */
  surcharge: number;
  /** Cess amount */
  cess: number;
  /** Effective tax percentage */
  effectiveRatePct: number;
  /** Net payable (due/refund) */
  netPayable: number;
}

/**
 * Generate comprehensive tax analytics
 */
export function generateTaxInsights(computation: RegimeComputation): TaxInsights {
  const totalIncome = computation.totalIncome;
  const taxLiability = computation.totalTaxLiability;

  // Calculate effective tax rate
  const effectiveTaxRate = totalIncome > 0 ? (taxLiability / totalIncome) * 100 : 0;

  // Calculate marginal rate (rate on last rupee)
  let marginalRate = 0;
  if (computation.slabLines.length > 0) {
    const lastSlab = computation.slabLines[computation.slabLines.length - 1];
    marginalRate = lastSlab.ratePct;
  }

  // Tax per rupee
  const taxPerRupee = totalIncome > 0 ? taxLiability / totalIncome : 0;

  // Income head breakdown
  const incomeHeadBreakdown: Record<string, { income: number; percentage: number }> = {};
  const totalHeads = Object.entries(computation.heads).reduce((sum, [, amount]) => sum + amount, 0);

  Object.entries(computation.heads).forEach(([head, amount]) => {
    incomeHeadBreakdown[head] = {
      income: amount,
      percentage: totalHeads > 0 ? (amount / totalHeads) * 100 : 0,
    };
  });

  // Tax composition
  const taxComposition: Record<string, { amount: number; percentage: number }> = {};
  const components = [
    { name: "Normal Tax", value: computation.taxOnNormalIncome },
    { name: "Special Rate Tax", value: Object.values(computation.specialRateTax).reduce((sum, r) => sum + r.tax, 0) },
    { name: "Rebate 87A", value: -computation.rebate87A },
    { name: "Marginal Relief", value: -computation.rebateMarginalRelief },
    { name: "Surcharge", value: computation.surcharge },
    { name: "Surcharge Relief", value: -computation.surchargeMarginalRelief },
    { name: "Cess", value: computation.cess },
  ];

  const netTaxBefore = components.reduce((sum, c) => sum + c.value, 0);
  components.forEach((comp) => {
    if (netTaxBefore !== 0) {
      taxComposition[comp.name] = {
        amount: comp.value,
        percentage: (comp.value / Math.abs(netTaxBefore)) * 100,
      };
    }
  });

  return {
    effectiveTaxRate,
    marginalRate,
    taxPerRupee,
    incomeHeadBreakdown,
    taxComposition,
    metrics: {
      totalIncome,
      totalDeductions: computation.totalDeductions,
      grossIncome: computation.grossTotalIncome,
      taxLiability,
      surcharge: computation.surcharge,
      cess: computation.cess,
      effectiveRatePct: computation.effectiveRatePct,
      netPayable: computation.netPayable,
    },
  };
}

/**
 * Compare tax metrics between two years
 */
export interface YearOverYearComparison {
  year1: { year: number; insights: TaxInsights };
  year2: { year: number; insights: TaxInsights };
  changes: {
    incomeChange: number;
    incomeChangePercent: number;
    taxChange: number;
    taxChangePercent: number;
    effectiveRateChange: number;
  };
}

export function compareYears(
  year1: { year: number; computation: RegimeComputation },
  year2: { year: number; computation: RegimeComputation }
): YearOverYearComparison {
  const insights1 = generateTaxInsights(year1.computation);
  const insights2 = generateTaxInsights(year2.computation);

  const incomeChange = insights2.metrics.totalIncome - insights1.metrics.totalIncome;
  const incomeChangePercent =
    insights1.metrics.totalIncome > 0 ? (incomeChange / insights1.metrics.totalIncome) * 100 : 0;

  const taxChange = insights2.metrics.taxLiability - insights1.metrics.taxLiability;
  const taxChangePercent =
    insights1.metrics.taxLiability > 0 ? (taxChange / insights1.metrics.taxLiability) * 100 : 0;

  const effectiveRateChange = insights2.effectiveTaxRate - insights1.effectiveTaxRate;

  return {
    year1: { year: year1.year, insights: insights1 },
    year2: { year: year2.year, insights: insights2 },
    changes: {
      incomeChange,
      incomeChangePercent,
      taxChange,
      taxChangePercent,
      effectiveRateChange,
    },
  };
}

/**
 * Generate detailed tax summary
 */
export interface TaxSummary {
  title: string;
  regime: "old" | "new";
  generatedAt: string;
  taxpayer?: string;
  fy: string;
  insights: TaxInsights;
  notes: string[];
}

export function generateTaxSummary(
  computation: RegimeComputation,
  taxpayerName?: string
): TaxSummary {
  return {
    title: "Tax Computation Summary",
    regime: computation.regime,
    generatedAt: new Date().toISOString(),
    taxpayer: taxpayerName,
    fy: "FY 2025-26 (AY 2026-27)",
    insights: generateTaxInsights(computation),
    notes: computation.notes,
  };
}

/**
 * Identify taxation patterns and anomalies
 */
export interface TaxPattern {
  /** Pattern name */
  name: string;
  /** Description */
  description: string;
  /** Severity: info, warning, alert */
  severity: "info" | "warning" | "alert";
  /** Recommended action */
  action: string;
}

export function identifyTaxPatterns(insights: TaxInsights): TaxPattern[] {
  const patterns: TaxPattern[] = [];

  // High effective rate
  if (insights.effectiveTaxRate > 30) {
    patterns.push({
      name: "High Tax Burden",
      description: `Your effective tax rate of ${insights.effectiveTaxRate.toFixed(2)}% is significantly above average.`,
      severity: "warning",
      action: "Review deduction opportunities and consider tax planning strategies.",
    });
  }

  // Significant surcharge
  if (insights.metrics.surcharge > insights.metrics.taxLiability * 0.1) {
    patterns.push({
      name: "High Surcharge",
      description: "Surcharge represents >10% of your tax liability.",
      severity: "alert",
      action: "Consider income splitting or capital gains timing strategies.",
    });
  }

  // Low deductions utilized
  if (insights.metrics.totalDeductions < 50_000 && insights.metrics.grossIncome > 1_000_000) {
    patterns.push({
      name: "Underutilized Deductions",
      description: "You're not utilizing available tax deductions optimally.",
      severity: "warning",
      action: "Explore Section 80C (PPF, ELSS), 80D (health insurance), and 80E (education loan).",
    });
  }

  // Tax liability vs income
  if (insights.metrics.netPayable > insights.metrics.taxLiability * 0.2) {
    patterns.push({
      name: "Significant Payment Due",
      description: "High tax liability with significant amount still due.",
      severity: "info",
      action: "Ensure advance tax payments are planned to avoid penalties.",
    });
  }

  return patterns;
}
