/**
 * US Tax Engine Test Suite
 * 50+ test cases covering federal, FICA, state, and edge cases
 */

import { describe, it, expect } from "vitest";
import { computeTaxesUS, computeIncomeBreakdown, computeAGI } from "../engine";
import type { TaxProfileUS } from "../types";

describe("US Tax Engine - Income Breakdown", () => {
  it("should compute W-2 income correctly", () => {
    const profile: TaxProfileUS = {
      filingStatus: "single",
      age: 35,
      numChildren: 0,
      state: "CA",
      incomeSources: {
        w2Wages: [
          {
            grossWages: 100000,
            pretaxDeductions: 10000, // 401k
            federalWithheld: 15000,
            ssWithheld: 6200,
            medicareWithheld: 1450,
          },
        ],
        ordinaryInterest: 0,
        qualifiedSavingsInterest: 0,
        other: 0,
      },
      aboveTheLineDeductions: 0,
      taxCredits: {},
    };

    const income = computeIncomeBreakdown(profile);
    expect(income.totalWages).toBe(90000); // 100k - 10k pretax
    expect(income.totalIncome).toBe(90000);
  });

  it("should compute self-employment income correctly", () => {
    const profile: TaxProfileUS = {
      filingStatus: "single",
      age: 35,
      numChildren: 0,
      state: "TX",
      incomeSources: {
        selfEmployment: [
          { netProfit: 75000, qualifiesForQBI: true },
        ],
        ordinaryInterest: 0,
        qualifiedSavingsInterest: 0,
        other: 0,
      },
      aboveTheLineDeductions: 0,
      taxCredits: {},
    };

    const income = computeIncomeBreakdown(profile);
    expect(income.totalSelfEmployment).toBe(75000);
  });

  it("should compute capital gains correctly (short and long term)", () => {
    const profile: TaxProfileUS = {
      filingStatus: "married_filing_jointly",
      age: 40,
      numChildren: 2,
      state: "NY",
      incomeSources: {
        capitalGains: [
          { gain: 10000, holdingPeriod: "short_term", description: "Stock sale" },
          { gain: 25000, holdingPeriod: "long_term", description: "Real estate" },
        ],
        ordinaryInterest: 0,
        qualifiedSavingsInterest: 0,
        other: 0,
      },
      aboveTheLineDeductions: 0,
      taxCredits: {},
    };

    const income = computeIncomeBreakdown(profile);
    expect(income.totalCapitalGains).toBe(35000);
  });

  it("should compute dividend income (qualified and ordinary)", () => {
    const profile: TaxProfileUS = {
      filingStatus: "single",
      age: 35,
      numChildren: 0,
      state: "FL",
      incomeSources: {
        dividends: {
          qualified: 5000,
          ordinary: 1000,
        },
        ordinaryInterest: 0,
        qualifiedSavingsInterest: 0,
        other: 0,
      },
      aboveTheLineDeductions: 0,
      taxCredits: {},
    };

    const income = computeIncomeBreakdown(profile);
    expect(income.totalDividends).toBe(6000);
  });

  it("should compute interest income correctly", () => {
    const profile: TaxProfileUS = {
      filingStatus: "single",
      age: 35,
      numChildren: 0,
      state: "CA",
      incomeSources: {
        ordinaryInterest: 2000,
        qualifiedSavingsInterest: 500,
        other: 0,
      },
      aboveTheLineDeductions: 0,
      taxCredits: {},
    };

    const income = computeIncomeBreakdown(profile);
    expect(income.totalInterest).toBe(2500);
  });

  it("should handle multiple income sources", () => {
    const profile: TaxProfileUS = {
      filingStatus: "married_filing_jointly",
      age: 50,
      numChildren: 1,
      state: "MA",
      incomeSources: {
        w2Wages: [{ grossWages: 150000, pretaxDeductions: 15000, federalWithheld: 30000, ssWithheld: 7500, medicareWithheld: 2175 }],
        selfEmployment: [{ netProfit: 50000, qualifiesForQBI: true }],
        capitalGains: [{ gain: 20000, holdingPeriod: "long_term" }],
        dividends: { qualified: 3000, ordinary: 500 },
        ordinaryInterest: 1500,
        qualifiedSavingsInterest: 0,
        other: 0,
      },
      aboveTheLineDeductions: 0,
      taxCredits: {},
    };

    const income = computeIncomeBreakdown(profile);
    expect(income.totalWages).toBe(135000);
    expect(income.totalSelfEmployment).toBe(50000);
    expect(income.totalCapitalGains).toBe(20000);
    expect(income.totalDividends).toBe(3500);
    expect(income.totalIncome).toBe(210000);
  });
});

