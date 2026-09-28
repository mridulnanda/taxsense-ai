/**
 * Australia Tax Constants (2025-26 Financial Year)
 * Source: ATO.gov.au
 */

export const TAX_BRACKETS_2025_26_AU = [
  [0, 18200, 0],
  [18200, 45000, 0.19],
  [45000, 120000, 0.325],
  [120000, 180000, 0.37],
  [180000, Infinity, 0.45],
];

export const MEDICARE_LEVY_RATE = 0.02; // 2% of taxable income

export const MEDICARE_LEVY_THRESHOLD = {
  single: 18200,
  couple: 36400,
  family: 48400,
};

export const CAPITAL_GAINS_DISCOUNT = 0.5; // 50% CGT discount for individuals (long-term)

export const LOW_INCOME_OFFSET_2025_26 = {
  max_offset: 705,
  income_threshold: 66667,
  reduction_rate: 0.01,
};

export const SENIOR_OFFSET_2025_26 = {
  max_offset: 2115,
  threshold: 32279,
};

export const HELP_REPAYMENT_THRESHOLDS = {
  threshold: 49738,
  repayment_rate: 0.06,
};

export function getTaxFromBrackets(income: number, brackets: Array<[number, number, number]>): number {
  let tax = 0;
  for (const [lower, upper, rate] of brackets) {
    if (income <= lower) break;
    const inBracket = Math.min(income, upper) - lower;
    tax += inBracket * rate;
  }
  return tax;
}
