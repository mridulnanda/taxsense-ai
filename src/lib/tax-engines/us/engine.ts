/**
 * US Federal & State Tax Computation Engine
 * Tax Year 2026
 * Pure functions — no side effects, deterministic output
 */

import type {
  TaxProfileUS,
  TaxComputationResultUS,
  IncomeBreakdownUS,
  AGIBreakdown,
  DeductionComputationUS,
  FederalTaxComputationUS,
  FICATaxComputationUS,
  SelfEmploymentTaxComputationUS,
  StateTaxComputationUS,
} from "./types";
import {
  FEDERAL_TAX_BRACKETS_2026,
  STANDARD_DEDUCTION_2026,
  LONG_TERM_CAPITAL_GAINS_RATES_2026,
  FICA_RATES_2026,
  SELF_EMPLOYMENT_TAX_2026,
  AMT_EXEMPTION_2026,
  AMT_THRESHOLD_2026,
  AMT_RATE_2026,
  SALT_CAP_2026,
  CHILD_TAX_CREDIT_2026,
  SECTION_179_LIMIT_2026,
  BONUS_DEPRECIATION_2026,
  STATE_TAX_BRACKETS_2026,
  STATE_NO_INCOME_TAX,
  getTaxBracketAmount,
  roundDollar,
} from "./constants";

const clamp0 = (n: number) => Math.max(0, n);

/**
 * Compute total income from all sources
 */
export function computeIncomeBreakdown(profile: TaxProfileUS): IncomeBreakdownUS {
  const sources = profile.incomeSources;
  const notes: string[] = [];

  // W-2 Wages
  let totalWages = 0;
  if (sources.w2Wages) {
    totalWages = sources.w2Wages.reduce((sum, w2) => sum + w2.grossWages - w2.pretaxDeductions, 0);
  }

  // Self-Employment Income
  let totalSelfEmployment = 0;
  if (sources.selfEmployment) {
    totalSelfEmployment = sources.selfEmployment.reduce((sum, se) => sum + se.netProfit, 0);
  }

  // Capital Gains (short-term = ordinary income, long-term = preferential)
  let totalCapitalGains = 0;
  if (sources.capitalGains) {
    totalCapitalGains = sources.capitalGains.reduce((sum, cg) => sum + cg.gain, 0);
  }

  // Dividends
  let totalDividends = 0;
  if (sources.dividends) {
    totalDividends = sources.dividends.qualified + sources.dividends.ordinary;
  }

  // Interest
  let totalInterest = sources.ordinaryInterest + sources.qualifiedSavingsInterest;

  // Other income
  const totalOther = sources.other;

  const totalIncome = totalWages + totalSelfEmployment + totalCapitalGains + totalDividends + totalInterest + totalOther;

  return {
    totalWages,
    totalSelfEmployment,
    totalCapitalGains,
    totalDividends,
    totalInterest,
    totalOther,
    totalIncome,
  };
}

/**
 * Compute AGI (Adjusted Gross Income)
 */
export function computeAGI(profile: TaxProfileUS, incomeBreakdown: IncomeBreakdownUS): AGIBreakdown {
  const grossIncome = incomeBreakdown.totalIncome;

  // Above-the-line deductions
  let aboveTheLineDeductions = profile.aboveTheLineDeductions || 0;

  // Self-employment tax deduction (50% of SE tax)
  let seDeduction = 0;
  if (profile.incomeSources.selfEmployment && profile.incomeSources.selfEmployment.length > 0) {
    const seTax = computeSelfEmploymentTax(profile, incomeBreakdown);
    seDeduction = seTax.seDeduction;
    aboveTheLineDeductions += seDeduction;
  }

  const agi = clamp0(grossIncome - aboveTheLineDeductions);

  return {
    grossIncome,
    aboveTheLineDeductions,
    agi,
  };
}

/**
 * Compute deduction (itemized vs standard)
 */
export function computeDeduction(profile: TaxProfileUS, agi: number): DeductionComputationUS {
  const notes: string[] = [];
  const standardDed = STANDARD_DEDUCTION_2026[profile.filingStatus];

  // Add additional standard deduction for seniors (65+)
  let adjustedStandard = standardDed;
  if (profile.age >= 65) {
    const additionalAmount = profile.filingStatus === "married_filing_jointly" || profile.filingStatus === "qualifying_widow"
      ? 1500
      : 1850;
    adjustedStandard += additionalAmount;
  }

  // Compute itemized deduction
  let itemized = 0;
  if (profile.itemizedDeductions) {
    const id = profile.itemizedDeductions;

    // SALT capped at $10k
    const saltUsed = Math.min(id.saltDeduction + id.realPropertyTaxes, SALT_CAP_2026);
    itemized += saltUsed;

    // Mortgage interest (no cap if debt ≤ $750k, otherwise phase out)
    itemized += id.mortgageInterest;

    // Charitable donations (subject to AGI limits - simplified here as 60% for cash)
    itemized += id.charitableDonations;

    // Medical expenses (only amount exceeding 7.5% AGI is deductible)
    const medicalThreshold = agi * 0.075;
    itemized += Math.max(0, id.medicalExpenses - medicalThreshold);

    if (saltUsed < id.saltDeduction + id.realPropertyTaxes) {
      notes.push(`SALT deduction capped at $${SALT_CAP_2026.toLocaleString()}`);
    }
  }

  // Use larger of standard or itemized
  let used = adjustedStandard;
  if (profile.itemizedDeductions && itemized > adjustedStandard) {
    used = itemized;
    notes.push("Using itemized deduction");
  } else {
    notes.push("Using standard deduction");
  }

  return {
    itemized,
    standard: adjustedStandard,
    used,
    notes,
  };
}