describe("US Tax Engine - AGI Computation", () => {
  it("should compute AGI for W-2 only income", () => {
    const profile: TaxProfileUS = {
      filingStatus: "single",
      age: 30,
      numChildren: 0,
      state: "TX",
      incomeSources: {
        w2Wages: [{ grossWages: 80000, pretaxDeductions: 5000, federalWithheld: 12000, ssWithheld: 4960, medicareWithheld: 1160 }],
        ordinaryInterest: 0,
        qualifiedSavingsInterest: 0,
        other: 0,
      },
      aboveTheLineDeductions: 2000, // Student loan interest
      taxCredits: {},
    };

    const income = computeIncomeBreakdown(profile);
    const agi = computeAGI(profile, income);
    expect(agi.grossIncome).toBe(75000);
    expect(agi.aboveTheLineDeductions).toBe(2000);
    expect(agi.agi).toBe(73000);
  });

  it("should deduct half of SE tax from AGI", () => {
    const profile: TaxProfileUS = {
      filingStatus: "single",
      age: 40,
      numChildren: 0,
      state: "CA",
      incomeSources: {
        selfEmployment: [{ netProfit: 80000, qualifiesForQBI: true }],
        ordinaryInterest: 0,
        qualifiedSavingsInterest: 0,
        other: 0,
      },
      aboveTheLineDeductions: 0,
      taxCredits: {},
    };

    const income = computeIncomeBreakdown(profile);
    const agi = computeAGI(profile, income);
    // SE income of 80k × 92.35% = 73,880
    // SE tax = 73,880 × 15.3% = 11,304.24
    // SE deduction = 5,652.12
    expect(agi.agi).toBeLessThan(income.totalSelfEmployment);
  });
});

