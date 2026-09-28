/**
 * Tax Bracket Calculator — Unified for all countries
 * Handles progressive tax bracket computation
 *
 * Usage:
 *   const tax = calculateProgressiveTax(50000, brackets)
 *   // Returns: { tax: 8500, effectiveRate: 0.17, breakdown: [...] }
 */

export interface TaxBracket {
  min: number;
  max: number;
  rate: number;
}

export interface BracketBreakdown {
  bracket: TaxBracket;
  incomeInBracket: number;
  taxInBracket: number;
}

export interface ProgressiveTaxResult {
  taxableIncome: number;
  tax: number;
  effectiveRate: number;
  marginalRate: number;
  breakdown: BracketBreakdown[];
}

/**
 * Calculate progressive tax liability across brackets
 * @param taxableIncome - Total taxable income
 * @param brackets - Array of tax brackets [min, max, rate] (must be sorted)
 * @returns Tax calculation with breakdown
 */
export function calculateProgressiveTax(
  taxableIncome: number,
  brackets: TaxBracket[]
): ProgressiveTaxResult {
  if (taxableIncome <= 0) {
    return {
      taxableIncome,
      tax: 0,
      effectiveRate: 0,
      marginalRate: brackets[0]?.rate || 0,
      breakdown: [],
    };
  }

  const breakdown: BracketBreakdown[] = [];
  let totalTax = 0;
  let marginalRate = 0;

  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) {
      break;
    }

    const incomeInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
    const taxInBracket = incomeInBracket * bracket.rate;

    breakdown.push({
      bracket,
      incomeInBracket,
      taxInBracket,
    });

    totalTax += taxInBracket;
    marginalRate = bracket.rate;
  }

  return {
    taxableIncome,
    tax: Math.round(totalTax * 100) / 100,
    effectiveRate: taxableIncome > 0 ? totalTax / taxableIncome : 0,
    marginalRate,
    breakdown,
  };
}

/**
 * Simplified bracket array (min, max, rate) to TaxBracket objects
 * @param brackets - Array of [min, max, rate] tuples
 * @returns Array of TaxBracket objects
 */
export function parseBrackets(brackets: Array<[number, number, number]>): TaxBracket[] {
  return brackets.map(([min, max, rate]) => ({
    min,
    max,
    rate,
  }));
}

/**
 * Find which bracket a given income falls into
 * @param taxableIncome - Income amount
 * @param brackets - Sorted bracket array
 * @returns Bracket that income falls into, or null if none match
 */
export function findApplicableBracket(
  taxableIncome: number,
  brackets: TaxBracket[]
): TaxBracket | null {
  return brackets.find((b) => taxableIncome >= b.min && taxableIncome < b.max) || null;
}

/**
 * Get marginal tax rate for an income level
 * @param taxableIncome - Income amount
 * @param brackets - Sorted bracket array
 * @returns Marginal tax rate (0-1)
 */
export function getMarginalRate(taxableIncome: number, brackets: TaxBracket[]): number {
  const bracket = findApplicableBracket(taxableIncome, brackets);
  return bracket?.rate || (brackets.length > 0 ? brackets[brackets.length - 1].rate : 0);
}

/**
 * Calculate income threshold to reach a specific marginal rate
 * Useful for tax planning scenarios
 * @param targetRate - Target marginal rate to find
 * @param brackets - Sorted bracket array
 * @returns Income needed to reach that marginal rate, or -1 if not found
 */
export function incomeAtMarginalRate(targetRate: number, brackets: TaxBracket[]): number {
  const bracket = brackets.find((b) => b.rate === targetRate);
  return bracket ? bracket.min : -1;
}

/**
 * Compute impact of incremental income
 * Useful for marginal tax rate calculations in planning
 * @param currentIncome - Current taxable income
 * @param additionalIncome - Additional income amount
 * @param brackets - Sorted bracket array
 * @returns { oldTax, newTax, taxOnAdditional, marginalRate }
 */
export function computeIncrementalTax(
  currentIncome: number,
  additionalIncome: number,
  brackets: TaxBracket[]
): {
  oldTax: number;
  newTax: number;
  taxOnAdditional: number;
  marginalRate: number;
} {
  const oldResult = calculateProgressiveTax(currentIncome, brackets);
  const newResult = calculateProgressiveTax(currentIncome + additionalIncome, brackets);
  const marginalRate = getMarginalRate(currentIncome + additionalIncome, brackets);

  return {
    oldTax: oldResult.tax,
    newTax: newResult.tax,
    taxOnAdditional: newResult.tax - oldResult.tax,
    marginalRate,
  };
}
