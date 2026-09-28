/**
 * UK Tax Engine (2026-27)
 * Income Tax, National Insurance, CGT, Dividend Tax
 */

import type { TaxProfileUK, TaxComputationResultUK } from "./types";
import {
  PERSONAL_ALLOWANCE_2026_27,
  INCOME_TAX_BANDS_ENGLAND_WALES_NI_2026_27,
  NI_THRESHOLDS_2026_27,
  NI_CLASS_2_2026_27,
  NI_CLASS_4_2026_27,
  ANNUAL_EXEMPT_AMOUNT_CGT_2026_27,
  CGT_RATES_2026_27,
  DIVIDEND_ALLOWANCE_2026_27,
  DIVIDEND_TAX_RATES_2026_27,
  PERSONAL_SAVINGS_ALLOWANCE_2026_27,
  MARRIAGE_ALLOWANCE_2026_27,
  BLIND_PERSONS_ALLOWANCE_2026_27,
  CHILD_BENEFIT_WITHDRAWAL_THRESHOLD,
  CHILD_BENEFIT_WITHDRAWAL_RATE,
  getTaxByBand,
  roundPence,
} from "./constants";

const clamp0 = (n: number) => Math.max(0, n);

/**
 * Compute total income
 */
export function computeIncomeBreakdownUK(profile: TaxProfileUK) {
  const sources = profile.incomeSources;

  let employment = 0;
  if (sources.employment) {
    employment = sources.employment.salary + sources.employment.bonus + sources.employment.taxableBenefits + sources.employment.benefitsValue;
  }

  let selfEmployment = 0;
  if (sources.selfEmployment) {
    selfEmployment = clamp0(sources.selfEmployment.netProfit - sources.selfEmployment.tradingAllowanceApplied);
  }

  let property = 0;
  if (sources.property) {
    property = clamp0(
      sources.property.rentalIncome -
      sources.property.mortgageInterest -
      sources.property.otherExpenses
    );
  }

  let totalDividends = 0;
  if (sources.dividends && sources.dividends.length > 0) {
    totalDividends = sources.dividends.reduce((sum, d) => sum + d.amount, 0);
  }

  const totalIncome =
    employment +
    selfEmployment +
    property +
    sources.savingsInterest +
    totalDividends +
    sources.other;

  return {
    employment,
    selfEmployment,
    property,
    savingsInterest: sources.savingsInterest,
    dividends: totalDividends,
    other: sources.other,
    total: totalIncome,
  };
}

/**
 * Compute personal allowance (can be reduced by high income)
 */
export function computePersonalAllowance(profile: TaxProfileUK, totalIncome: number): number {
  let allowance = PERSONAL_ALLOWANCE_2026_27;

  // Add marriage allowance received
  allowance += profile.personalAllowances.marriageAllowanceReceived;

  // Add blind person's allowance if applicable
  if (profile.isBlind) {
    allowance += BLIND_PERSONS_ALLOWANCE_2026_27;
  }

  // High income relief withdrawal (over £100k)
  const withdrawalThreshold = 100000;
  if (totalIncome > withdrawalThreshold) {
    const excess = totalIncome - withdrawalThreshold;
    const withdrawal = excess * 0.5; // £1 allowance lost per £2 over threshold
    allowance = Math.max(0, allowance - withdrawal);
  }

  return allowance;
}

/**
 * Compute income tax liability
 */
export function computeIncomeTax(profile: TaxProfileUK, totalIncome: number, allowance: number) {
  const taxableIncome = clamp0(totalIncome - allowance);

  const bands = INCOME_TAX_BANDS_ENGLAND_WALES_NI_2026_27;

  let basicRateTax = 0;
  let higherRateTax = 0;
  let additionalRateTax = 0;

  // Basic rate (£12,570 to £50,270)
  const basicUpper = 50270;
  if (taxableIncome > 0) {
    const basicTaxable = Math.min(taxableIncome, basicUpper - allowance);
    basicRateTax = basicTaxable * bands.basic_rate.rate;
  }

  // Higher rate (£50,270 to £125,140)
  const higherUpper = 125140;
  if (taxableIncome > basicUpper - allowance) {
    const higherTaxable = Math.min(taxableIncome, higherUpper) - Math.max(allowance, basicUpper - 0.001);
    if (higherTaxable > 0) {
      higherRateTax = higherTaxable * bands.higher_rate.rate;
    }
  }

  // Additional rate (over £125,140)
  if (taxableIncome > higherUpper - allowance) {
    const additionalTaxable = taxableIncome - (higherUpper - allowance);
    additionalRateTax = additionalTaxable * bands.additional_rate.rate;
  }

  return {
    taxableIncome,
    basicRateTax,
    higherRateTax,
    additionalRateTax,
    totalIncomeTax: basicRateTax + higherRateTax + additionalRateTax,
  };
}

/**
 * Compute National Insurance
 */
