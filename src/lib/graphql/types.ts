/**
 * GraphQL Type Definitions for TaxSense AI
 * Provides full TypeScript type safety for GraphQL operations
 */

import type {
  TaxProfile,
  RegimeComputation,
  ComparisonResult,
  Regime,
  ResidentialStatus,
} from '../tax-engine';
import type { TaxRecommendation, OptimizationReport } from '../optimizer/recommendations';
import type { Scenario, ScenarioComparison } from '../optimizer/scenarios';
import type { TaxInsights, TaxMetrics } from '../reporting/analytics';

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface SalaryIncomeInput {
  grossSalary: number;
  basicPlusDA: number;
  hraReceived: number;
  rentPaid: number;
  isMetroCity: boolean;
  employerNpsContribution: number;
  professionalTax: number;
}

export interface HousePropertyInput {
  use: 'self-occupied' | 'let-out';
  annualRent: number;
  municipalTaxes: number;
  homeLoanInterest: number;
}

export interface CapitalGainsInput {
  stcg111A: number;
  stcgOther: number;
  ltcg112A: number;
  ltcgOther: number;
}

export interface BusinessIncomeInput {
  netIncome: number;
  presumptive?: boolean;
}

export interface OtherSourcesInput {
  savingsInterest: number;
  fdInterest: number;
  dividends: number;
  familyPension: number;
  other: number;
}

export interface DeductionInputsInput {
  section80C: number;
  section80CCD1B: number;
  section80D_selfFamily: number;
  section80D_parents: number;
  parentsAreSenior: boolean;
  section80E: number;
  section80G: number;
}

export interface TaxProfileInput {
  name?: string;
  age: number;
  residentialStatus: ResidentialStatus;
  salary?: SalaryIncomeInput;
  houseProperties: HousePropertyInput[];
  capitalGains?: CapitalGainsInput;
  business?: BusinessIncomeInput;
  otherSources?: OtherSourcesInput;
  deductions: DeductionInputsInput;
  taxesPaid: number;
}

export interface ScenarioInput {
  name: string;
  description: string;
  profileChanges: TaxProfileInput;
}

// ============================================================================
// OUTPUT TYPES
// ============================================================================

export interface HeadwiseIncomeOutput {
  salary: number;
  houseProperty: number;
  capitalGains: number;
  business: number;
  otherSources: number;
}

export interface SalaryExemptionsOutput {
  hraExempt: number;
  standardDeduction: number;
  professionalTax: number;
}

export interface DeductionDetailOutput {
  section: string;
  amount: number;
}

export interface SlabLineOutput {
  from: number;
  to: number | null;
  ratePct: number;
  taxableInSlab: number;
  tax: number;
}

export interface SpecialRateTaxItemOutput {
  taxable: number;
  ratePct: number;
  tax: number;
}

export interface SpecialRateTaxOutput {
  stcg111A: SpecialRateTaxItemOutput;
  ltcg112A: SpecialRateTaxItemOutput;
  ltcgOther: SpecialRateTaxItemOutput;
}

export interface RegimeComputationOutput {
  regime: Regime;
  heads: HeadwiseIncomeOutput;
  salaryExemptions: SalaryExemptionsOutput;
  grossTotalIncome: number;
  deductionsAllowed: DeductionDetailOutput[];
  totalDeductions: number;
  totalIncome: number;
  normalIncome: number;
  basicExemptionAdjustment: number;
  slabLines: SlabLineOutput[];
  taxOnNormalIncome: number;
  specialRateTax: SpecialRateTaxOutput;
  taxBeforeRebate: number;
  rebate87A: number;
  rebateMarginalRelief: number;
  surcharge: number;
  surchargeMarginalRelief: number;
  cess: number;
  totalTaxLiability: number;
  taxesPaid: number;
  netPayable: number;
  effectiveRatePct: number;
  notes: string[];
}

export interface TaxComputationResultOutput {
  old: RegimeComputationOutput;
  new: RegimeComputationOutput;
  recommended: Regime;
  savings: number;
  computedAt: string;
}

export interface TaxRecommendationOutput {
  id: string;
  category: 'deduction' | 'investment' | 'planning' | 'structure' | 'regime';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimatedSavings: number;
  action: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeline: 'immediate' | 'before-mar-31' | 'next-fy';
  risk: 'none' | 'low' | 'medium' | 'high';
  prerequisites?: string[];
}

