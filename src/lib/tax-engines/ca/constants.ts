/**
 * Canadian Tax Constants (2026)
 */

export const BASIC_PERSONAL_AMOUNT_FEDERAL_2026 = 15705;

export const FEDERAL_TAX_BRACKETS_2026 = [
  [0, 55867, 0.15],
  [55867, 111733, 0.205],
  [111733, 173205, 0.26],
  [173205, 246752, 0.29],
  [246752, Infinity, 0.33],
];

export const PROVINCIAL_TAX_BRACKETS_2026: Record<string, Array<[number, number, number]>> = {
  ON: [
    [0, 51446, 0.0505],
    [51446, 102894, 0.0915],
    [102894, 150000, 0.1116],
    [150000, 220708, 0.1216],
    [220708, Infinity, 0.1316],
  ],
  BC: [
    [0, 45654, 0.0506],
    [45654, 91310, 0.077],
    [91310, 105617, 0.105],
    [105617, 181232, 0.1229],
    [181232, Infinity, 0.147],
  ],
  AB: [
    [0, 148269, 0.10],
    [148269, 177922, 0.12],
    [177922, 237230, 0.13],
    [237230, 355845, 0.14],
    [355845, Infinity, 0.15],
  ],
};

export const CPP_CONTRIBUTION_2026 = {
  maxPensionable: 68500,
  basicExemption: 3500,
  employeeRate: 0.0595,
  employerRate: 0.0595,
  maxContribution: 3867, // (68500 - 3500) * 0.0595
};

export const EI_RATE_2026 = 0.0166; // Varies by province, 1.66% for most

export function getTaxBracketAmount(taxableIncome: number, brackets: Array<[number, number, number]>): number {
  let tax = 0;
  for (const [lower, upper, rate] of brackets) {
    if (taxableIncome <= lower) break;
    const inBracket = Math.min(taxableIncome, upper) - lower;
    tax += inBracket * rate;
  }
  return tax;
}