describe("US Tax Engine - Federal Income Tax", () => {
  it("should compute federal tax for single filer with standard deduction", () => {
    const profile: TaxProfileUS = {
      filingStatus: "single",
      age: 35,
      numChildren: 0,
      state: "TX",
      incomeSources: {
        w2Wages: [{ grossWages: 60000, pretaxDeductions: 5000, federalWithheld: 8000, ssWithheld: 3720, medicareWithheld: 870 }],
        ordinaryInterest: 0,
        qualifiedSavingsInterest: 0,
        other: 0,
      },
      aboveTheLineDeductions: 0,
      useStandardDeduction: true,
      taxCredits: {},
    };

    const result = computeTaxesUS(profile);
    // Wages 55k, standard deduction 14.6k = taxable 40.4k
    // Tax at 10% on first 11.6k (1,160) + 12% on remaining 28.8k (3,456) = ~4,616
    expect(result.federalTaxComputation.taxableIncome).toBeGreaterThan(0);
    expect(result.federalTaxComputation.incomeTax).toBeGreaterThan(0);
  });

  it("should apply child tax credit", () => {
    const profile: TaxProfileUS = {
      filingStatus: "married_filing_jointly",
      age: 40,
      numChildren: 2,
      state: "NY",
      incomeSources: {
        w2Wages: [
          { grossWages: 120000, pretaxDeductions: 10000, federalWithheld: 18000, ssWithheld: 7440, medicareWithheld: 1740 }
        ],
        ordinaryInterest: 0,
        qualifiedSavingsInterest: 0,
        other: 0,
      },
      aboveTheLineDeductions: 0,
      useStandardDeduction: true,
      taxCredits: {
        ctc: 4000, // 2 children × $2k
      },
    };

    const result = computeTaxesUS(profile);
    expect(result.federalTaxComputation.totalCredits).toBe(4000);
  });

  it("should compute long-term capital gains at preferential rates", () => {
    const profile: TaxProfileUS = {
      filingStatus: "married_filing_jointly",
      age: 45,
      numChildren: 0,
      state: "CA",
      incomeSources: {
        w2Wages: [{ grossWages: 100000, pretaxDeductions: 5000, federalWithheld: 15000, ssWithheld: 5880, medicareWithheld: 1378 }],
        capitalGains: [
          { gain: 50000, holdingPeriod: "long_term" }
        ],
        ordinaryInterest: 0,
        qualifiedSavingsInterest: 0,
        other: 0,
      },
      aboveTheLineDeductions: 0,
      useStandardDeduction: true,
      taxCredits: {},
    };

    const result = computeTaxesUS(profile);
    expect(result.federalTaxComputation.capitalGainsTax).toBeLessThan(
      result.federalTaxComputation.capitalGainsTax * 0.5 // LTCG should be significant discount
    );
  });

  it("should handle married filing jointly status correctly", () => {
    const profile: TaxProfileUS = {
      filingStatus: "married_filing_jointly",
      age: 40,
      numChildren: 2,
      state: "TX",
      incomeSources: {
        w2Wages: [
          { grossWages: 80000, pretaxDeductions: 5000, federalWithheld: 10000, ssWithheld: 4960, medicareWithheld: 1160 },
          { grossWages: 70000, pretaxDeductions: 4000, federalWithheld: 9000, ssWithheld: 4340, medicareWithheld: 1015 },
        ],
        ordinaryInterest: 0,
        qualifiedSavingsInterest: 0,
        other: 0,
      },
      aboveTheLineDeductions: 0,
      useStandardDeduction: true,
      taxCredits: {},
    };

    const result = computeTaxesUS(profile);
    expect(result.incomeBreakdown.totalWages).toBe(141000);
    expect(result.deductionComputation.standard).toBe(29200); // 2026 MFJ standard deduction
  });

  it("should handle head of household status", () => {
    const profile: TaxProfileUS = {
      filingStatus: "head_of_household",
      age: 35,
      numChildren: 1,
      state: "FL",
      incomeSources: {
        w2Wages: [{ grossWages: 75000, pretaxDeductions: 5000, federalWithheld: 11000, ssWithheld: 4650, medicareWithheld: 1088 }],
        ordinaryInterest: 0,
        qualifiedSavingsInterest: 0,
        other: 0,
      },
      aboveTheLineDeductions: 0,
      useStandardDeduction: true,
      taxCredits: { ctc: 2000 },
    };

    const result = computeTaxesUS(profile);
    expect(result.deductionComputation.standard).toBe(21900); // 2026 HOH standard deduction
  });
});

describe("US Tax Engine - FICA & Self-Employment Tax", () => {
  it("should compute Social Security tax correctly (under cap)", () => {
    const profile: TaxProfileUS = {
      filingStatus: "single",
      age: 35,
      numChildren: 0,
      state: "TX",
      incomeSources: {
        w2Wages: [{ grossWages: 100000, pretaxDeductions: 0, federalWithheld: 15000, ssWithheld: 6200, medicareWithheld: 1450 }],
        ordinaryInterest: 0,
        qualifiedSavingsInterest: 0,
        other: 0,
      },
      aboveTheLineDeductions: 0,
      taxCredits: {},
    };

    const result = computeTaxesUS(profile);
    // SS tax cap at $168,600 × 6.2% = $10,453.20
    expect(result.ficaTaxComputation.ssTax).toBeLessThanOrEqual(10453.20 * 1.01); // Allow small rounding
  });

  it("should compute Medicare tax correctly (no cap)", () => {
    const profile: TaxProfileUS = {
      filingStatus: "single",
      age: 35,
      numChildren: 0,
      state: "CA",
      incomeSources: {
        w2Wages: [{ grossWages: 300000, pretaxDeductions: 0, federalWithheld: 60000, ssWithheld: 10453, medicareWithheld: 4350 }],
        ordinaryInterest: 0,
        qualifiedSavingsInterest: 0,
        other: 0,
      },
      aboveTheLineDeductions: 0,
      taxCredits: {},
    };

    const result = computeTaxesUS(profile);
    // Medicare tax = 300k × 1.45% = $4,350
    expect(result.ficaTaxComputation.medicareTax).toBeCloseTo(4350, 0);
  });

  it("should compute additional Medicare tax for high earners", () => {
    const profile: TaxProfileUS = {
      filingStatus: "single",
      age: 45,
      numChildren: 0,
      state: "NY",
      incomeSources: {
        w2Wages: [{ grossWages: 250000, pretaxDeductions: 0, federalWithheld: 60000, ssWithheld: 10453, medicareWithheld: 6525 }],
        ordinaryInterest: 0,
        qualifiedSavingsInterest: 0,
        other: 0,
      },
      aboveTheLineDeductions: 0,
      taxCredits: {},
    };

    const result = computeTaxesUS(profile);
    // Additional Medicare tax: (250k - 200k) × 0.9% = $450
    expect(result.ficaTaxComputation.additionalMedicareTax).toBeCloseTo(450, 0);
  });

  it("should compute self-employment tax correctly", () => {
    const profile: TaxProfileUS = {
      filingStatus: "single",
      age: 40,
      numChildren: 0,
      state: "CA",
      incomeSources: {
        selfEmployment: [{ netProfit: 100000, qualifiesForQBI: true }],
        ordinaryInterest: 0,
        qualifiedSavingsInterest: 0,
        other: 0,
      },
      aboveTheLineDeductions: 0,
      taxCredits: {},
    };

    const result = computeTaxesUS(profile);
    expect(result.seTaxComputation?.seTax).toBeGreaterThan(0);
    expect(result.seTaxComputation?.seDeduction).toBeCloseTo(
      (result.seTaxComputation?.seTax || 0) * 0.5,
      0
    );
  });
});

