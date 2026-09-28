/**
 * Australia Tax Engine (2025-26 Financial Year)
 * Personal Income Tax, Medicare Levy, Capital Gains Tax, Superannuation
 * Reference: ATO (Australian Taxation Office), Income Tax Assessment Act
 */

export interface AustralianIncome {
  /** Salary/wages (from employer) */
  salary: number;
  /** Allowances, tips, bonuses */
  allowances: number;
  /** Net business income */
  businessIncome: number;
  /** Rental income (net of costs) */
  rentalIncome: number;
  /** Capital gains (net) */
  capitalGains: number;
  /** Dividend income */
  dividends: number;
  /** Interest income */
  interestIncome: number;
}

export interface TaxProfileAU {
  /** FY 2025-26 */
  financialYear: number;
  age: number;
  residentStatus: "resident" | "foreign_resident";
  
  income: AustralianIncome;
  
  /** Private health insurance (exempts Medicare Levy) */
  hasPrivateHealthInsurance: boolean;
  
  /** Superannuation contributions (concessional) */
  superContributions: number;
  
  /** Capital losses to offset gains */
  capitalLosses: number;
  
  /** HELP/HECS debt (affects HELP threshold) */
  helpDebt: boolean;
  
  /** Tax offsets/credits */
  lowIncomeOffset: boolean;
  
  taxPaidDuringYear: number;
}

export interface TaxComputationResultAU {
  profile: TaxProfileAU;
  
  totalIncome: number;
  
  capitalGainsIncome: number;
  
  deductions: number;
  
  taxableIncome: number;
  
  incomeTax: number;
  
  medicareLevyBase: number;
  medicareLevyAmount: number;
  
  lowIncomeOffset: number;
  
  totalTaxLiability: number;
  
  taxPaid: number;
  refundOrOwed: number;
  
  effectiveTaxRate: number;
}
