/**
 * Singapore Tax Constants (2026 - year ending June 30)
 * Source: IRAS website
 */

export const TAX_BRACKETS_2026_SG = [
  [0, 20000, 0],
  [20000, 30000, 0.02],
  [30000, 40000, 0.035],
  [40000, 80000, 0.07],
  [80000, 120000, 0.115],
  [120000, 160000, 0.15],
  [160000, 200000, 0.18],
  [200000, 240000, 0.19],
  [240000, 280000, 0.195],
  [280000, 320000, 0.20],
  [320000, Infinity, 0.225],
];

export const CPF_RATES_2026 = {
  employee_rate: 0.20,
  employer_rate: 0.17,
  max_monthly_wage: 6000,
  max_yearly_contribution: 0.17 * 6000 * 12,
};

export const RELIEFS_2026_SG = {
  earned_income_relief: 1000,
  spouse_relief: 2000,
  child_relief: 4000,
  elderly_parent_relief: 9000,
  disabled_child_relief: 5500,
  disabled_relative_relief: 5500,
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
