/**
 * US Federal & State Tax Constants (2026)
 * Sources: IRS.gov, state tax authority websites
 */

import type { FilingStatus, USState } from "./types";

// ============ Federal Income Tax Brackets (2026) ============

export const FEDERAL_TAX_BRACKETS_2026: Record<FilingStatus, Array<[number, number, number]>> = {
  single: [
    [0, 11600, 0.10],
    [11600, 47150, 0.12],
    [47150, 100525, 0.22],
    [100525, 191950, 0.24],
    [191950, 243725, 0.32],
    [243725, 609350, 0.35],
    [609350, Infinity, 0.37],
  ],
  married_filing_jointly: [
    [0, 23200, 0.10],
    [23200, 94300, 0.12],
    [94300, 201050, 0.22],
    [201050, 383900, 0.24],
    [383900, 487450, 0.32],
    [487450, 731200, 0.35],
    [731200, Infinity, 0.37],
  ],
  married_filing_separately: [
    [0, 11600, 0.10],
    [11600, 47150, 0.12],
    [47150, 100525, 0.22],
    [100525, 191950, 0.24],
    [191950, 243725, 0.32],
    [243725, 365600, 0.35],
    [365600, Infinity, 0.37],
  ],
  head_of_household: [
    [0, 17450, 0.10],
    [17450, 66550, 0.12],
    [66550, 110700, 0.22],
    [110700, 209750, 0.24],
    [209750, 243050, 0.32],
    [243050, 609350, 0.35],
    [609350, Infinity, 0.37],
  ],
  qualifying_widow: [
    [0, 23200, 0.10],
    [23200, 94300, 0.12],
    [94300, 201050, 0.22],
    [201050, 383900, 0.24],
    [383900, 487450, 0.32],
    [487450, 731200, 0.35],
    [731200, Infinity, 0.37],
  ],
};

// ============ Standard Deduction (2026) ============

export const STANDARD_DEDUCTION_2026: Record<FilingStatus, number> = {
  single: 14600,
  married_filing_jointly: 29200,
  married_filing_separately: 14600,
  head_of_household: 21900,
  qualifying_widow: 29200,
};

// Additional standard deduction for seniors (65+) and blind
export const ADDITIONAL_STANDARD_DEDUCTION_2026 = {
  single_or_hoh: 1850,
  married: 1500,
};

// ============ Capital Gains Tax Rates ============

export const LONG_TERM_CAPITAL_GAINS_RATES_2026: Record<FilingStatus, Array<[number, number, number]>> = {
  single: [
    [0, 47025, 0.00],      // 0% bracket
    [47025, 518900, 0.15], // 15% bracket
    [518900, Infinity, 0.20], // 20% bracket
  ],
  married_filing_jointly: [
    [0, 94050, 0.00],
    [94050, 583750, 0.15],
    [583750, Infinity, 0.20],
  ],
  married_filing_separately: [
    [0, 47025, 0.00],
    [47025, 291875, 0.15],
    [291875, Infinity, 0.20],
  ],
  head_of_household: [
    [0, 62850, 0.00],
    [62850, 551350, 0.15],
    [551350, Infinity, 0.20],
  ],
  qualifying_widow: [
    [0, 94050, 0.00],
    [94050, 583750, 0.15],
    [583750, Infinity, 0.20],
  ],
};

// Short-term capital gains taxed at ordinary rates
export const SHORT_TERM_CAPITAL_GAINS_RATE = "ordinary"; // Uses regular income tax brackets

// ============ FICA Taxes ============

export const FICA_RATES_2026 = {
  socialSecurityWageBase: 168600, // 2026 cap
  socialSecurityRate: 0.062, // 6.2% employee portion
  medicareRate: 0.0145, // 1.45% employee portion
  additionalMedicareThreshold: {
    single: 200000,
    married_filing_jointly: 250000,
    married_filing_separately: 125000,
    head_of_household: 200000,
    qualifying_widow: 250000,
  },
  additionalMedicareRate: 0.009, // 0.9% on wages above threshold
};

// Self-employment tax
export const SELF_EMPLOYMENT_TAX_2026 = {
  rate: 0.153, // 15.3% = 12.4% SS + 2.9% Medicare
  socialSecurityRate: 0.124,
  medicareRate: 0.029,
  ssWageBase: 168600,
  seDeductionPercentage: 0.5, // Can deduct 50% of SE tax
};

// ============ Alternative Minimum Tax (AMT) ============

export const AMT_EXEMPTION_2026: Record<FilingStatus, number> = {
  single: 75000,
  married_filing_jointly: 116500,
  married_filing_separately: 58250,
  head_of_household: 75000,
  qualifying_widow: 116500,
};

