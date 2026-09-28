/**
 * AI-powered tax optimization recommendations
 * Suggests specific actions to reduce tax liability
 * FY 2025-26 (AY 2026-27)
 */

import type { TaxProfile, ComparisonResult, RegimeComputation } from "../tax-engine";

export interface TaxRecommendation {
  /** Unique ID for tracking */
  id: string;
  /** Category: deduction, investment, planning, structure */
  category: "deduction" | "investment" | "planning" | "structure" | "regime";
  /** Priority: critical, high, medium, low */
  priority: "critical" | "high" | "medium" | "low";
  /** Human-readable title */
  title: string;
  /** Detailed explanation */
  description: string;
  /** Estimated tax savings in rupees */
  estimatedSavings: number;
  /** Required action */
  action: string;
  /** Implementation difficulty: easy, medium, hard */
  difficulty: "easy" | "medium" | "hard";
  /** Timeline: immediate, before-mar-31, next-fy */
  timeline: "immediate" | "before-mar-31" | "next-fy";
  /** Risk level: none, low, medium, high */
  risk: "none" | "low" | "medium" | "high";
  /** Prerequisites or conditions */
  prerequisites?: string[];
}

export interface OptimizationReport {
  recommendations: TaxRecommendation[];
  totalPotentialSavings: number;
  currentLiability: number;
  optimizedLiability: number;
  riskProfile: "conservative" | "moderate" | "aggressive";
}

/**
 * Generate personalized tax optimization recommendations
 */
