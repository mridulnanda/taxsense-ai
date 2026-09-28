/**
 * UK Tax Engine (2026-27 Tax Year)
 * Personal Income Tax, National Insurance, Capital Gains Tax, Dividends
 * Reference: HMRC guidance, Income Tax Act 2007 (as amended)
 *
 * All amounts in whole pounds sterling (£).
 */

export type UKTaxBand = "basic_rate" | "higher_rate" | "additional_rate";
export type ResidenceStatus = "resident_uk" | "non_resident" | "split_year";

export interface EmploymentIncome {
  /** Salary from employment */
  salary: number;
  /** Bonus and other employment-related income */
  bonus: number;
  /** Taxable benefits from employer */
  taxableBenefits: number;
  /** Benefits in kind (car, accommodation, etc.) */
  benefitsValue: number;
}

export interface SelfEmploymentIncome {
  /** Net profit after business expenses (from SA103) */
  netProfit: number;
  /** Class 2 NI due (£3.45/week for 2026-27) */
  class2NI: number;
  /** Trading allowance already applied (up to £1,000) */
  tradingAllowanceApplied: number;
}

export interface PropertyIncome {
  /** Rental income from UK property */
  rentalIncome: number;
  /** Mortgage interest (Section 24 relief) */
  mortgageInterest: number;
  /** Other expenses (maintenance, insurance, etc.) */
  otherExpenses: number;
}

export interface CapitalGainUK {
  description?: string;
  gain: number;
  /** Disposal date for matching/indexation relief if pre-2020 */
  disposalDate?: string;
}

export interface DividendIncomeUK {
  /** Dividend income (taxed per franking credit rules) */
  amount: number;
  /** Whether from UK or foreign source */
  source: "uk" | "foreign";
}

export interface TaxableIncomeSourcesUK {
  employment?: EmploymentIncome;
  selfEmployment?: SelfEmploymentIncome;
  property?: PropertyIncome;
  /** Bank and building society interest */
  savingsInterest: number;
  /** UK dividends */
  dividends: DividendIncomeUK[];
  /** Other income (pension, annuity, etc.) */
  other: number;
}

export interface PersonalAllowances {
  /** Standard personal allowance (up to £12,570 for 2026-27) */
  personalAllowance: number;
  /** Marriage Allowance transferred from spouse */
  marriageAllowanceReceived: number;
  /** Blind person's allowance (both spouses if both blind) */
  blindPersonsAllowance: number;
}

export interface TaxRelief {
  /** Gift Aid donations qualifying for 20% relief */
  giftAidDonations: number;
  /** Pension contributions (net of tax relief) */
  pensionContributions: number;
  /** ISA and Junior ISA (no relief needed) */
  isaContributions: number;
  /** Enterprise Investment Scheme */
  eISInvestment: number;
}

export interface TaxProfileUK {
  name?: string;
  /** Tax year end April 5th */
  taxYear: number;
  /** Age at end of tax year */
  age: number;
  residenceStatus: ResidenceStatus;
  /** Married/in civil partnership — for various reliefs */
  married: boolean;
  /** Only one spouse works → Marriage Allowance eligible */
  eligibleForMarriageAllowance: boolean;
  /** Blind (entitles to blind person's allowance) */
  isBlind: boolean;

  /** Income sources */
  incomeSources: TaxableIncomeSourcesUK;

  /** Allowances */
  personalAllowances: PersonalAllowances;

  /** Capital gains and losses */
  capitalGains?: CapitalGainUK[];
  /** Annual exempt amount for CGT (£3,000 for 2026-27, £1,500 for higher rate taxpayers) */
  annualExemptAmountCGT: number;

  /** Tax reliefs and deductions */
  taxRelief: TaxRelief;

  /** High income child benefit withdrawal (for income over £50k) */
  numChildren: number;
  childBenefitAmount?: number;

  /** Trading allowance used (max £1,000) */
  tradingAllowanceUsed: number;

  /** Tax paid */
  taxPaid: {
    /** PAYE tax withheld */
    payeTax: number;
    /** SA payments on account */
    saPaymentsOnAccount: number;
    /** Employee NI already withheld */
    employeeNI: number;
  };
}

/* ---------------------- Results ---------------------- */

export interface IncomeTaxBreakdown {
  totalEmployment: number;
  totalSelfEmployment: number;
  totalProperty: number;
  totalSavingsInterest: number;
  totalDividends: number;
  totalOther: number;
  totalIncome: number;
}

export interface NIContribution {
  class1Employee: number;
  class1Employer: number;
  class2SelfEmployed: number;
  class4SelfEmployed: number;
  totalEmployee: number;
  totalEmployer: number;
}

export interface CgtComputation {
  gains: number;
  losses: number;
  netGains: number;
  annualExempt: number;
  taxableGains: number;
  taxRate: number;
  cgtTax: number;
}

export interface TaxComputationResultUK {
  profile: TaxProfileUK;

  incomeBreakdown: IncomeTaxBreakdown;

  personalAllowanceUsed: number;

  taxableIncome: number;

  // Income tax computation
  incomeTaxBasicRate: number;
  incomeTaxHigherRate: number;
  incomeTaxAdditionalRate: number;
  totalIncomeTax: number;

  // National Insurance
  niComputation: NIContribution;

  // Capital Gains Tax
  cgtComputation: CgtComputation;

  // High income child benefit withdrawal
  childBenefitWithdrawal: number;

  // Dividend tax credit (treated as credit now, but shown for reference)
  dividendTaxCredit: number;

  // Total tax
  totalTaxLiability: number;

  taxPaid: number;

  refundOrOwed: number;

  effectiveTaxRate: number;

  notes: string[];
}
