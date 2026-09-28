/**
 * UK Tax Constants (2026-27 Tax Year)
 * Source: HMRC, Welsh Revenue Authority, Scottish Government
 */

// ============ Personal Income Tax Rates & Allowances (2026-27) ============

export const PERSONAL_ALLOWANCE_2026_27 = 12570;

export const INCOME_TAX_BANDS_ENGLAND_WALES_NI_2026_27 = {
  personal_allowance: { lower: 0, upper: 12570, rate: 0 },
  basic_rate: { lower: 12570, upper: 50270, rate: 0.20 },
  higher_rate: { lower: 50270, upper: 125140, rate: 0.40 },
  additional_rate: { lower: 125140, upper: Infinity, rate: 0.45 },
};

export const INCOME_TAX_BANDS_SCOTLAND_2026_27 = {
  personal_allowance: { lower: 0, upper: 12570, rate: 0 },
  starter_rate: { lower: 12570, upper: 14732, rate: 0.19 },
  basic_rate: { lower: 14732, upper: 25688, rate: 0.20 },
  intermediate_rate: { lower: 25688, upper: 43662, rate: 0.21 },
  higher_rate: { lower: 43662, upper: 125140, rate: 0.41 },
  top_rate: { lower: 125140, upper: Infinity, rate: 0.46 },
};

// ============ National Insurance Thresholds (2026-27) ============

export const NI_THRESHOLDS_2026_27 = {
  class1_employee: {
    lower: 12570, // Employee NI starts
    upper: Infinity,
  },
  class1_employee_rate: 0.08, // 8% on £12,570 to £50,270
  class1_employee_rate_higher: 0.02, // 2% on earnings above £50,270
  class1_employer: {
    lower: 9100, // Employer NI starts (secondary threshold)
    upper: Infinity,
  },
  class1_employer_rate: 0.15, // 15% on earnings above £9,100
};

export const NI_CLASS_2_2026_27 = {
  weekly_rate: 3.45, // £3.45 per week for self-employed
  annual_rate: 179.4, // 52 weeks × £3.45
  profit_threshold: 6725, // Small profits threshold
};

export const NI_CLASS_4_2026_27 = {
  lower_profit: 12570,
  upper_profit: 50270,
  rate_lower: 0.09, // 9% on profits between £12,570-£50,270
  rate_upper: 0.02, // 2% on profits above £50,270
};

// ============ Capital Gains Tax (2026-27) ============

export const ANNUAL_EXEMPT_AMOUNT_CGT_2026_27 = {
  standard: 3000, // For basic and higher rate taxpayers
  higher_rate: 1500, // For additional rate taxpayers (from April 2024)
};

export const CGT_RATES_2026_27 = {
  basic_rate_residential: 0.08, // 8% on residential property gains
  basic_rate_non_residential: 0.10, // 10% on other gains
  higher_rate_residential: 0.20, // 20% on residential property
  higher_rate_non_residential: 0.20, // 20% on other gains for higher rate taxpayers
};

// ============ Dividend Allowance & Tax ============

export const DIVIDEND_ALLOWANCE_2026_27 = 500; // £500 tax-free dividend allowance

export const DIVIDEND_TAX_RATES_2026_27 = {
  basic_rate: 0.0875, // 8.75% above allowance
  higher_rate: 0.3375, // 33.75% above allowance
  additional_rate: 0.3875, // 38.75% above allowance
};

// ============ Personal Savings Allowance ============

export const PERSONAL_SAVINGS_ALLOWANCE_2026_27 = {
  basic_rate: 1000, // £1,000 tax-free interest for basic rate taxpayers
  higher_rate: 500, // £500 for higher rate taxpayers
  additional_rate: 0, // £0 for additional rate taxpayers
};

// ============ Marriage Allowance ============

export const MARRIAGE_ALLOWANCE_2026_27 = {
  max_transfer: 1260, // Up to £1,260 of personal allowance can be transferred
  rate: 0.20, // 20% relief
  max_relief: 252, // Maximum tax saving
};

// ============ Blind Person's Allowance ============

export const BLIND_PERSONS_ALLOWANCE_2026_27 = 2520;

// ============ High Income Child Benefit Withdrawal ============

export const CHILD_BENEFIT_WITHDRAWAL_THRESHOLD = 50000;
export const CHILD_BENEFIT_WITHDRAWAL_RATE = 0.01; // 1% withdrawal per £1 income above £50k

export const CHILD_BENEFIT_RATES_2026_27 = {
  eldest_child: 24.50, // Weekly rate
  other_children: 16.35, // Weekly rate
};

// ============ Trading Allowance ============

export const TRADING_ALLOWANCE_2026_27 = 1000; // Self-employed can claim up to £1,000

// ============ Pension Contributions (Tax Relief) ============

export const PENSION_RELIEF_RATES_2026_27 = {
  basic_rate_relief: 0.25, // Contributes £100, get £25 relief
  higher_rate_relief: 0.25,
  additional_rate_relief: 0.25,
};

export const ANNUAL_ALLOWANCE_PENSION_2026_27 = 60000; // Annual allowance for tax relief

// ============ Gift Aid Donations ============

export const GIFT_AID_RELIEF_RATE = 0.25; // Donor contributes £100, receives £25 relief

// ============ ISA Limits ============

export const ISA_LIMIT_2026_27 = 20000; // Total ISA limit across all types

// ============ Utility Functions ============

export function roundPence(n: number): number {
  return Math.round(n * 100) / 100;
}

export function ceilingPence(n: number): number {
  return Math.ceil(n * 100) / 100;
}

export function getTaxByBand(
  taxableIncome: number,
  bands: Record<string, any>
): number {
  let tax = 0;
  for (const [, band] of Object.entries(bands)) {
    if (taxableIncome <= band.lower) break;
    const inThisBand = Math.min(taxableIncome, band.upper) - band.lower;
    if (inThisBand > 0) tax += inThisBand * band.rate;
  }
  return tax;
}
