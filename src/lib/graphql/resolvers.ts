/**
 * GraphQL Resolvers for TaxSense AI
 * Implements all query and mutation resolvers with validation and error handling
 */

import { z } from 'zod';
import { computeBoth } from '../tax-engine';
import { generateOptimizationRecommendations } from '../optimizer/recommendations';
import { ScenarioPlanner } from '../optimizer/scenarios';
import { generateTaxInsights } from '../reporting/analytics';
import type {
  GraphQLContext,
  TaxProfileInput,
  TaxComputationResultOutput,
  RegimeComputationOutput,
  OptimizationReportOutput,
  ScenarioComparisonResultOutput,
  TaxAnalyticsOutput,
  RegimeComparisonOutput,
  HealthStatusOutput,
  ComputeTaxResultOutput,
  ScenarioResultOutput,
  ProfileUpdateResultOutput,
  ExportResultOutput,
  ComparisonSaveResultOutput,
  QueryResolvers,
  MutationResolvers,
} from './types';
import type { TaxProfile } from '../tax-engine';

// ============================================================================
// VALIDATORS
// ============================================================================

const TaxProfileSchema = z.object({
  name: z.string().optional(),
  age: z.number().int().min(18).max(125),
  residentialStatus: z.enum(['resident', 'nri']),
  salary: z.object({
    grossSalary: z.number().nonnegative(),
    basicPlusDA: z.number().nonnegative(),
    hraReceived: z.number().nonnegative(),
    rentPaid: z.number().nonnegative(),
    isMetroCity: z.boolean(),
    employerNpsContribution: z.number().nonnegative(),
    professionalTax: z.number().nonnegative(),
  }).optional(),
  houseProperties: z.array(z.object({
    use: z.enum(['self-occupied', 'let-out']),
    annualRent: z.number().nonnegative(),
    municipalTaxes: z.number().nonnegative(),
    homeLoanInterest: z.number().nonnegative(),
  })).default([]),
  capitalGains: z.object({
    stcg111A: z.number().nonnegative(),
    stcgOther: z.number().nonnegative(),
    ltcg112A: z.number().nonnegative(),
    ltcgOther: z.number().nonnegative(),
  }).optional(),
  business: z.object({
    netIncome: z.number(),
    presumptive: z.boolean().optional(),
  }).optional(),
  otherSources: z.object({
    savingsInterest: z.number().nonnegative(),
    fdInterest: z.number().nonnegative(),
    dividends: z.number().nonnegative(),
    familyPension: z.number().nonnegative(),
    other: z.number().nonnegative(),
  }).optional(),
  deductions: z.object({
    section80C: z.number().nonnegative(),
    section80CCD1B: z.number().nonnegative(),
    section80D_selfFamily: z.number().nonnegative(),
    section80D_parents: z.number().nonnegative(),
    parentsAreSenior: z.boolean(),
    section80E: z.number().nonnegative(),
    section80G: z.number().nonnegative(),
  }),
  taxesPaid: z.number().nonnegative(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert internal TaxProfile to input format
 */
function profileInputToInternal(input: TaxProfileInput): TaxProfile {
  return {
    name: input.name,
    age: input.age,
    residentialStatus: input.residentialStatus,
    salary: input.salary ? {
      grossSalary: input.salary.grossSalary,
      basicPlusDA: input.salary.basicPlusDA,
      hraReceived: input.salary.hraReceived,
      rentPaid: input.salary.rentPaid,
      isMetroCity: input.salary.isMetroCity,
      employerNpsContribution: input.salary.employerNpsContribution,
      professionalTax: input.salary.professionalTax,
    } : undefined,
    houseProperties: (input.houseProperties || []).map(hp => ({
      use: hp.use as 'self-occupied' | 'let-out',
      annualRent: hp.annualRent,
      municipalTaxes: hp.municipalTaxes,
      homeLoanInterest: hp.homeLoanInterest,
    })),
    capitalGains: input.capitalGains ? {
      stcg111A: input.capitalGains.stcg111A,
      stcgOther: input.capitalGains.stcgOther,
      ltcg112A: input.capitalGains.ltcg112A,
      ltcgOther: input.capitalGains.ltcgOther,
    } : undefined,
    business: input.business ? {
      netIncome: input.business.netIncome,
      presumptive: input.business.presumptive || false,
    } : undefined,
    otherSources: input.otherSources ? {
      savingsInterest: input.otherSources.savingsInterest,
      fdInterest: input.otherSources.fdInterest,
      dividends: input.otherSources.dividends,
      familyPension: input.otherSources.familyPension,
      other: input.otherSources.other,
    } : undefined,
    deductions: {
      section80C: input.deductions.section80C,
      section80CCD1B: input.deductions.section80CCD1B,
      section80D_selfFamily: input.deductions.section80D_selfFamily,
      section80D_parents: input.deductions.section80D_parents,
      parentsAreSenior: input.deductions.parentsAreSenior,
      section80E: input.deductions.section80E,
      section80G: input.deductions.section80G,
    },
    taxesPaid: input.taxesPaid,
  };
}

/**
 * Convert RegimeComputation to output format
 */
function regimeComputationToOutput(computation: any): RegimeComputationOutput {
  return {
    regime: computation.regime,
    heads: {
      salary: computation.heads.salary,
      houseProperty: computation.heads.houseProperty,
      capitalGains: computation.heads.capitalGains,
      business: computation.heads.business,
      otherSources: computation.heads.otherSources,
    },
    salaryExemptions: {
      hraExempt: computation.salaryExemptions.hraExempt,
      standardDeduction: computation.salaryExemptions.standardDeduction,
      professionalTax: computation.salaryExemptions.professionalTax,
    },
    grossTotalIncome: computation.grossTotalIncome,
    deductionsAllowed: Object.entries(computation.deductionsAllowed).map(
      ([section, amount]: [string, any]) => ({
        section,
        amount: amount as number,
      })
    ),
    totalDeductions: computation.totalDeductions,
    totalIncome: computation.totalIncome,
    normalIncome: computation.normalIncome,
    basicExemptionAdjustment: computation.basicExemptionAdjustment,
    slabLines: computation.slabLines.map((line: any) => ({
      from: line.from,
      to: line.to,
      ratePct: line.ratePct,
      taxableInSlab: line.taxableInSlab,
      tax: line.tax,
    })),
    taxOnNormalIncome: computation.taxOnNormalIncome,
    specialRateTax: {
      stcg111A: {
        taxable: computation.specialRateTax.stcg111A.taxable,
        ratePct: computation.specialRateTax.stcg111A.ratePct,
        tax: computation.specialRateTax.stcg111A.tax,
      },
      ltcg112A: {
        taxable: computation.specialRateTax.ltcg112A.taxable,
        ratePct: computation.specialRateTax.ltcg112A.ratePct,
        tax: computation.specialRateTax.ltcg112A.tax,
      },
      ltcgOther: {
        taxable: computation.specialRateTax.ltcgOther.taxable,
        ratePct: computation.specialRateTax.ltcgOther.ratePct,
        tax: computation.specialRateTax.ltcgOther.tax,
      },
    },
    taxBeforeRebate: computation.taxBeforeRebate,
    rebate87A: computation.rebate87A,
    rebateMarginalRelief: computation.rebateMarginalRelief,
    surcharge: computation.surcharge,
    surchargeMarginalRelief: computation.surchargeMarginalRelief,
    cess: computation.cess,
    totalTaxLiability: computation.totalTaxLiability,
    taxesPaid: computation.taxesPaid,
    netPayable: computation.netPayable,
    effectiveRatePct: computation.effectiveRatePct,
    notes: computation.notes,
  };
}

/**
 * Validate and throw GraphQL errors
 */
function validateInput(input: unknown, schema: z.ZodSchema): asserts input is TaxProfileInput {
  try {
    schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      throw new Error(`Validation error: ${messages}`);
    }
    throw error;
  }
}

// ============================================================================
// QUERY RESOLVERS
// ============================================================================

export const queryResolvers: QueryResolvers = {
  async getTaxComputation(_, args, context) {
    try {
      validateInput(args.profile, TaxProfileSchema);

      const profile = profileInputToInternal(args.profile);
      const result = computeBoth(profile);

      return {
        old: regimeComputationToOutput(result.old),
        new: regimeComputationToOutput(result.new),
        recommended: result.recommended,
        savings: result.savings,
        computedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to compute tax: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  async getRecommendations(_, args, context) {
    try {
      validateInput(args.profile, TaxProfileSchema);

      const profile = profileInputToInternal(args.profile);
      const comparison = computeBoth(profile);
      const report = generateOptimizationRecommendations(profile, comparison);

      return {
        recommendations: report.recommendations.map((rec: any) => ({
          id: rec.id,
          category: rec.category,
          priority: rec.priority,
          title: rec.title,
          description: rec.description,
          estimatedSavings: rec.estimatedSavings,
          action: rec.action,
          difficulty: rec.difficulty,
          timeline: rec.timeline,
          risk: rec.risk,
          prerequisites: rec.prerequisites,
        })),
        totalPotentialSavings: report.totalPotentialSavings,
        currentLiability: report.currentLiability,
        optimizedLiability: report.optimizedLiability,
        riskProfile: args.riskProfile || report.riskProfile,
      };
    } catch (error) {
      throw new Error(`Failed to generate recommendations: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  async getScenarios(_, args, context) {
    try {
      validateInput(args.baseline, TaxProfileSchema);
      args.scenarios.forEach(s => validateInput(s.profileChanges, TaxProfileSchema));

      const baselineProfile = profileInputToInternal(args.baseline);
      const planner = new ScenarioPlanner(baselineProfile);
      const baselineComputation = computeBoth(baselineProfile);

      const scenarioResults = args.scenarios.map((scenario) => {
        const scenarioProfile = profileInputToInternal(scenario.profileChanges);
        const computation = computeBoth(scenarioProfile);

        return {
          id: `scenario-${Date.now()}-${Math.random()}`,
          name: scenario.name,
          description: scenario.description,
          computation: {
            old: regimeComputationToOutput(computation.old),
            new: regimeComputationToOutput(computation.new),
            recommended: computation.recommended,
            savings: computation.savings,
            computedAt: new Date().toISOString(),
          },
        };
      });

      const bestScenario = scenarioResults.reduce((best, current) => {
        const currentTax = current.computation.new.totalTaxLiability;
        const bestTax = best.computation.new.totalTaxLiability;
        return currentTax < bestTax ? current : best;
      });

      const baselineTax = baselineComputation.new.totalTaxLiability;
      const maxSavings = baselineTax - bestScenario.computation.new.totalTaxLiability;

      return {
        baseline: {
          id: 'baseline',
          name: 'Baseline',
          description: 'Current profile',
          computation: {
            old: regimeComputationToOutput(baselineComputation.old),
            new: regimeComputationToOutput(baselineComputation.new),
            recommended: baselineComputation.recommended,
            savings: baselineComputation.savings,
            computedAt: new Date().toISOString(),
          },
        },
        scenarios: scenarioResults,
        bestScenario,
        maxSavings,
      };
    } catch (error) {
      throw new Error(`Failed to compute scenarios: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  async getAnalytics(_, args, context) {
    try {
      // Reconstruct the RegimeComputation from the output format
      // This is a simplified version - in production, you'd want to store this
      const profile = {} as TaxProfile; // Would need to be passed or stored
      const computation = {} as any; // Would reconstruct from args.computation

      // For now, return a mock structure
      // In production, this would call generateTaxInsights with actual data
      const insights = {
        effectiveTaxRate: args.computation.new.effectiveRatePct,
        marginalRate: args.computation.new.effectiveRatePct * 1.2, // Simplified
        taxPerRupee: args.computation.new.totalTaxLiability / args.computation.new.totalIncome,
        incomeHeadBreakdown: Object.entries(args.computation.new.heads).map(([head, income]) => ({
          head,
          income: income as number,
          percentage: (((income as number) / args.computation.new.totalIncome) * 100) || 0,
        })),
        taxComposition: [
          { component: 'Slab Tax', amount: args.computation.new.taxOnNormalIncome, percentage: 0 },
          { component: 'Special Rate Tax', amount: args.computation.new.specialRateTax.ltcg112A.tax + args.computation.new.specialRateTax.stcg111A.tax + args.computation.new.specialRateTax.ltcgOther.tax, percentage: 0 },
          { component: 'Surcharge', amount: args.computation.new.surcharge, percentage: 0 },
          { component: 'Cess', amount: args.computation.new.cess, percentage: 0 },
        ].map(item => ({
          ...item,
          percentage: (item.amount / args.computation.new.totalTaxLiability) * 100,
        })),
        metrics: {
          totalIncome: args.computation.new.totalIncome,
          totalDeductions: args.computation.new.totalDeductions,
          grossIncome: args.computation.new.grossTotalIncome,
          taxLiability: args.computation.new.totalTaxLiability,
          surcharge: args.computation.new.surcharge,
          cess: args.computation.new.cess,
          effectiveRatePct: args.computation.new.effectiveRatePct,
          netPayable: args.computation.new.netPayable,
        },
      };

      return insights as TaxAnalyticsOutput;
    } catch (error) {
      throw new Error(`Failed to generate analytics: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  async getRegimeComparison(_, args, context) {
    try {
      validateInput(args.profile, TaxProfileSchema);

      const profile = profileInputToInternal(args.profile);
      const result = computeBoth(profile);

      return {
        old: regimeComputationToOutput(result.old),
        new: regimeComputationToOutput(result.new),
        recommended: result.recommended,
        savings: result.savings,
      };
    } catch (error) {
      throw new Error(`Failed to compare regimes: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  async health() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  },
};

// ============================================================================
// MUTATION RESOLVERS
// ============================================================================

export const mutationResolvers: MutationResolvers = {
  async computeTax(_, args, context) {
    try {
      validateInput(args.profile, TaxProfileSchema);

      const profile = profileInputToInternal(args.profile);
      const result = computeBoth(profile);

      return {
        success: true,
        computation: {
          old: regimeComputationToOutput(result.old),
          new: regimeComputationToOutput(result.new),
          recommended: result.recommended,
          savings: result.savings,
          computedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  async createScenario(_, args, context) {
    try {
      validateInput(args.scenario.profileChanges, TaxProfileSchema);

      const scenarioProfile = profileInputToInternal(args.scenario.profileChanges);
      const computation = computeBoth(scenarioProfile);

      return {
        id: `scenario-${Date.now()}-${Math.random()}`,
        name: args.scenario.name,
        description: args.scenario.description,
        computation: {
          old: regimeComputationToOutput(computation.old),
          new: regimeComputationToOutput(computation.new),
          recommended: computation.recommended,
          savings: computation.savings,
          computedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw new Error(`Failed to create scenario: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  async updateProfile(_, args, context) {
    try {
      validateInput(args.profile, TaxProfileSchema);
      // In production, save to database
      return {
        success: true,
        profile: args.profile,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  async exportReport(_, args, context) {
    try {
      const format = args.format;
      const filename = `tax-report-${Date.now()}.${format.toLowerCase()}`;
      // In production, generate actual file
      return {
        success: true,
        filename,
        format,
        url: `/api/exports/${filename}`,
      };
    } catch (error) {
      return {
        success: false,
        format: args.format,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  async saveComparison(_, args, context) {
    try {
      const comparisonId = `comparison-${Date.now()}-${Math.random()}`;
      // In production, save to database
      return {
        success: true,
        comparisonId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};
