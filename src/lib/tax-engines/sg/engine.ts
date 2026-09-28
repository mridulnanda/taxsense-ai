/**
 * Singapore Tax Engine (year ending June 30)
 */

import type { TaxProfileSG, TaxComputationResultSG } from "./types";
import { TAX_BRACKETS_2026_SG, CPF_RATES_2026, RELIEFS_2026_SG, getTaxFromBrackets } from "./constants";

const clamp0 = (n: number) => Math.max(0, n);

export function computeTaxesSG(profile: TaxProfileSG): TaxComputationResultSG {
  const income = profile.income;

  // Assessable income (excludes exempt income like SG dividends, SG bank interest)
  let totalAssessableIncome = 
    income.employmentIncome + 
    income.tradeIncome + 
    income.rentalIncome;

  let exemptIncome = income.dividendIncome + income.interestIncome;

  // Add foreign income if resident
  let foreignIncome = 0;
  if (profile.residentStatus !== "non_resident") {
    foreignIncome = income.foreignIncome;
    totalAssessableIncome += foreignIncome;
  }

  // Deductible CPF
  const deductibleCPF = Math.min(
    profile.cpfContribution.employeeContribution + profile.cpfContribution.voluntaryContribution,
    CPF_RATES_2026.max_yearly_contribution
  );

  const totalDeductions = deductibleCPF + profile.charityDonations;

  // Chargeable income
  const chargeableIncome = clamp0(totalAssessableIncome - totalDeductions);

  // Tax at normal rates
  const taxAtNormalRates = getTaxFromBrackets(chargeableIncome, TAX_BRACKETS_2026_SG);

  // Tax on foreign income (separate if applicable)
  let taxOnForeignIncome = 0;
  if (foreignIncome > 0 && profile.residentStatus === "citizen") {
    taxOnForeignIncome = getTaxFromBrackets(foreignIncome, TAX_BRACKETS_2026_SG);
  }

  let totalTax = taxAtNormalRates;

  // Reliefs (simplified)
  const earnedIncomeRelief = Math.min(profile.income.employmentIncome > 0 ? RELIEFS_2026_SG.earned_income_relief : 0, totalTax);
  
  const taxAfterRelief = clamp0(totalTax - earnedIncomeRelief);

  const refundOrOwed = profile.taxPaidDuringYear - taxAfterRelief;
  const effectiveRate = chargeableIncome > 0 ? (taxAfterRelief / chargeableIncome) * 100 : 0;

  return {
    profile,
    totalAssessableIncome,
    exemptIncome,
    deductibleCPF,
    totalDeductions,
    chargeableIncome,
    taxAtNormalRates,
    taxOnForeignIncome,
    totalTax,
    earnedIncomeRelief,
    spouseRelief: 0,
    parentalRelief: 0,
    taxAfterRelief,
    taxPaid: profile.taxPaidDuringYear,
    refundOrOwed,
    effectiveTaxRate: effectiveRate,
  };
}