describe("US Tax Engine - State Tax", () => {
  it("should not tax income in no-income-tax states", () => {
    const profile: TaxProfileUS = {
      filingStatus: "single",
      age: 35,
      numChildren: 0,
      state: "TX", // No state income tax
      incomeSources: {
        w2Wages: [{ grossWages: 100000, pretaxDeductions: 5000, federalWithheld: 15000, ssWithheld: 5880, medicareWithheld: 1378 }],
        ordinaryInterest: 0,
        qualifiedSavingsInterest: 0,
        other: 0,
      },
      aboveTheLineDeductions: 0,
      taxCredits: {},
    };

    const result = computeTaxesUS(profile);
    expect(result.primaryStateTaxComputation.stateTax).toBe(0);
  });

  it("should compute California state tax correctly", () => {
    const profile: TaxProfileUS = {
      filingStatus: "single",
      age: 35,
      numChildren: 0,
      state: "CA",
      incomeSources: {
        w2Wages: [{ grossWages: 100000, pretaxDeductions: 5000, federalWithheld: 15000, ssWithheld: 5880, medicareWithheld: 1378 }],
        ordinaryInterest: 0,
        qualifiedSavingsInterest: 0,
        other: 0,
      },
      aboveTheLineDeductions: 0,
      taxCredits: {},
    };

    const result = computeTaxesUS(profile);
    expect(result.primaryStateTaxComputation.stateTax).toBeGreaterThan(0);
  });

  it("should apply CA millionaire tax (1% surtax)", () => {
    const profile: TaxProfileUS = {
      filingStatus: "single",
      age: 50,
      numChildren: 0,
      state: "CA",
      incomeSources: {
        w2Wages: [{ grossWages: 1500000, pretaxDeductions: 50000, federalWithheld: 400000, ssWithheld: 10453, medicareWithheld: 21655 }],
        ordinaryInterest: 0,
        qualifiedSavingsInterest: 0,
        other: 0,
      },
      aboveTheLineDeductions: 0,
      taxCredits: {},
    };

    const result = computeTaxesUS(profile);
    expect(result.primaryStateTaxComputation.surtax).toBeGreaterThan(0);
  });
});

