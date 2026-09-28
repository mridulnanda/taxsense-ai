/**
 * TaxSense AI GraphQL Schema
 * Complete API surface for tax computation, analysis, and optimization
 * Supports queries, mutations, and subscriptions
 */

import { buildSchema } from 'graphql';

export const typeDefs = `
  """
  Root query type for tax computations and data retrieval
  """
  type Query {
    """Get tax computation for a given profile (both regimes)"""
    getTaxComputation(profile: TaxProfileInput!): TaxComputationResult!

    """Get AI-powered tax optimization recommendations"""
    getRecommendations(profile: TaxProfileInput!, riskProfile: RiskProfile): OptimizationReport!

    """Get scenario comparison results"""
    getScenarios(
      baseline: TaxProfileInput!
      scenarios: [ScenarioInput!]!
    ): ScenarioComparisonResult!

    """Get comprehensive tax analytics and insights"""
    getAnalytics(computation: TaxComputationResult!): TaxAnalytics!

    """Get tax regime comparison"""
    getRegimeComparison(profile: TaxProfileInput!): RegimeComparison!

    """Health check and API metadata"""
    health: HealthStatus!
  }

  """
  Root mutation type for profile management and report generation
  """
  type Mutation {
    """Compute tax for a profile and save result"""
    computeTax(profile: TaxProfileInput!): ComputeTaxResult!

    """Create and save a new tax scenario"""
    createScenario(
      baseline: TaxProfileInput!
      scenario: ScenarioInput!
    ): ScenarioResult!

    """Update user profile"""
    updateProfile(
      userId: String!
      profile: TaxProfileInput!
    ): ProfileUpdateResult!

    """Export tax report in multiple formats"""
    exportReport(
      computation: TaxComputationResult!
      format: ExportFormat!
    ): ExportResult!

    """Save scenario comparison for later reference"""
    saveComparison(
      baseline: TaxProfileInput!
      scenarios: [ScenarioInput!]!
      name: String!
    ): ComparisonSaveResult!
  }

  """
  Subscription type for real-time updates
  """
  type Subscription {
    """Subscribe to computation updates (mock for now)"""
    computationProgress(computationId: String!): ComputationProgressUpdate!
  }

  # ============================================================================
  # INPUT TYPES
  # ============================================================================

  """Salary income details"""
  input SalaryIncomeInput {
    grossSalary: Float!
    basicPlusDA: Float!
    hraReceived: Float!
    rentPaid: Float!
    isMetroCity: Boolean!
    employerNpsContribution: Float!
    professionalTax: Float!
  }

  """House property details"""
  input HousePropertyInput {
    use: HousePropertyUse!
    annualRent: Float!
    municipalTaxes: Float!
    homeLoanInterest: Float!
  }

  """Capital gains details"""
  input CapitalGainsInput {
    stcg111A: Float!
    stcgOther: Float!
    ltcg112A: Float!
    ltcgOther: Float!
  }

  """Business income details"""
  input BusinessIncomeInput {
    netIncome: Float!
    presumptive: Boolean
  }

  """Other sources income details"""
  input OtherSourcesInput {
    savingsInterest: Float!
    fdInterest: Float!
    dividends: Float!
    familyPension: Float!
    other: Float!
  }

  """Chapter VI-A deductions"""
  input DeductionInputsInput {
    section80C: Float!
    section80CCD1B: Float!
    section80D_selfFamily: Float!
    section80D_parents: Float!
    parentsAreSenior: Boolean!
    section80E: Float!
    section80G: Float!
  }

  """Complete tax profile input"""
  input TaxProfileInput {
    name: String
    age: Int!
    residentialStatus: ResidentialStatus!
    salary: SalaryIncomeInput
    houseProperties: [HousePropertyInput!]
    capitalGains: CapitalGainsInput
    business: BusinessIncomeInput
    otherSources: OtherSourcesInput
    deductions: DeductionInputsInput!
    taxesPaid: Float!
  }

  """Scenario input for what-if analysis"""
  input ScenarioInput {
    name: String!
    description: String!
    profileChanges: TaxProfileInput!
  }

  # ============================================================================
  # OUTPUT TYPES
  # ============================================================================

  """Tax computation result for a single regime"""
  type RegimeComputation {
    regime: Regime!
    heads: HeadwiseIncome!
    salaryExemptions: SalaryExemptions!
    grossTotalIncome: Float!
    deductionsAllowed: [DeductionDetail!]!
    totalDeductions: Float!
    totalIncome: Float!
    normalIncome: Float!
    basicExemptionAdjustment: Float!
    slabLines: [SlabLine!]!
    taxOnNormalIncome: Float!
    specialRateTax: SpecialRateTax!
    taxBeforeRebate: Float!
    rebate87A: Float!
    rebateMarginalRelief: Float!
    surcharge: Float!
    surchargeMarginalRelief: Float!
    cess: Float!
    totalTaxLiability: Float!
    taxesPaid: Float!
    netPayable: Float!
    effectiveRatePct: Float!
    notes: [String!]!
  }

  """Headwise income breakdown"""
  type HeadwiseIncome {
    salary: Float!
    houseProperty: Float!
    capitalGains: Float!
    business: Float!
    otherSources: Float!
  }

  """Salary exemptions detail"""
  type SalaryExemptions {
    hraExempt: Float!
    standardDeduction: Float!
    professionalTax: Float!
  }

  """Deduction detail"""
  type DeductionDetail {
    section: String!
    amount: Float!
  }

  """Slab tax line item"""
  type SlabLine {
    from: Float!
    to: Float
    ratePct: Float!
    taxableInSlab: Float!
    tax: Float!
  }

  """Special rate tax breakdown"""
  type SpecialRateTax {
    stcg111A: SpecialRateTaxItem!
    ltcg112A: SpecialRateTaxItem!
    ltcgOther: SpecialRateTaxItem!
  }

  """Special rate tax item"""
  type SpecialRateTaxItem {
    taxable: Float!
    ratePct: Float!
    tax: Float!
  }

  """Complete tax computation result (both regimes)"""
  type TaxComputationResult {
    old: RegimeComputation!
    new: RegimeComputation!
    recommended: Regime!
    savings: Float!
    computedAt: String!
  }

  """Tax recommendation"""
  type TaxRecommendation {
    id: String!
    category: RecommendationCategory!
    priority: Priority!
    title: String!
    description: String!
    estimatedSavings: Float!
    action: String!
    difficulty: Difficulty!
    timeline: Timeline!
    risk: RiskLevel!
    prerequisites: [String!]
  }

  """Optimization report"""
  type OptimizationReport {
    recommendations: [TaxRecommendation!]!
    totalPotentialSavings: Float!
    currentLiability: Float!
    optimizedLiability: Float!
    riskProfile: RiskProfile!
  }

  """Scenario result"""
  type ScenarioResult {
    id: String!
    name: String!
    description: String!
    computation: TaxComputationResult!
  }

  """Scenario comparison result"""
  type ScenarioComparisonResult {
    baseline: ScenarioResult!
    scenarios: [ScenarioResult!]!
    bestScenario: ScenarioResult!
    maxSavings: Float!
  }

  """Tax analytics"""
  type TaxAnalytics {
    effectiveTaxRate: Float!
    marginalRate: Float!
    taxPerRupee: Float!
    incomeHeadBreakdown: [IncomeHeadBreakdownItem!]!
    taxComposition: [TaxCompositionItem!]!
    metrics: TaxMetrics!
  }

  """Income head breakdown item"""
  type IncomeHeadBreakdownItem {
    head: String!
    income: Float!
    percentage: Float!
  }

  """Tax composition item"""
  type TaxCompositionItem {
    component: String!
    amount: Float!
    percentage: Float!
  }

  """Tax metrics"""
  type TaxMetrics {
    totalIncome: Float!
    totalDeductions: Float!
    grossIncome: Float!
    taxLiability: Float!
    surcharge: Float!
    cess: Float!
    effectiveRatePct: Float!
    netPayable: Float!
  }

  """Regime comparison"""
  type RegimeComparison {
    old: RegimeComputation!
    new: RegimeComputation!
    recommended: Regime!
    savings: Float!
  }

  """Mutation result types"""
  type ComputeTaxResult {
    success: Boolean!
    computation: TaxComputationResult
    error: String
  }

  type ProfileUpdateResult {
    success: Boolean!
    profile: TaxProfileInput
    error: String
  }

  type ExportResult {
    success: Boolean!
    url: String
    filename: String
    format: ExportFormat!
    error: String
  }

  type ComparisonSaveResult {
    success: Boolean!
    comparisonId: String
    error: String
  }

  """Health check response"""
  type HealthStatus {
    status: String!
    timestamp: String!
    version: String!
  }

  """Computation progress update"""
  type ComputationProgressUpdate {
    computationId: String!
    stage: String!
    progress: Float!
    message: String!
    completed: Boolean!
  }

  # ============================================================================
  # ENUMS
  # ============================================================================

  enum Regime {
    old
    new
  }

  enum ResidentialStatus {
    resident
    nri
  }

  enum HousePropertyUse {
    self_occupied
    let_out
  }

  enum RecommendationCategory {
    deduction
    investment
    planning
    structure
    regime
  }

  enum Priority {
    critical
    high
    medium
    low
  }

  enum Difficulty {
    easy
    medium
    hard
  }

  enum Timeline {
    immediate
    before_mar_31
    next_fy
  }

  enum RiskLevel {
    none
    low
    medium
    high
  }

  enum RiskProfile {
    conservative
    moderate
    aggressive
  }

  enum ExportFormat {
    PDF
    JSON
    CSV
  }
`;

// Export the schema as a GraphQL schema object
export const graphqlSchema = buildSchema(typeDefs);
