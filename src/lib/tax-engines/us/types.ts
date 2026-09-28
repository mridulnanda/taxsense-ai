/**
 * US Federal & State Tax Engine
 * Tax Year 2026 (filed in 2027)
 * Reference: IRS Publication 1, 17, and state tax guidance
 *
 * All amounts in whole US dollars ($).
 */

export type FilingStatus = "single" | "married_filing_jointly" | "married_filing_separately" | "head_of_household" | "qualifying_widow";
export type CapitalGainHoldingPeriod = "short_term" | "long_term";
export type USState =
  | "AL" | "AK" | "AZ" | "AR" | "CA" | "CO" | "CT" | "DE" | "FL" | "GA"
  | "HI" | "ID" | "IL" | "IN" | "IA" | "KS" | "KY" | "LA" | "ME" | "MD"
  | "MA" | "MI" | "MN" | "MS" | "MO" | "MT" | "NE" | "NV" | "NH" | "NJ"
  | "NM" | "NY" | "NC" | "ND" | "OH" | "OK" | "OR" | "PA" | "RI" | "SC"
  | "SD" | "TN" | "TX" | "UT" | "VT" | "VA" | "WA" | "WV" | "WI" | "WY" | "DC";

export interface W2Income {
  /** Gross wages from employer (Box 1 of W-2) */
  grossWages: number;
  /** Pre-tax contributions: 401(k), 403(b), health insurance, FSA, HSA, etc. */
  pretaxDeductions: number;
  /** Federal income tax already withheld (Box 2) */
  federalWithheld: number;
  /** Social Security tax withheld (Box 4) — for reference only */
  ssWithheld: number;
  /** Medicare tax withheld (Box 6) — for reference only */
  medicareWithheld: number;
}

export interface SelfEmploymentIncome {
  /** Net profit from Schedule C (after business expenses) */
  netProfit: number;
  /** Whether qualified business income (QBI) for 20% deduction u/s 199A */
  qualifiesForQBI: boolean;
}

export interface CapitalGainLoss {
  description?: string;
  /** Sale price minus cost basis */
  gain: number;
  holdingPeriod: CapitalGainHoldingPeriod;
}

export interface DividendIncome {
  /** Qualified dividends taxed at capital gain rates */
  qualified: number;
  /** Ordinary dividends taxed at ordinary rates */
  ordinary: number;
}

export interface TaxableIncomeSourcesUS {
  w2Wages?: W2Income[];
  selfEmployment?: SelfEmploymentIncome[];
  capitalGains?: CapitalGainLoss[];
  dividends?: DividendIncome;
  /** Interest income (taxable at ordinary rates) */
  ordinaryInterest: number;
  /** Qualified savings account interest (0% rate for some filers) */
  qualifiedSavingsInterest: number;
  /** Other taxable income */
  other: number;
}

export interface ItemizedDeductions {
  /** State and local taxes (property tax + income tax or sales tax) — capped at $10k */
  saltDeduction: number;
  /** Mortgage interest on up to $750k debt — subject to limitations */
  mortgageInterest: number;
  /** Charitable donations — subject to AGI limitations */
  charitableDonations: number;
  /** Medical expenses in excess of 7.5% AGI */
  medicalExpenses: number;
  /** State and local real property taxes (already in saltDeduction, listed separately) */
  realPropertyTaxes: number;
}

export interface EstimatedTaxPayments {
  /** Q1 payment (April 15) */
  q1: number;
  /** Q2 payment (June 15) */
  q2: number;
  /** Q3 payment (Sept 15) */
  q3: number;
  /** Q4 payment (Jan 15 next year) */
  q4: number;
}

export interface TaxCredits {
  /** Earned Income Tax Credit (EITC) — based on income, claimed by eligible taxpayers */
  eitc: number;
  /** Child Tax Credit — $2k per qualifying child under 17 */
  ctc: number;
  /** Additional CTC for refundable portion */
  actc: number;
  /** Child and Dependent Care Credit */
  childcareCredit: number;
  /** American Opportunity Tax Credit — up to $2.5k per qualified student */
  aotc: number;
  /** Lifetime Learning Credit — up to $2k per return */
  llc: number;
  /** Saver's Credit — for retirement contributions */
  saversCredit: number;
  /** Residential Energy Credit */
  energyCredit: number;
  /** Other non-refundable credits */
  otherCredits: number;
}

