/**
 * Personalized Recommendation Engine
 * Combines ML predictions with tax rules to generate actionable recommendations
 */

import { type TaxProfile } from "../../tax-engine";
import { type PersonalizedRecommendation, type AnyPrediction } from "../types";
import { InferenceEngine } from "../inference/model-loader";

export interface RecommendationContext {
  profileId: string;
  profile: TaxProfile;
  predictions: {
    taxLiability?: number;
    regimeRecommendation?: { regime: "old" | "new"; probability: number };
    deductionOpportunities?: Array<{ section: string; potential: number }>;
    riskScore?: number;
  };
}

export class RecommendationEngine {
  private engine = InferenceEngine.getInstance();

  /**
   * Generate personalized recommendations
   */
  async generateRecommendations(context: RecommendationContext): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = [];

    // Get all predictions
    const [taxLiabilityModel, regimeModel, deductionModel, auditModel, savingsModel] = await Promise.all([
      this.engine.loadModel("tax_liability"),
      this.engine.loadModel("regime_recommender"),
      this.engine.loadModel("deduction_optimizer"),
      this.engine.loadModel("audit_risk_scorer"),
      this.engine.loadModel("savings_forecaster"),
    ]);

    // Regime switching recommendation
    const regimeRec = await this.generateRegimeSwitchRecommendation(context, regimeModel);
    if (regimeRec) recommendations.push(regimeRec);

    // Deduction optimization recommendations
    const deductionRecs = await this.generateDeductionRecommendations(context, deductionModel);
    recommendations.push(...deductionRecs);

    // Tax planning recommendations
    const planningRecs = await this.generateTaxPlanningRecommendations(context, auditModel);
    recommendations.push(...planningRecs);

    // Investment recommendations
    const investmentRecs = await this.generateInvestmentRecommendations(context, savingsModel);
    recommendations.push(...investmentRecs);

