/**
 * Shared Tax Engine Utilities
 * Reusable components for all 50-country tax engine implementations
 */

export {
  calculateProgressiveTax,
  parseBrackets,
  findApplicableBracket,
  getMarginalRate,
  incomeAtMarginalRate,
  computeIncrementalTax,
  type TaxBracket,
  type BracketBreakdown,
  type ProgressiveTaxResult,
} from "./tax-bracket-calculator";

export {
  applyAbsoluteCap,
  applyPercentageOfAGILimit,
  applyAGIPhaseout,
  applyThresholdDeduction,
  applyMultipleLimitations,
  applyPercentageLimit,
  type DeductionLimit,
  type DeductionResult,
} from "./deduction-limiter";

export {
  aggregateCapitalGains,
  calculatePreferentialCapitalGainsTax,
  calculateCapitalGainsTaxWithBrackets,
  segregateCapitalGainsByTaxTreatment,
  applyCapitalLossCarryover,
  determineHoldingPeriod,
  type HoldingPeriod,
  type CapitalAssetType,
  type CapitalGainTransaction,
  type CapitalGainLoss,
  type CapitalGainsSummary,
} from "./capital-gains-calculator";