export interface TaxProfileUS {
  /** 2026 filing status */
  filingStatus: FilingStatus;
  /** Age at end of 2026 */
  age: number;
  /** Number of qualifying children under 17 */
  numChildren: number;
  /** Primary state of residence */
  state: USState;
  /** Secondary state income (if any) */
  secondaryState?: USState;
  /** Percentage income earned in secondary state (0-100) */
  secondaryStateIncomePercentage?: number;

  /** Income sources */
  incomeSources: TaxableIncomeSourcesUS;

  /** Above-the-line deductions (educator expenses, student loan interest, IRA deductions, etc.) */
  aboveTheLineDeductions: number;

  /** Standard vs Itemized deduction (itemized provided, standard computed) */
  itemizedDeductions?: ItemizedDeductions;
  useStandardDeduction?: boolean;

  /** Self-employment tax (Schedule SE) — computed automatically from net profit */
  seDeductions?: number;

  /** Estimated tax payments made during the year */
  estimatedTaxPayments?: EstimatedTaxPayments;

  /** Tax credits */
  taxCredits: TaxCredits;

  /** Alternative Minimum Tax (AMT) — preferences & adjustments */
  amtPreferenceAdjustments?: number;

  /** Prior year tax liability (for estimated tax calculation) */
  priorYearTaxLiability?: number;
}

/* ---------------------- Computation Results ---------------------- */

export interface IncomeBreakdownUS {
  totalWages: number;
  totalSelfEmployment: number;
  totalCapitalGains: number;
  totalDividends: number;
  totalInterest: number;
  totalOther: number;
  totalIncome: number;
}

export interface AGIBreakdown {
  grossIncome: number;
  aboveTheLineDeductions: number;
  agi: number;
}

export interface DeductionComputationUS {
  itemized: number;
  standard: number;
  used: number;
  /** Notes on deduction computation and limitations applied */
  notes: string[];
}

export interface FederalTaxComputationUS {
  agi: number;
  taxableIncome: number;
  incomeTax: number;
  capitalGainsTax: number;
  qualifiedDividendsTax: number;
  taxBeforeCredits: number;
  nonRefundableCredits: number;
  refundableCredits: number;
  totalCredits: number;
  federalIncomeTax: number;
}

export interface FICATaxComputationUS {
  /** Gross wages subject to Social Security (capped at $168,600 for 2026) */
  ssWageBase: number;
  /** Social Security tax at 12.4% (employee + employer, 6.2% each) */
  ssTax: number;
  /** Medicare tax base (no cap) */
  medicareWageBase: number;
  /** Medicare tax at 2.9% (employee + employer, 1.45% each) */
  medicareTax: number;
  /** Additional Medicare tax 0.9% on wages over threshold */
  additionalMedicareTax: number;
  totalFICA: number;
}

export interface SelfEmploymentTaxComputationUS {
  netSelfEmploymentIncome: number;
  seIncome: number;
  seTax: number;
  seDeduction: number;
}

export interface StateTaxComputationUS {
  state: USState;
  grossIncome: number;
  deduction: number;
  taxableIncome: number;
  stateTax: number;
  surtax?: number;
  totalStateTax: number;
}

export interface TaxComputationResultUS {
  profile: TaxProfileUS;

  // Income
  incomeBreakdown: IncomeBreakdownUS;
  agiBreakdown: AGIBreakdown;
  deductionComputation: DeductionComputationUS;

  // Federal
  federalTaxComputation: FederalTaxComputationUS;
  ficaTaxComputation: FICATaxComputationUS;
  seTaxComputation?: SelfEmploymentTaxComputationUS;

  // State (primary)
  primaryStateTaxComputation: StateTaxComputationUS;
  // State (secondary, if any)
  secondaryStateTaxComputation?: StateTaxComputationUS;

  // Summary
  totalFederalTax: number;
  totalStateTax: number;
  totalTaxLiability: number;

  /** Estimated tax payments + withholdings */
  totalTaxesPaid: number;
  /** Positive = refund due, Negative = tax owed */
  refundOrOwed: number;

  effectiveTaxRate: number;

  /** Audit trail and notes */
  notes: string[];
}