export interface OptimizationReportOutput {
  recommendations: TaxRecommendationOutput[];
  totalPotentialSavings: number;
  currentLiability: number;
  optimizedLiability: number;
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
}

export interface ScenarioResultOutput {
  id: string;
  name: string;
  description: string;
  computation: TaxComputationResultOutput;
}

export interface ScenarioComparisonResultOutput {
  baseline: ScenarioResultOutput;
  scenarios: ScenarioResultOutput[];
  bestScenario: ScenarioResultOutput;
  maxSavings: number;
}

export interface IncomeHeadBreakdownItemOutput {
  head: string;
  income: number;
  percentage: number;
}

export interface TaxCompositionItemOutput {
  component: string;
  amount: number;
  percentage: number;
}

export interface TaxAnalyticsOutput {
  effectiveTaxRate: number;
  marginalRate: number;
  taxPerRupee: number;
  incomeHeadBreakdown: IncomeHeadBreakdownItemOutput[];
  taxComposition: TaxCompositionItemOutput[];
  metrics: TaxMetrics;
}

export interface RegimeComparisonOutput {
  old: RegimeComputationOutput;
  new: RegimeComputationOutput;
  recommended: Regime;
  savings: number;
}

export interface ComputeTaxResultOutput {
  success: boolean;
  computation?: TaxComputationResultOutput;
  error?: string;
}

export interface ProfileUpdateResultOutput {
  success: boolean;
  profile?: TaxProfileInput;
  error?: string;
}

export interface ExportResultOutput {
  success: boolean;
  url?: string;
  filename?: string;
  format: 'PDF' | 'JSON' | 'CSV';
  error?: string;
}

export interface ComparisonSaveResultOutput {
  success: boolean;
  comparisonId?: string;
  error?: string;
}

export interface HealthStatusOutput {
  status: string;
  timestamp: string;
  version: string;
}

export interface ComputationProgressUpdateOutput {
  computationId: string;
  stage: string;
  progress: number;
  message: string;
  completed: boolean;
}

// ============================================================================
// RESOLVER CONTEXT
// ============================================================================

export interface GraphQLContext {
  userId?: string;
  isAuthenticated: boolean;
  requestId: string;
}

// ============================================================================
// RESOLVER TYPES
// ============================================================================

export type QueryResolvers = {
  getTaxComputation: (
    _: unknown,
    args: { profile: TaxProfileInput },
    context: GraphQLContext,
  ) => Promise<TaxComputationResultOutput>;

  getRecommendations: (
    _: unknown,
    args: { profile: TaxProfileInput; riskProfile?: 'conservative' | 'moderate' | 'aggressive' },
    context: GraphQLContext,
  ) => Promise<OptimizationReportOutput>;

  getScenarios: (
    _: unknown,
    args: { baseline: TaxProfileInput; scenarios: ScenarioInput[] },
    context: GraphQLContext,
  ) => Promise<ScenarioComparisonResultOutput>;

  getAnalytics: (
    _: unknown,
    args: { computation: TaxComputationResultOutput },
    context: GraphQLContext,
  ) => Promise<TaxAnalyticsOutput>;

  getRegimeComparison: (
    _: unknown,
    args: { profile: TaxProfileInput },
    context: GraphQLContext,
  ) => Promise<RegimeComparisonOutput>;

  health: (
    _: unknown,
    __: unknown,
    context: GraphQLContext,
  ) => Promise<HealthStatusOutput>;
};

export type MutationResolvers = {
  computeTax: (
    _: unknown,
    args: { profile: TaxProfileInput },
    context: GraphQLContext,
  ) => Promise<ComputeTaxResultOutput>;

  createScenario: (
    _: unknown,
    args: { baseline: TaxProfileInput; scenario: ScenarioInput },
    context: GraphQLContext,
  ) => Promise<ScenarioResultOutput>;

  updateProfile: (
    _: unknown,
    args: { userId: string; profile: TaxProfileInput },
    context: GraphQLContext,
  ) => Promise<ProfileUpdateResultOutput>;

  exportReport: (
    _: unknown,
    args: { computation: TaxComputationResultOutput; format: 'PDF' | 'JSON' | 'CSV' },
    context: GraphQLContext,
  ) => Promise<ExportResultOutput>;

  saveComparison: (
    _: unknown,
    args: {
      baseline: TaxProfileInput;
      scenarios: ScenarioInput[];
      name: string;
    },
    context: GraphQLContext,
  ) => Promise<ComparisonSaveResultOutput>;
};
