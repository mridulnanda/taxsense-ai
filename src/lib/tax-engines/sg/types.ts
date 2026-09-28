/**
 * Singapore Tax Engine (2026 Tax Year - ending June 30)
 * Personal Income Tax, CPF, Investment Income
 * Reference: IRAS (Inland Revenue Authority of Singapore)
 */

export interface SingaporeIncome {
  /** Employment income (taxed at normal rates) */
  employmentIncome: number;
  /** Trade/business income */
  tradeIncome: number;
  /** Dividend income (from Singapore companies - exempt) */
  dividendIncome: number;
  /** Interest income (Singapore bank interest exempt) */
  interestIncome: number;
  /** Rental income from Singapore property */
  rentalIncome: number;
  /** Foreign sourced income */
  foreignIncome: number;
}

export interface CPFContribution {
  /** Mandatory CPF contribution (employee) */
  employeeContribution: number;
  /** Mandatory employer contribution */
  employerContribution: number;
  /** Voluntary contributions (can claim deduction) */
  voluntaryContribution: number;
}

export interface TaxProfileSG {
  /** Year ending June 30 */
  yearEnding: number;
  age: number;
  residentStatus: "citizen" | "permanent_resident" | "non_resident";
  
  /** Income sources */
  income: SingaporeIncome;
  
  /** CPF contributions */
  cpfContribution: CPFContribution;
  
  /** Other deductions */
  charityDonations: number;
  
  /** Tax paid during year */
  taxPaidDuringYear: number;
}

export interface TaxComputationResultSG {
  profile: TaxProfileSG;
  
  totalAssessableIncome: number;
  exemptIncome: number;
  
  deductibleCPF: number;
  totalDeductions: number;
  
  chargeable Income: number;
  
  taxAtNormalRates: number;
  taxOnForeignIncome: number;
  totalTax: number;
  
  earnedIncomeRelief: number;
  spouseRelief: number;
  parentalRelief: number;
  
  taxAfterRelief: number;
  
  taxPaid: number;
  refundOrOwed: number;
  effectiveTaxRate: number;
}