export const AMT_RATE_2026 = 0.26; // 26% up to exemption threshold, then 28%
export const AMT_THRESHOLD_2026: Record<FilingStatus, number> = {
  single: 206100,
  married_filing_jointly: 412500,
  married_filing_separately: 206250,
  head_of_household: 206100,
  qualifying_widow: 412500,
};

// ============ Tax Credits ============

export const CHILD_TAX_CREDIT_2026 = {
  amountPerChild: 2000,
  refundablePercentage: 0.15, // 15% of wages over $2500
  maxACTC: 1700, // Max refundable ACTC
};

export const CHILD_DEPENDENT_CARE_CREDIT_2026 = {
  maxExpenses: 3000, // Per child
  maxCredits: [0.35, 0.34, 0.33, 0.32, 0.31, 0.20], // By AGI ranges
  ageThreshold: 13,
};

// ============ Deduction Limits ============

export const SALT_CAP_2026 = 10000; // State and local taxes cap
export const MORTGAGE_INTEREST_CAP_2026 = 750000; // Loan principal cap
export const QUALIFIED_EDUCATION_EXPENSES_2026 = 4000; // Max for American Opportunity Credit

// ============ Earned Income Tax Credit (EITC) 2026 ============

export const EITC_2026: Record<FilingStatus, any> = {
  single: {
    maxCredit: 3733,
    incomeLimit: 43,  // per child filing limit
    childless_maxCredit: 600,
    childless_incomeLimit: 17340,
  },
  married_filing_jointly: {
    maxCredit: 3733,
    incomeLimit: 48, // per child
    childless_maxCredit: 600,
    childless_incomeLimit: 22655,
  },
  head_of_household: {
    maxCredit: 3733,
    incomeLimit: 45, // per child
    childless_maxCredit: 600,
    childless_incomeLimit: 20330,
  },
  married_filing_separately: {
    maxCredit: 0, // Not eligible
  },
  qualifying_widow: {
    maxCredit: 3733,
    incomeLimit: 48,
    childless_maxCredit: 600,
    childless_incomeLimit: 22655,
  },
};

// ============ Depreciation (MACRS) ============

export const MACRS_RECOVERY_PERIODS_2026 = {
  propertyType: {
    "computer_equipment": 5,
    "office_furniture": 7,
    "vehicles": 5,
    "manufacturing_equipment": 7,
    "nonresidential_building": 39,
    "residential_rental": 27.5,
  },
  halfYear: 0.5, // Convention: property assumed in service mid-year
};

export const SECTION_179_LIMIT_2026 = 1160000; // Max immediate expensing
export const BONUS_DEPRECIATION_2026 = 1.0; // 100% bonus depreciation available through 2026

// ============ Quarterly Estimated Tax Thresholds ============

export const ESTIMATED_TAX_THRESHOLD_2026 = 1000; // Must make EST if tax liability exceeds this

// ============ State Tax Rates (Sample - All 50 states would be needed for production) ============

export const STATE_TAX_BRACKETS_2026: Record<USState | "default", any> = {
  CA: {
    brackets: [
      [0, 10099, 0.01],
      [10099, 23942, 0.02],
      [23942, 37788, 0.04],
      [37788, 52455, 0.06],
      [52455, 66295, 0.08],
      [66295, 340328, 0.093],
      [340328, 408326, 0.103],
      [408326, 680656, 0.113],
      [680656, Infinity, 0.123],
    ],
    standardDeduction: 5202,
  },
  TX: {
    noIncomeTax: true,
    standardDeduction: 0,
  },
  FL: {
    noIncomeTax: true,
    standardDeduction: 0,
  },
  NY: {
    brackets: [
      [0, 8500, 0.04],
      [8500, 11700, 0.045],
      [11700, 13900, 0.0475],
      [13900, 21400, 0.0525],
      [21400, 80650, 0.055],
      [80650, 215400, 0.06],
      [215400, 1077550, 0.0685],
      [1077550, Infinity, 0.0965],
    ],
    standardDeduction: 3200,
  },
  default: {
    brackets: [], // Placeholder
    standardDeduction: 0,
  },
};

export const STATE_NO_INCOME_TAX: USState[] = [
  "AK", "FL", "NV", "SD", "TN", "TX", "WA", "WY", "NH" // NH taxes dividends/interest only
];

// ============ Utility Functions ============

export function roundDollar(n: number): number {
  return Math.round(n);
}

export function getTaxBracketAmount(
  taxableIncome: number,
  brackets: Array<[number, number, number]>
): number {
  let tax = 0;
  for (const [lower, upper, rate] of brackets) {
    if (taxableIncome <= lower) break;
    const taxableInThisBracket = Math.min(taxableIncome, upper) - lower;
    tax += taxableInThisBracket * rate;
  }
  return tax;
}
