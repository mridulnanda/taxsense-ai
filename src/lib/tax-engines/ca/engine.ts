/**
 * Canadian Tax Engine (2026)
 */

import type { TaxProfileCA, TaxComputationResultCA } from "./types";
import {
  BASIC_PERSONAL_AMOUNT_FEDERAL_2026,
  FEDERAL_TAX_BRACKETS_2026,
  PROVINCIAL_TAX_BRACKETS_2026,
  CPP_CONTRIBUTION_2026,
  EI_RATE_2026,
  getTaxBracketAmount,
} from "./constants";

const clamp0 = (n: number) => Math.max(0, n);

export function computeTaxesCA(profile: TaxProfileCA): TaxComputationResultCA {
  // Total income
  let totalIncome = 0;
  if (profile.t4Income) {
    totalIncome += profile.t4Income.reduce((sum, t4) => sum + t4.employmentIncome - t4.deductionsAtSource, 0);
  }
  if (profile.t1Income) {
    totalIncome += profile.t1Income.businessIncome + profile.t1Income.rentalIncome + profile.t1Income.investmentIncome;
  }

  // RRSP deduction
  const rrspDeduction = Math.min(profile.rrspContribution, totalIncome * 0.18);

  // Capital gains (50% inclusion)
  const capitalGainsIncome = (profile.capitalGainsClaimed - profile.capitalLossesClaimed) * 0.5;

  // Net income
  const netIncome = clamp0(totalIncome - rrspDeduction + capitalGainsIncome);

  // Taxable income
  const taxableIncome = clamp0(netIncome);

  // Federal tax
  const federalBasicPersonalAmount = BASIC_PERSONAL_AMOUNT_FEDERAL_2026;
  const federalTaxableIncome = clamp0(taxableIncome - federalBasicPersonalAmount);
  const federalTax = getTaxBracketAmount(federalTaxableIncome, FEDERAL_TAX_BRACKETS_2026);

  // Provincial tax
  const provincialprovincialAmount = 15705; // Simplified
  const provincialTaxableIncome = clamp0(taxableIncome - provincialprovincialAmount);
  const provincialBrackets = PROVINCIAL_TAX_BRACKETS_2026[profile.province] || [];
  const provincialTax = getTaxBracketAmount(provincialTaxableIncome, provincialBrackets);

  // CPP
  let cppTax = 0;
  if (profile.t1Income?.businessIncome) {
    const pensionable = Math.min(profile.t1Income.businessIncome, CPP_CONTRIBUTION_2026.maxPensionable);
    const pensionableAboveBasic = clamp0(pensionable - CPP_CONTRIBUTION_2026.basicExemption);
    cppTax = pensionableAboveBasic * CPP_CONTRIBUTION_2026.employeeRate * 2; // Self-employed pays both
  }

  // EI
  const eiTax = clamp0((profile.t4Income?.[0]?.employmentIncome || 0) * EI_RATE_2026);

  // Total
  const totalIncomeTax = federalTax + provincialTax;
  const totalTaxLiability = totalIncomeTax + cppTax + eiTax;
  const totalTaxesPaid = profile.federalTaxWithheld + profile.provincialTaxWithheld + profile.cppPaid + profile.eiPaid;
  const refundOrOwed = totalTaxesPaid - totalTaxLiability;
  const effectiveRate = totalIncome > 0 ? (totalTaxLiability / totalIncome) * 100 : 0;

  return {
    profile,
    totalIncome,
    rrspDeduction,
    capitalGainsIncome,
    netIncome,
    taxableIncome,
    federalBasicPersonalAmount,
    provincialBasicPersonalAmount: provincialprovincialAmount,
    federalTax,
    provincialTax,
    totalIncomeTax,
    cppTax,
    eiTax,
    totalTaxLiability,
    totalTaxesPaid,
    refundOrOwed,
    effectiveTaxRate: effectiveRate,
    notes: [],
  };
}