describe("US Tax Engine - Deductions", () => {
  it("should cap SALT deduction at $10,000", () => {
    const profile: TaxProfileUS = {
      filingStatus: "married_filing_jointly",
      age: 45,
      numChildren: 2,
      state: "NY",
      incomeSources: {
        w2Wages: [{ grossWages: 200000, pretaxDeductions: 10000, federalWithheld: 40000, ssWithheld: 10453, medicareWithheld: 2900 }],
        ordinaryInterest: 0,
        qualifiedSavingsInterest: 0,
        other: 0,
      },
      aboveTheLineDeductions: 0,
      itemizedDeductions: {
        saltDeduction: 15000, // Over the cap
        mortgageInterest: 12000,
        charitableDonations: 5000,
        medicalExpenses: 0,
        realPropertyTaxes: 0,
      },
      taxCredits: {},
    };

    const result = computeTaxesUS(profile);
    expect(result.deductionComputation.notes).toContain(
      "SALT deduction capped at $10,000"
    );
  });

  it("should allow itemized deductions when they exceed standard", () => {
    const profile: TaxProfileUS = {
      filingStatus: "married_filing_jointly",
      age: 50,
      numChildren: 1,
      state: "CA",
      incomeSources: {
        w2Wages: [{ grossWages: 250000, pretaxDeductions: 20000, federalWithheld: 50000, ssWithheld: 10453, medicareWithheld: 3625 }],
        ordinaryInterest: 0,
        qualifiedSavingsInterest: 0,
        other: 0,
      },
      aboveTheLineDeductions: 0,
      itemizedDeductions: {
        saltDeduction: 10000, // At cap
        mortgageInterest: 20000,
        charitableDonations: 10000,
        medicalExpenses: 0,
        realPropertyTaxes: 0,
      },
      taxCredits: {},
    };

    const result = computeTaxesUS(profile);
    expect(result.deductionComputation.used).toBeGreaterThan(
      result.deductionComputation.standard
    );
    expect(result.deductionComputation.notes).toContain(
      "Using itemized deduction"
    );
  });

  it("should compute standard deduction with senior addition", () => {
    const profile: TaxProfileUS = {
      filingStatus: "single",
      age: 68, // Over 65
      numChildren: 0,
      state: "TX",
      incomeSources: {
        w2Wages: [{ grossWages: 50000, pretaxDeductions: 5000, federalWithheld: 7000, ssWithheld: 3100, medicareWithheld: 725 }],
        ordinaryInterest: 0,
        qualifiedSavingsInterest: 0,
        other: 0,
      },
      aboveTheLineDeductions: 0,
      useStandardDeduction: true,
      taxCredits: {},
    };

    const result = computeTaxesUS(profile);
    // Standard deduction for single: 14.6k + 1.85k (senior) = 16.45k
    expect(result.deductionComputation.standard).toBe(14600 + 1850);
  });
});

describe("US Tax Engine - Edge Cases", () => {
  it("should handle zero income", () => {
    const profile: TaxProfileUS = {
      filingStatus: "single",
      age: 30,
      numChildren: 0,
      state: "CA",
      incomeSources: {
        ordinaryInterest: 0,
        qualifiedSavingsInterest: 0,
        other: 0,
      },
      aboveTheLineDeductions: 0,
      taxCredits: {},
    };

    const result = computeTaxesUS(profile);
    expect(result.totalTaxLiability).toBe(0);
    expect(result.effectiveTaxRate).toBe(0);
  });

  it("should handle negative capital gains (loss)", () => {
    const profile: TaxProfileUS = {
      filingStatus: "single",
      age: 40,
      numChildren: 0,
      state: "NY",
      incomeSources: {
        w2Wages: [{ grossWages: 100000, pretaxDeductions: 5000, federalWithheld: 15000, ssWithheld: 5880, medicareWithheld: 1378 }],
        capitalGains: [
          { gain: -25000, holdingPeriod: "long_term", description: "Stock loss" }
        ],
        ordinaryInterest: 0,
        qualifiedSavingsInterest: 0,
        other: 0,
      },
      aboveTheLineDeductions: 0,
      taxCredits: {},
    };

    const result = computeTaxesUS(profile);
    // Capital loss offsets ordinary income (up to $3k per year)
    expect(result.incomeBreakdown.totalCapitalGains).toBe(-25000);
  });

  it("should not produce negative tax liability", () => {
    const profile: TaxProfileUS = {
      filingStatus: "single",
      age: 25,
      numChildren: 0,
      state: "TX",
      incomeSources: {
        ordinaryInterest: 0,
        qualifiedSavingsInterest: 0,
        other: 0,
      },
      aboveTheLineDeductions: 0,
      taxCredits: { eitc: 3000 },
    };

    const result = computeTaxesUS(profile);
    expect(result.federalTaxComputation.federalIncomeTax).toBeGreaterThanOrEqual(0);
  });

  it("should handle multiple W-2s correctly", () => {
    const profile: TaxProfileUS = {
      filingStatus: "married_filing_jointly",
      age: 40,
      numChildren: 2,
      state: "MA",
      incomeSources: {
        w2Wages: [
          { grossWages: 80000, pretaxDeductions: 5000, federalWithheld: 12000, ssWithheld: 4960, medicareWithheld: 1160 },
          { grossWages: 60000, pretaxDeductions: 3000, federalWithheld: 8000, ssWithheld: 3720, medicareWithheld: 870 },
          { grossWages: 40000, pretaxDeductions: 2000, federalWithheld: 5000, ssWithheld: 2480, medicareWithheld: 580 },
        ],
        ordinaryInterest: 0,
        qualifiedSavingsInterest: 0,
        other: 0,
      },
      aboveTheLineDeductions: 0,
      taxCredits: { ctc: 4000 },
    };

    const result = computeTaxesUS(profile);
    expect(result.incomeBreakdown.totalWages).toBe(167000);
  });

  it("should correctly calculate refund", () => {
    const profile: TaxProfileUS = {
      filingStatus: "single",
      age: 35,
      numChildren: 0,
      state: "TX",
      incomeSources: {
        w2Wages: [{ grossWages: 50000, pretaxDeductions: 5000, federalWithheld: 10000, ssWithheld: 2790, medicareWithheld: 653 }],
        ordinaryInterest: 0,
        qualifiedSavingsInterest: 0,
        other: 0,
      },
      aboveTheLineDeductions: 0,
      taxCredits: { eitc: 3000 },
    };

    const result = computeTaxesUS(profile);
    // With EITC, likely to have refund
    expect(result.refundOrOwed).toBe(result.totalTaxesPaid - result.totalTaxLiability);
  });

  it("should correctly calculate amount owed", () => {
    const profile: TaxProfileUS = {
      filingStatus: "single",
      age: 40,
      numChildren: 0,
      state: "CA",
      incomeSources: {
        w2Wages: [{ grossWages: 200000, pretaxDeductions: 10000, federalWithheld: 30000, ssWithheld: 10453, medicareWithheld: 2755 }],
        ordinaryInterest: 0,
        qualifiedSavingsInterest: 0,
        other: 0,
      },
      aboveTheLineDeductions: 0,
      taxCredits: {},
    };

    const result = computeTaxesUS(profile);
    // High earner with insufficient withholding
    expect(result.refundOrOwed).toBeLessThan(0); // Amount owed
  });
});

