/**
 * Canadian Tax Engine (2026 Tax Year)
 * Federal + Provincial Income Tax, CPP, EI, GST/HST
 * Reference: CRA guides, Income Tax Act
 */

export type CanadianProvince =
  | "AB" | "BC" | "MB" | "NB" | "NL" | "NS" | "ON" | "PE" | "QC" | "SK"
  | "NT" | "NU" | "YT";

export interface T4Income {
  /** Employment income (box 14) */
  employmentIncome: number;
  /** Deductions at source (box 22) */
  deductionsAtSource: number;
}

export interface T1GeneralIncome {
  /** Self-employment net income */
  businessIncome: number;
  /** Rental income (net) */
  rentalIncome: number;
  /** Investment income (capital gains, dividends, interest) */
  investmentIncome: number;
}

export interface CPPContribution {
  /** Self-employed CPP contributions (if applicable) */
  employeeContribution: number;
  /** Employer contribution (shown for reference) */
  employerContribution: number;
}

export interface TaxProfileCA {
  /** 2026 tax year */
  taxYear: number;
  age: number;
  province: CanadianProvince;

  // Income
  t4Income?: T4Income[];
  t1Income?: T1GeneralIncome;

  // Deductions
  cppContribution?: CPPContribution;
  eiPremium: number;

  /** RRSP contribution room used */
  rrspContribution: number;

  /** Non-registered savings (TFSA not tracked for tax) */
  capitalGainsClaimed: number;
  capitalLossesClaimed: number;

  /** Tax-free savings account contribution (no tax benefit) */
  tfsaContribution: number;

  // Tax paid
  federalTaxWithheld: number;
  provincialTaxWithheld: number;
  cppPaid: number;
  eiPaid: number;
}

export interface TaxComputationResultCA {
  profile: TaxProfileCA;

  totalIncome: number;
  rrspDeduction: number;
  capitalGainsIncome: number;

  netIncome: number;
  taxableIncome: number;

  federalBasicPersonalAmount: number;
  provincialBasicPersonalAmount: number;

  federalTax: number;
  provincialTax: number;
  totalIncomeTax: number;

  cppTax: number;
  eiTax: number;

  totalTaxLiability: number;
  totalTaxesPaid: number;

  refundOrOwed: number;
  effectiveTaxRate: number;

  notes: string[];
}