/**
 * Compute federal income tax
 */
export function computeFederalIncomeTax(profile: TaxProfileUS, incomeBreakdown: IncomeBreakdownUS, agi: number, deduction: number): FederalTaxComputationUS {
  const notes: string[] = [];

  // Taxable income (before capital gains)
  const taxableIncome = clamp0(agi - deduction);

  // Separate long-term capital gains from ordinary income
  let ltcgAmount = 0;
  if (incomeBreakdown.totalCapitalGains > 0 && profile.incomeSources.capitalGains) {
    ltcgAmount = profile.incomeSources.capitalGains
      .filter(cg => cg.holdingPeriod === "long_term")
      .reduce((sum, cg) => sum + cg.gain, 0);
  }

  // Qualified dividends also taxed at capital gains rates
  const qualifiedDividends = profile.incomeSources.dividends?.qualified || 0;

  // Ordinary income = taxable income minus long-term capital gains/qualified dividends
  const ordinaryIncome = clamp0(taxableIncome - ltcgAmount - qualifiedDividends);

  // Tax on ordinary income using normal brackets
  const brackets = FEDERAL_TAX_BRACKETS_2026[profile.filingStatus];
  const incomeTax = getTaxBracketAmount(ordinaryIncome, brackets);

  // Tax on long-term capital gains using preferential rates
  const cgBrackets = LONG_TERM_CAPITAL_GAINS_RATES_2026[profile.filingStatus];
  const capitalGainsTax = getTaxBracketAmount(ordinaryIncome + ltcgAmount, cgBrackets) -
                          getTaxBracketAmount(ordinaryIncome, cgBrackets);

  // Tax on qualified dividends (same preferential rates as LTCG)
  const dividendsTax = getTaxBracketAmount(ordinaryIncome + ltcgAmount + qualifiedDividends, cgBrackets) -
                       getTaxBracketAmount(ordinaryIncome + ltcgAmount, cgBrackets);

  const taxBeforeCredits = incomeTax + capitalGainsTax + dividendsTax;

  // Tax credits (non-refundable)
  const nonRefundableCredits = clamp0(
    (profile.taxCredits?.childcareCredit || 0) +
    (profile.taxCredits?.aotc || 0) +
    (profile.taxCredits?.llc || 0) +
    (profile.taxCredits?.saversCredit || 0) +
    (profile.taxCredits?.otherCredits || 0)
  );

  // Refundable credits
  const refundableCredits = clamp0(
    (profile.taxCredits?.eitc || 0) +
    (profile.taxCredits?.ctc || 0) +
    (profile.taxCredits?.actc || 0)
  );

  const totalCredits = nonRefundableCredits + refundableCredits;

  const federalIncomeTax = clamp0(taxBeforeCredits - nonRefundableCredits);

  return {
    agi,
    taxableIncome,
    incomeTax,
    capitalGainsTax,
    qualifiedDividendsTax: dividendsTax,
    taxBeforeCredits,
    nonRefundableCredits,
    refundableCredits,
    totalCredits,
    federalIncomeTax,
  };
}

/**
 * Compute FICA taxes (Social Security + Medicare)
 */
export function computeFICATax(profile: TaxProfileUS, incomeBreakdown: IncomeBreakdownUS): FICATaxComputationUS {
  // Social Security wage base
  const ssWageBase = Math.min(incomeBreakdown.totalWages, FICA_RATES_2026.socialSecurityWageBase);
  const ssTax = ssWageBase * FICA_RATES_2026.socialSecurityRate;

  // Medicare wage base (no cap)
  const medicareWageBase = incomeBreakdown.totalWages;
  const medicareTax = medicareWageBase * FICA_RATES_2026.medicareRate;

  // Additional Medicare tax (0.9% on wages over threshold)
  const additionalMedicareThreshold = FICA_RATES_2026.additionalMedicareThreshold[profile.filingStatus];
  const additionalMedicareTax = clamp0((incomeBreakdown.totalWages - additionalMedicareThreshold) * 0.009);

  const totalFICA = ssTax + medicareTax + additionalMedicareTax;

  return {
    ssWageBase,
    ssTax,
    medicareWageBase,
    medicareTax,
    additionalMedicareTax,
    totalFICA,
  };
}

/**
 * Compute self-employment tax
 */