    // Sort by priority and impact
    return recommendations.sort((a, b) => {
      const priorityMap = { high: 3, medium: 2, low: 1 };
      return priorityMap[b.priority] - priorityMap[a.priority] || b.estimated_savings - a.estimated_savings;
    });
  }

  private async generateRegimeSwitchRecommendation(context: RecommendationContext, model: any): Promise<PersonalizedRecommendation | null> {
    // Check if regime switch makes sense
    const totalIncome = this.calculateTotalIncome(context.profile);
    const totalDeductions = this.calculateTotalDeductions(context.profile);

    // Rule: If deductions are low, new regime usually better
    // If deductions are high, old regime usually better
    const deductionRatio = totalIncome > 0 ? totalDeductions / totalIncome : 0;

    if (deductionRatio < 0.15 && totalIncome > 500000) {
      const savings = await this.estimateRegimeSwitchSavings(context.profile, "new");

      if (savings > 10000) {
        return {
          id: `rec_regime_${context.profileId}_${Date.now()}`,
          profile_id: context.profileId,
          type: "regime_switch",
          priority: savings > 50000 ? "high" : savings > 25000 ? "medium" : "low",
          title: "Switch to New Tax Regime",
          description: `With your current deductions (₹${totalDeductions.toLocaleString()}), the new tax regime could save you taxes.
The new regime has no deductions allowed but has a flatter structure with lower rates.`,
          estimated_savings: savings,
          feasibility: 0.95, // Very easy to switch
          implementation_effort: "quick",
          supporting_predictions: [],
          created_at: new Date(),
          expiration_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        };
      }
    } else if (deductionRatio > 0.25 && totalIncome > 500000) {
      const savings = await this.estimateRegimeSwitchSavings(context.profile, "old");

      if (savings > 10000) {
        return {
          id: `rec_regime_${context.profileId}_${Date.now()}`,
          profile_id: context.profileId,
          type: "regime_switch",
          priority: savings > 50000 ? "high" : savings > 25000 ? "medium" : "low",
          title: "Maximize Old Regime Benefits",
          description: `Your deductions (₹${totalDeductions.toLocaleString()}) are substantial.
Ensure you're maximizing all available deductions under sections 80C, 80D, 80E, and 80G.`,
          estimated_savings: savings,
          feasibility: 0.85,
          implementation_effort: "medium",
          supporting_predictions: [],
          created_at: new Date(),
        };
      }
    }

    return null;
  }

  private async generateDeductionRecommendations(context: RecommendationContext, model: any): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = [];
    const profile = context.profile;

    // Section 80C optimization
    const section80CCapacity = 150000;
    const section80CUsed = profile.deductions.section80C;
    const section80CRemaining = section80CCapacity - section80CUsed;

    if (section80CRemaining > 10000) {
      recommendations.push({
        id: `rec_80c_${context.profileId}_${Date.now()}`,
        profile_id: context.profileId,
        type: "deduction_increase",
        priority: "high",
        title: "Maximize Section 80C Deductions",
        description: `You have ₹${section80CRemaining.toLocaleString()} capacity remaining in Section 80C.
Consider investing in PPF, ELSS, or increasing CCCF/LIC premium.`,
        estimated_savings: section80CRemaining * 0.3, // Assume 30% tax bracket
        feasibility: 0.8,
        implementation_effort: "medium",
        supporting_predictions: [],
        created_at: new Date(),
      });
    }

    // Section 80D optimization
    const section80DCapacity = profile.deductions.parentsAreSenior ? 50000 : 25000;
    const section80DUsed = Math.min(profile.deductions.section80D_selfFamily, 25000) + Math.min(profile.deductions.section80D_parents, section80DCapacity);
    const section80DRemaining = Math.max(0, 75000 - section80DUsed); // 25k+50k max combined

    if (section80DRemaining > 5000) {
      recommendations.push({
        id: `rec_80d_${context.profileId}_${Date.now()}`,
        profile_id: context.profileId,
        type: "deduction_increase",
        priority: "medium",
        title: "Health Insurance Deduction Opportunity",
        description: `You can claim up to ₹${section80DRemaining.toLocaleString()} more under Section 80D.
Review and enhance your health insurance coverage for self, family, and parents.`,
        estimated_savings: section80DRemaining * 0.3,
        feasibility: 0.7,
        implementation_effort: "quick",
        supporting_predictions: [],
        created_at: new Date(),
      });
    }

    // Section 80E (education loan interest)
    if (profile.deductions.section80E === 0 && this.hasEducationLoan(profile)) {
      recommendations.push({
        id: `rec_80e_${context.profileId}_${Date.now()}`,
        profile_id: context.profileId,
        type: "deduction_increase",
        priority: "high",
        title: "Claim Education Loan Interest",
        description: "Section 80E allows you to claim the entire interest paid on education loans with no limit. Ensure you claim this benefit.",
        estimated_savings: 50000 * 0.3, // Conservative estimate
        feasibility: 0.95,
        implementation_effort: "quick",
        supporting_predictions: [],
        created_at: new Date(),
      });
    }

    return recommendations;
  }

  private async generateTaxPlanningRecommendations(context: RecommendationContext, model: any): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = [];
    const profile = context.profile;
    const totalIncome = this.calculateTotalIncome(profile);

    // Suggestion: Invest in NPS (Section 80CCD(1B))
    const npsCapacity = 50000;
    const npsUsed = profile.deductions.section80CCD1B || 0;

    if (npsUsed < npsCapacity && totalIncome > 500000) {
      recommendations.push({
        id: `rec_nps_${context.profileId}_${Date.now()}`,
        profile_id: context.profileId,
        type: "investment_suggestion",
        priority: "medium",
        title: "Enhance NPS Contributions",
        description: `You can invest an additional ₹${(npsCapacity - npsUsed).toLocaleString()} in NPS under Section 80CCD(1B).
NPS offers tax deduction + long-term wealth creation with government incentives.`,
        estimated_savings: (npsCapacity - npsUsed) * 0.3,
        feasibility: 0.85,
        implementation_effort: "medium",
        supporting_predictions: [],
        created_at: new Date(),
      });
    }

    // Suggestion: Tax-loss harvesting for capital gains
    if (profile.capitalGains && (profile.capitalGains.stcgOther > 0 || profile.capitalGains.ltcgOther > 0)) {
      recommendations.push({
        id: `rec_harvesting_${context.profileId}_${Date.now()}`,
        profile_id: context.profileId,
        type: "tax_planning",
        priority: "medium",
        title: "Tax-Loss Harvesting Strategy",
        description: "Review your portfolio for potential losses that can offset gains. Consider rebalancing to realize losses strategically.",
        estimated_savings: 50000, // Conservative estimate
        feasibility: 0.7,
        implementation_effort: "complex",
        supporting_predictions: [],
        created_at: new Date(),
      });
    }

    return recommendations;
  }

  private async generateInvestmentRecommendations(context: RecommendationContext, model: any): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = [];
    const profile = context.profile;

    // ELSS investment recommendation
    const section80CUsed = profile.deductions.section80C;
    if (section80CUsed < 150000) {
      recommendations.push({
        id: `rec_elss_${context.profileId}_${Date.now()}`,
        profile_id: context.profileId,
        type: "investment_suggestion",
        priority: "low",
        title: "Diversify with ELSS Funds",
        description: "ELSS (Equity-Linked Saving Scheme) offers tax deduction + equity growth potential. Ideal for long-term wealth creation.",
        estimated_savings: 15000 * 0.3, // Assume small allocation
        feasibility: 0.8,
        implementation_effort: "quick",
        supporting_predictions: [],
        created_at: new Date(),
      });
    }

    return recommendations;
  }

  /**
   * Estimate tax savings from regime switch
   */
  private async estimateRegimeSwitchSavings(profile: TaxProfile, targetRegime: "old" | "new"): Promise<number> {
    // Simplified calculation - in production would use full tax engine
    const totalIncome = this.calculateTotalIncome(profile);
    const totalDeductions = this.calculateTotalDeductions(profile);
    const taxableIncome = Math.max(0, totalIncome - totalDeductions);

    let oldRegimeTax = this.calculateTax(taxableIncome);
    let newRegimeTax = this.calculateTax(totalIncome); // No deductions in new regime

    return Math.abs(oldRegimeTax - newRegimeTax);
  }

  private calculateTotalIncome(profile: TaxProfile): number {
    return (
      (profile.salary?.grossSalary || 0) +
      (profile.capitalGains?.stcg111A || 0) +
      (profile.capitalGains?.stcgOther || 0) +
      (profile.capitalGains?.ltcg112A || 0) +
      (profile.capitalGains?.ltcgOther || 0) +
      (profile.business?.netIncome || 0) +
      (profile.otherSources?.savingsInterest || 0) +
      (profile.otherSources?.fdInterest || 0) +
      (profile.otherSources?.dividends || 0) +
      (profile.otherSources?.familyPension || 0) +
      (profile.otherSources?.other || 0)
    );
  }

  private calculateTotalDeductions(profile: TaxProfile): number {
    return (
      profile.deductions.section80C +
      (profile.deductions.section80CCD1B || 0) +
      profile.deductions.section80D_selfFamily +
      profile.deductions.section80D_parents +
      profile.deductions.section80E +
      profile.deductions.section80G
    );
  }

  private calculateTax(income: number): number {
    // Simplified tax calculation
    if (income <= 250000) return 0;
    if (income <= 500000) return (income - 250000) * 0.05;
    if (income <= 750000) return 12500 + (income - 500000) * 0.1;
    if (income <= 1000000) return 37500 + (income - 750000) * 0.15;
    if (income <= 1250000) return 75000 + (income - 1000000) * 0.2;
    if (income <= 1500000) return 125000 + (income - 1250000) * 0.25;
    return 187500 + (income - 1500000) * 0.3;
  }

  private hasEducationLoan(profile: TaxProfile): boolean {
    // Check if should have education loan based on profile
    return false; // Would be tracked in profile
  }
}