export function computeNationalInsurance(profile: TaxProfileUK, income: number) {
  let employeeNI = 0;
  let employerNI = 0;
  let class2NI = 0;
  let class4NI = 0;

  // Employee NI (Class 1)
  if (income.employment > 0) {
    const niThreshold = NI_THRESHOLDS_2026_27.class1_employee.lower;
    const niUpperThreshold = 50270;

    if (income.employment > niThreshold) {
      const niableIncome = Math.min(income.employment, niUpperThreshold) - niThreshold;
      employeeNI = niableIncome * NI_THRESHOLDS_2026_27.class1_employee_rate;

      if (income.employment > niUpperThreshold) {
        const additionalNIable = income.employment - niUpperThreshold;
        employeeNI += additionalNIable * NI_THRESHOLDS_2026_27.class1_employee_rate_higher;
      }
    }

    // Employer NI
    const employerThreshold = NI_THRESHOLDS_2026_27.class1_employer.lower;
    if (income.employment > employerThreshold) {
      const niableForEmployer = income.employment - employerThreshold;
      employerNI = niableForEmployer * NI_THRESHOLDS_2026_27.class1_employer_rate;
    }
  }

  // Class 2 NI (self-employed)
  if (profile.incomeSources.selfEmployment && profile.incomeSources.selfEmployment.netProfit > NI_CLASS_2_2026_27.profit_threshold) {
    class2NI = NI_CLASS_2_2026_27.annual_rate;
  }

  // Class 4 NI (self-employed)
  if (income.selfEmployment > 0) {
    const profit = income.selfEmployment;
    const lower = NI_CLASS_4_2026_27.lower_profit;
    const upper = NI_CLASS_4_2026_27.upper_profit;

    if (profit > lower) {
      const class4Lower = Math.min(profit, upper) - lower;
      class4NI = class4Lower * NI_CLASS_4_2026_27.rate_lower;

      if (profit > upper) {
        const class4Higher = profit - upper;
        class4NI += class4Higher * NI_CLASS_4_2026_27.rate_upper;
      }
    }
  }

  return {
    employeeNI: roundPence(employeeNI),
    employerNI: roundPence(employerNI),
    class2NI: roundPence(class2NI),
    class4NI: roundPence(class4NI),
    totalEmployee: roundPence(employeeNI + class2NI + class4NI),
    totalEmployer: roundPence(employerNI),
  };
}

/**
 * Compute Capital Gains Tax
 */
export function computeCGT(profile: TaxProfileUK, taxableIncome: number) {
  if (!profile.capitalGains || profile.capitalGains.length === 0) {
    return {
      gains: 0,
      losses: 0,
      netGains: 0,
      annualExempt: 0,
      taxableGains: 0,
      taxRate: 0,
      cgtTax: 0,
    };
  }

  let gains = 0;
  let losses = 0;

  for (const cg of profile.capitalGains) {
    if (cg.gain > 0) gains += cg.gain;
    else losses -= cg.gain;
  }

  const netGains = clamp0(gains - losses);
  const annualExempt = profile.annualExemptAmountCGT || ANNUAL_EXEMPT_AMOUNT_CGT_2026_27.standard;
  const taxableGains = clamp0(netGains - annualExempt);

  // Determine CGT rate based on income (simplified)
  let cgtRate = CGT_RATES_2026_27.basic_rate_non_residential;
  if (taxableIncome > 50270) {
    cgtRate = CGT_RATES_2026_27.higher_rate_non_residential;
  }

  const cgtTax = roundPence(taxableGains * cgtRate);

  return {
    gains,
    losses,
    netGains,
    annualExempt,
    taxableGains,
    taxRate: cgtRate,
    cgtTax,
  };
}

/**
 * Main computation
 */
export function computeTaxesUK(profile: TaxProfileUK): TaxComputationResultUK {
  const notes: string[] = [];

  // Step 1: Income breakdown
  const incomeBreakdown = computeIncomeBreakdownUK(profile);

  // Step 2: Personal allowance
  const personalAllowanceUsed = computePersonalAllowance(profile, incomeBreakdown.total);

  // Step 3: Income tax
  const incomeTaxCalc = computeIncomeTax(profile, incomeBreakdown.total, personalAllowanceUsed);

  // Step 4: National Insurance
  const niCalc = computeNationalInsurance(profile, incomeBreakdown);

  // Step 5: Capital Gains Tax
  const cgtCalc = computeCGT(profile, incomeTaxCalc.taxableIncome);

  // Step 6: High income child benefit withdrawal
  let childBenefitWithdrawal = 0;
  if (profile.numChildren > 0 && incomeBreakdown.total > CHILD_BENEFIT_WITHDRAWAL_THRESHOLD) {
    const excess = incomeBreakdown.total - CHILD_BENEFIT_WITHDRAWAL_THRESHOLD;
    childBenefitWithdrawal = Math.min(
      profile.childBenefitAmount || 0,
      excess * CHILD_BENEFIT_WITHDRAWAL_RATE
    );
  }

  // Step 7: Total tax liability
  const totalTaxLiability =
    incomeTaxCalc.totalIncomeTax +
    niCalc.totalEmployee +
    cgtCalc.cgtTax -
    childBenefitWithdrawal;

  // Tax paid
  const taxPaid =
    profile.taxPaid.payeTax +
    profile.taxPaid.saPaymentsOnAccount +
    profile.taxPaid.employeeNI;

  const refundOrOwed = taxPaid - totalTaxLiability;
  const effectiveRate = incomeBreakdown.total > 0 ? (totalTaxLiability / incomeBreakdown.total) * 100 : 0;

  return {
    profile,
    incomeBreakdown,
    personalAllowanceUsed,
    taxableIncome: incomeTaxCalc.taxableIncome,
    incomeTaxBasicRate: incomeTaxCalc.basicRateTax,
    incomeTaxHigherRate: incomeTaxCalc.higherRateTax,
    incomeTaxAdditionalRate: incomeTaxCalc.additionalRateTax,
    totalIncomeTax: incomeTaxCalc.totalIncomeTax,
    niComputation: niCalc,
    cgtComputation: cgtCalc,
    childBenefitWithdrawal,
    dividendTaxCredit: 0,
    totalTaxLiability,
    taxPaid,
    refundOrOwed,
    effectiveTaxRate: effectiveRate,
    notes,
  };
}