export function computeSelfEmploymentTax(profile: TaxProfileUS, incomeBreakdown: IncomeBreakdownUS): SelfEmploymentTaxComputationUS {
  const netSeIncome = incomeBreakdown.totalSelfEmployment;

  // SE income = net profit × 92.35% (roughly)
  const seIncome = netSeIncome * 0.9235;

  // SE tax = seIncome × 15.3%
  const seTax = seIncome * SELF_EMPLOYMENT_TAX_2026.rate;

  // SE deduction = 50% of SE tax (above-the-line deduction)
  const seDeduction = seTax * 0.5;

  return {
    netSelfEmploymentIncome: netSeIncome,
    seIncome,
    seTax,
    seDeduction,
  };
}

/**
 * Compute state income tax (simplified single-state)
 */
export function computeStateIncomeTax(profile: TaxProfileUS, agi: number): StateTaxComputationUS {
  const state = profile.state;
  const stateTaxConfig = STATE_TAX_BRACKETS_2026[state];

  if (!stateTaxConfig || stateTaxConfig.noIncomeTax) {
    return {
      state,
      grossIncome: agi,
      deduction: 0,
      taxableIncome: 0,
      stateTax: 0,
      totalStateTax: 0,
    };
  }

  // Compute state deduction (varies by state)
  const stateStandardDed = stateTaxConfig.standardDeduction || 0;
  const stateTaxableIncome = clamp0(agi - stateStandardDed);

  // Compute state tax using state brackets
  const stateTax = getTaxBracketAmount(stateTaxableIncome, stateTaxConfig.brackets || []);

  // Some states have additional taxes/surtax
  let surtax = 0;
  if (state === "CA" && agi > 1000000) {
    surtax = (agi - 1000000) * 0.01; // 1% surtax on millionaires
  }

  return {
    state,
    grossIncome: agi,
    deduction: stateStandardDed,
    taxableIncome: stateTaxableIncome,
    stateTax,
    surtax,
    totalStateTax: stateTax + (surtax || 0),
  };
}

/**
 * Main computation function
 */
export function computeTaxesUS(profile: TaxProfileUS): TaxComputationResultUS {
  const notes: string[] = [];

  // Step 1: Income breakdown
  const incomeBreakdown = computeIncomeBreakdown(profile);

  // Step 2: AGI computation
  const agiBreakdown = computeAGI(profile, incomeBreakdown);

  // Step 3: Deduction computation
  const deductionComputation = computeDeduction(profile, agiBreakdown.agi);

  // Step 4: Federal income tax
  const federalTaxComputation = computeFederalIncomeTax(
    profile,
    incomeBreakdown,
    agiBreakdown.agi,
    deductionComputation.used
  );

  // Step 5: FICA taxes
  const ficaTaxComputation = computeFICATax(profile, incomeBreakdown);

  // Step 6: Self-employment tax
  let seTaxComputation: SelfEmploymentTaxComputationUS | undefined;
  if (profile.incomeSources.selfEmployment && profile.incomeSources.selfEmployment.length > 0) {
    seTaxComputation = computeSelfEmploymentTax(profile, incomeBreakdown);
  }

  // Step 7: State income tax
  const primaryStateTaxComputation = computeStateIncomeTax(profile, agiBreakdown.agi);

  // Step 8: Secondary state tax (if applicable)
  let secondaryStateTaxComputation: StateTaxComputationUS | undefined;
  if (profile.secondaryState && profile.secondaryStateIncomePercentage) {
    const secondaryStateAGI = agiBreakdown.agi * (profile.secondaryStateIncomePercentage / 100);
    secondaryStateTaxComputation = computeStateIncomeTax(
      { ...profile, state: profile.secondaryState },
      secondaryStateAGI
    );
  }

  // Step 9: Summary
  const totalFederalTax = federalTaxComputation.federalIncomeTax + ficaTaxComputation.totalFICA + (seTaxComputation?.seTax || 0);
  const totalStateTax = primaryStateTaxComputation.totalStateTax + (secondaryStateTaxComputation?.totalStateTax || 0);
  const totalTaxLiability = totalFederalTax + totalStateTax;

  // Total taxes paid (withholdings + estimated tax payments)
  let totalTaxesPaid = 0;
  if (profile.incomeSources.w2Wages) {
    totalTaxesPaid += profile.incomeSources.w2Wages.reduce((sum, w2) => sum + w2.federalWithheld, 0);
  }
  if (profile.estimatedTaxPayments) {
    const est = profile.estimatedTaxPayments;
    totalTaxesPaid += est.q1 + est.q2 + est.q3 + est.q4;
  }

  const refundOrOwed = totalTaxesPaid - totalTaxLiability;
  const effectiveTaxRate = incomeBreakdown.totalIncome > 0 ? (totalTaxLiability / incomeBreakdown.totalIncome) * 100 : 0;

  return {
    profile,
    incomeBreakdown,
    agiBreakdown,
    deductionComputation,
    federalTaxComputation,
    ficaTaxComputation,
    seTaxComputation,
    primaryStateTaxComputation,
    secondaryStateTaxComputation,
    totalFederalTax,
    totalStateTax,
    totalTaxLiability,
    totalTaxesPaid,
    refundOrOwed,
    effectiveTaxRate,
    notes,
  };
}