export function generateOptimizationRecommendations(
  profile: TaxProfile,
  comparison: ComparisonResult
): OptimizationReport {
  const recommendations: TaxRecommendation[] = [];
  const current = comparison[comparison.recommended];

  // 1. REGIME SELECTION
  if (comparison.savings > 10_000) {
    recommendations.push({
      id: "regime-switch",
      category: "regime",
      priority: "critical",
      title: `File under ${comparison.recommended.toUpperCase()} regime`,
      description: `You can save ₹${comparison.savings.toLocaleString("en-IN")} by switching to the ${comparison.recommended} regime. This is a no-action-required optimization.`,
      estimatedSavings: comparison.savings,
      action: `Select ${comparison.recommended} regime when filing ITR`,
      difficulty: "easy",
      timeline: "before-mar-31",
      risk: "none",
    });
  }

  // 2. DEDUCTION OPTIMIZATION
  if (profile.salary && comparison.recommended === "old") {
    // Check HRA
    if (profile.salary.hraReceived > 0 && profile.salary.rentPaid > 0) {
      const hraExempt = Math.min(
        profile.salary.hraReceived,
        profile.salary.rentPaid - 0.1 * profile.salary.basicPlusDA,
        (profile.salary.isMetroCity ? 0.5 : 0.4) * profile.salary.basicPlusDA
      );

      if (hraExempt > 100_000) {
        recommendations.push({
          id: "hra-optimization",
          category: "deduction",
          priority: "high",
          title: "Optimize HRA claim",
          description: `Your HRA exemption of ₹${hraExempt.toLocaleString("en-IN")} is significant. Ensure rent receipts are properly documented. Consider increasing rent payments if possible.`,
          estimatedSavings: hraExempt * 0.2, // rough estimate
          action: "Document rent payments with supporting evidence",
          difficulty: "easy",
          timeline: "immediate",
          risk: "low",
          prerequisites: ["Valid rent receipts", "Rent agreement"],
        });
      }
    }

    // Check 80C utilization
    const cap80C = 150_000;
    if ((profile.deductions.section80C || 0) < cap80C * 0.8) {
      const unused = cap80C - (profile.deductions.section80C || 0);
      recommendations.push({
        id: "80c-unutilized",
        category: "deduction",
        priority: "high",
        title: "Maximize 80C deductions",
        description: `You're underutilizing Section 80C. You have ₹${unused.toLocaleString("en-IN")} of unused limit. Consider PPF, ELSS, or increased EPF contributions.`,
        estimatedSavings: unused * 0.2, // rough tax saving
        action: "Invest in PPF (₹150k/yr), ELSS funds, or life insurance",
        difficulty: "medium",
        timeline: "before-mar-31",
        risk: "low",
      });
    }
  }

  // 3. CAPITAL GAINS PLANNING
  if (profile.capitalGains) {
    const totalCG =
      (profile.capitalGains.stcg111A || 0) +
      (profile.capitalGains.stcgOther || 0) +
      (profile.capitalGains.ltcg112A || 0) +
      (profile.capitalGains.ltcgOther || 0);

    if (totalCG > 500_000 && comparison.recommended === "new") {
      recommendations.push({
        id: "cg-timing",
        category: "planning",
        priority: "medium",
        title: "Time capital gains realization",
        description: `You have significant capital gains (₹${totalCG.toLocaleString("en-IN")}). Consider splitting realization across two FYs if possible to avoid higher surcharge bracket (50L+).`,
        estimatedSavings: totalCG * 0.02, // rough surcharge saving
        action: "Stagger sale of securities across FY if strategically sound",
        difficulty: "hard",
        timeline: "next-fy",
        risk: "medium",
      });
    }
  }

  // 4. HOUSE PROPERTY OPTIMIZATION
  if (profile.houseProperties.length > 0 && comparison.recommended === "old") {
    const letOutProperties = profile.houseProperties.filter((h) => h.use === "let-out");
    if (letOutProperties.length > 0) {
      const totalInterest = letOutProperties.reduce((sum, h) => sum + h.homeLoanInterest, 0);
      if (totalInterest > 200_000) {
        recommendations.push({
          id: "hp-loss-carryforward",
          category: "planning",
          priority: "medium",
          title: "House property loss carry-forward",
          description: `Rental loss of ₹${(totalInterest - 200_000).toLocaleString("en-IN")} can be carried forward for 8 years. Track this carefully in your records.`,
          estimatedSavings: Math.min(totalInterest, 200_000) * 0.2,
          action: "Maintain rental loss schedule; carry forward unclaimed losses",
          difficulty: "easy",
          timeline: "immediate",
          risk: "none",
        });
      }
    }
  }

  // 5. SENIOR CITIZEN PLANNING
  if (profile.age >= 60 && comparison.recommended === "old") {
    recommendations.push({
      id: "senior-exemption",
      category: "deduction",
      priority: "high",
      title: "Claim senior citizen exemption",
      description: `At age ${profile.age}, you're eligible for higher basic exemption limit (₹3L at 60-79, ₹5L at 80+). Ensure this is claimed when filing.`,
      estimatedSavings: (profile.age >= 80 ? 500_000 : 300_000) * 0.2,
      action: "Claim appropriate exemption limit based on age",
      difficulty: "easy",
      timeline: "before-mar-31",
      risk: "none",
    });
  }

  // 6. SURCHARGE PLANNING
  if (current.totalIncome > 50_000_000) {
    recommendations.push({
      id: "surcharge-bracket",
      category: "planning",
      priority: "medium",
      title: "High-income surcharge optimization",
      description: `Your TI (₹${current.totalIncome.toLocaleString("en-IN")}) attracts 25% surcharge. Marginal relief may apply; verify calculation.`,
      estimatedSavings: current.totalIncome * 0.02, // rough estimate
      action: "Review surcharge calculation for marginal relief applicability",
      difficulty: "medium",
      timeline: "immediate",
      risk: "low",
    });
  }

  // 7. REBATE 87A MAXIMIZATION
  if (comparison.recommended === "new" && current.rebate87A === 0 && current.totalIncome > 1_200_000) {
    recommendations.push({
      id: "rebate-loss",
      category: "planning",
      priority: "medium",
      title: "Marginal relief limit crossed",
      description: `Your income (₹${current.totalIncome.toLocaleString("en-IN")}) exceeds ₹12L, where rebate 87A marginal relief ends. Consider income timing strategies.`,
      estimatedSavings: (current.totalIncome - 1_200_000) * 0.05,
      action: "Review if any income can be deferred to next FY",
      difficulty: "hard",
      timeline: "before-mar-31",
      risk: "high",
    });
  }

  // 8. INVESTMENT PLANNING
  if (!profile.deductions.section80C || profile.deductions.section80C < 50_000) {
    recommendations.push({
      id: "investment-planning",
      category: "investment",
      priority: "medium",
      title: "Start systematic tax-saving investments",
      description: "You're not utilizing tax-saving investments. Start a ₹12,500/month PPF or ELSS systematic plan to reduce tax.",
      estimatedSavings: 150_000 * 0.2,
      action: "Open PPF account or invest in ELSS mutual fund",
      difficulty: "easy",
      timeline: "before-mar-31",
      risk: "low",
      prerequisites: ["Bank account", "PAN"],
    });
  }

  // 9. FAMILY INCOME SPLITTING (if applicable)
  if (current.totalIncome > 5_000_000) {
    recommendations.push({
      id: "family-splitting",
      category: "structure",
      priority: "low",
      title: "Family income splitting (for eligible taxpayers)",
      description: "At high income levels, consider income splitting through family members (spouse HUF, etc.) for tax optimization.",
      estimatedSavings: current.totalIncome * 0.05,
      action: "Consult CA on family income splitting strategies",
      difficulty: "hard",
      timeline: "next-fy",
      risk: "high",
      prerequisites: ["Professional tax advice", "Legal structure"],
    });
  }

  // 10. TDS MANAGEMENT
  if (profile.taxesPaid === 0 && current.totalTaxLiability > 100_000) {
    recommendations.push({
      id: "tds-planning",
      category: "planning",
      priority: "high",
      title: "Plan TDS/advance tax",
      description: `You have no TDS recorded but owe ₹${current.totalTaxLiability.toLocaleString("en-IN")}. Arrange advance tax payments to avoid penalties.`,
      estimatedSavings: 0, // no savings, but avoids penalties
      action: "Pay advance tax in quarterly installments",
      difficulty: "easy",
      timeline: "immediate",
      risk: "none",
    });
  }

  // Calculate total potential savings
  const totalPotentialSavings = recommendations.reduce((sum, r) => sum + r.estimatedSavings, 0);

  // Determine risk profile
  const highRiskCount = recommendations.filter((r) => r.risk === "high").length;
  const riskProfile: "conservative" | "moderate" | "aggressive" =
    highRiskCount > 2 ? "aggressive" : highRiskCount > 0 ? "moderate" : "conservative";

  return {
    recommendations: recommendations.sort((a, b) => {
      // Sort by: priority, then savings
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      return priorityDiff !== 0 ? priorityDiff : b.estimatedSavings - a.estimatedSavings;
    }),
    totalPotentialSavings: Math.min(totalPotentialSavings, current.totalTaxLiability * 0.3), // cap at 30% of tax
    currentLiability: current.totalTaxLiability,
    optimizedLiability: Math.max(0, current.totalTaxLiability - totalPotentialSavings),
    riskProfile,
  };
}

/**
 * Get recommendations by category
 */
export function getRecommendationsByCategory(
  recommendations: TaxRecommendation[],
  category: TaxRecommendation["category"]
): TaxRecommendation[] {
  return recommendations.filter((r) => r.category === category);
}

/**
 * Calculate effort-to-savings ratio
 */
export function getEaseOfImplementation(
  recommendations: TaxRecommendation[]
): TaxRecommendation[] {
  const difficultyScore = { easy: 3, medium: 2, hard: 1 };
  return [...recommendations].sort((a, b) => {
    const scoreA = (difficultyScore[a.difficulty] * a.estimatedSavings) / 100;
    const scoreB = (difficultyScore[b.difficulty] * b.estimatedSavings) / 100;
    return scoreB - scoreA; // Best effort-to-savings ratio first
  });
}
