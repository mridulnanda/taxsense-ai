/**
 * Australia Tax Engine (2025-26)
 */

import type { TaxProfileAU, TaxComputationResultAU } from "./types";
import {
  TAX_BRACKETS_2025_26_AU,
  MEDICARE_LEVY_RATE,
  CAPITAL_GAINS_DISCOUNT,
  LOW_INCOME_OFFSET_2025_26,
  getTaxFromBrackets,
} from "./constants";

const clamp0 = (n: number) => Math.max(0, n);

export function computeTaxesAU(profile: TaxProfileAU): TaxComputationResultAU {
  const income = profile.income;

  // Total income
  const totalIncome =
    income.salary +
    income.allowances +
    income.businessIncome +
    income.rentalIncome +
    income.dividends +
    income.interestIncome;

  // Capital gains (50% discount for individuals if >12 months)
  const cgIncome = income.capitalGains > 0 ? income.capitalGains * CAPITAL_GAINS_DISCOUNT : 0;
  const capitalGainsIncome = clamp0(cgIncome - (profile.capitalLosses * CAPITAL_GAINS_DISCOUNT));

  // Deductions
  let deductions = profile.superContributions;

  // Taxable income
  const taxableIncome = clamp0(totalIncome + capitalGainsIncome - deductions);

  // Income tax
  const incomeTax = getTaxFromBrackets(taxableIncome, TAX_BRACKETS_2025_26_AU);

  // Medicare Levy
  const medicareLevyBase = taxableIncome;
  const medicareLevyAmount = profile.hasPrivateHealthInsurance ? 0 : medicareLevyBase * MEDICARE_LEVY_RATE;

  // Low income offset
  let lowIncomeOffsetAmount = 0;
  if (profile.lowIncomeOffset && taxableIncome <= LOW_INCOME_OFFSET_2025_26.income_threshold) {
    lowIncomeOffsetAmount = LOW_INCOME_OFFSET_2025_26.max_offset;
    if (taxableIncome > 66667 - LOW_INCOME_OFFSET_2025_26.max_offset / LOW_INCOME_OFFSET_2025_26.reduction_rate) {
      lowIncomeOffsetAmount = Math.max(
        0,
        LOW_INCOME_OFFSET_2025_26.max_offset -
          (taxableIncome - (66667 - LOW_INCOME_OFFSET_2025_26.max_offset / LOW_INCOME_OFFSET_2025_26.reduction_rate)) *
            LOW_INCOME_OFFSET_2025_26.reduction_rate
      );
    }
  }

  // Total tax
  const totalTaxLiability = clamp0(incomeTax + medicareLevyAmount - lowIncomeOffsetAmount);

  const refundOrOwed = profile.taxPaidDuringYear - totalTaxLiability;
  const effectiveRate = totalIncome > 0 ? (totalTaxLiability / totalIncome) * 100 : 0;

  return {
    profile,
    totalIncome,
    capitalGainsIncome,
    deductions,
    taxableIncome,
    incomeTax,
    medicareLevyBase,
    medicareLevyAmount,
    lowIncomeOffset: lowIncomeOffsetAmount,
    totalTaxLiability,
    taxPaid: profile.taxPaidDuringYear,
    refundOrOwed,
    effectiveTaxRate: effectiveRate,
  };
}