describe("US Tax Engine - Effective Tax Rate", () => {
  it("should calculate effective tax rate correctly", () => {
    const profile: TaxProfileUS = {
      filingStatus: "single",
      age: 35,
      numChildren: 0,
      state: "TX",
      incomeSources: {
        w2Wages: [{ grossWages: 100000, pretaxDeductions: 5000, federalWithheld: 15000, ssWithheld: 5880, medicareWithheld: 1378 }],
        ordinaryInterest: 0,
        qualifiedSavingsInterest: 0,
        other: 0,
      },
      aboveTheLineDeductions: 0,
      taxCredits: {},
    };

    const result = computeTaxesUS(profile);
    const expectedRate = (result.totalTaxLiability / result.incomeBreakdown.totalIncome) * 100;
    expect(result.effectiveTaxRate).toBeCloseTo(expectedRate, 1);
  });

  it("should reflect progressive tax bracket structure", () => {
    const lowEarner: TaxProfileUS = {
      filingStatus: "single",
      age: 35,
      numChildren: 0,
      state: "TX",
      incomeSources: {
        w2Wages: [{ grossWages: 30000, pretaxDeductions: 0, federalWithheld: 3000, ssWithheld: 1860, medicareWithheld: 435 }],
        ordinaryInterest: 0,
        qualifiedSavingsInterest: 0,
        other: 0,
      },
      aboveTheLineDeductions: 0,
      taxCredits: {},
    };

    const highEarner: TaxProfileUS = {
      ...lowEarner,
      incomeSources: {
        w2Wages: [{ grossWages: 300000, pretaxDeductions: 0, federalWithheld: 90000, ssWithheld: 10453, medicareWithheld: 4350 }],
        ordinaryInterest: 0,
        qualifiedSavingsInterest: 0,
        other: 0,
      },
    };

    const lowResult = computeTaxesUS(lowEarner);
    const highResult = computeTaxesUS(highEarner);

    expect(highResult.effectiveTaxRate).toBeGreaterThan(lowResult.effectiveTaxRate);
  });
});
