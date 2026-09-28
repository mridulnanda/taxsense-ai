/**
 * Australia Tax Engine Test Suite
 */

import { describe, it, expect } from "vitest";
import { computeTaxesAU } from "../engine";
import type { TaxProfileAU } from "../types";

describe("Australia Tax Engine", () => {
  it("should compute income tax for basic taxpayer", () => {
    const profile: TaxProfileAU = {
      financialYear: 2026,
      age: 35,
      residentStatus: "resident",
      income: {
        salary: 70000,
        allowances: 0,
        businessIncome: 0,
        rentalIncome: 0,
        capitalGains: 0,
        dividends: 0,
        interestIncome: 500,
      },
      hasPrivateHealthInsurance: false,
      superContributions: 3000,
      capitalLosses: 0,
      helpDebt: false,
      lowIncomeOffset: false,
      taxPaidDuringYear: 12000,
    };

    const result = computeTaxesAU(profile);
    expect(result.totalIncome).toBe(70500);
    expect(result.incomeTax).toBeGreaterThan(0);
    expect(result.medicareLevyAmount).toBeGreaterThan(0);
  });

  it("should apply capital gains discount", () => {
    const profile: TaxProfileAU = {
      financialYear: 2026,
      age: 45,
      residentStatus: "resident",
      income: {
        salary: 100000,
        allowances: 0,
        businessIncome: 0,
        rentalIncome: 0,
        capitalGains: 20000,
        dividends: 0,
        interestIncome: 0,
      },
      hasPrivateHealthInsurance: true,
      superContributions: 5000,
      capitalLosses: 0,
      helpDebt: false,
      lowIncomeOffset: false,
      taxPaidDuringYear: 20000,
    };

    const result = computeTaxesAU(profile);
    expect(result.capitalGainsIncome).toBe(10000); // 50% discount
    expect(result.medicareLevyAmount).toBe(0); // Private health insurance
  });

  it("should apply low income offset", () => {
    const profile: TaxProfileAU = {
      financialYear: 2026,
      age: 25,
      residentStatus: "resident",
      income: {
        salary: 40000,
        allowances: 0,
        businessIncome: 0,
        rentalIncome: 0,
        capitalGains: 0,
        dividends: 0,
        interestIncome: 0,
      },
      hasPrivateHealthInsurance: false,
      superContributions: 0,
      capitalLosses: 0,
      helpDebt: false,
      lowIncomeOffset: true,
      taxPaidDuringYear: 6000,
    };

    const result = computeTaxesAU(profile);
    expect(result.lowIncomeOffset).toBeGreaterThan(0);
  });

  it("should compute Medicare Levy correctly", () => {
    const profile: TaxProfileAU = {
      financialYear: 2026,
      age: 40,
      residentStatus: "resident",
      income: {
        salary: 150000,
        allowances: 5000,
        businessIncome: 0,
        rentalIncome: 0,
        capitalGains: 0,
        dividends: 0,
        interestIncome: 0,
      },
      hasPrivateHealthInsurance: false,
      superContributions: 10000,
      capitalLosses: 0,
      helpDebt: false,
      lowIncomeOffset: false,
      taxPaidDuringYear: 40000,
    };

    const result = computeTaxesAU(profile);
    const expectedMLBase = 155000 - 10000; // 145000 taxable
    const expectedML = expectedMLBase * 0.02;
    expect(result.medicareLevyAmount).toBeCloseTo(expectedML, 0);
  });

  it("should handle rental income with negative gearing", () => {
    const profile: TaxProfileAU = {
      financialYear: 2026,
      age: 50,
      residentStatus: "resident",
      income: {
        salary: 80000,
        allowances: 0,
        businessIncome: 0,
        rentalIncome: -5000, // Negative gearing (deductible expenses exceed rental income)
        capitalGains: 0,
        dividends: 0,
        interestIncome: 0,
      },
      hasPrivateHealthInsurance: true,
      superContributions: 5000,
      capitalLosses: 0,
      helpDebt: false,
      lowIncomeOffset: false,
      taxPaidDuringYear: 15000,
    };

    const result = computeTaxesAU(profile);
    expect(result.totalIncome).toBe(75000);
    expect(result.medicareLevyAmount).toBe(0);
  });

  it("should compute effective tax rate correctly", () => {
    const profile: TaxProfileAU = {
      financialYear: 2026,
      age: 35,
      residentStatus: "resident",
      income: {
        salary: 60000,
        allowances: 0,
        businessIncome: 0,
        rentalIncome: 0,
        capitalGains: 0,
        dividends: 0,
        interestIncome: 0,
      },
      hasPrivateHealthInsurance: false,
      superContributions: 0,
      capitalLosses: 0,
      helpDebt: false,
      lowIncomeOffset: false,
      taxPaidDuringYear: 10000,
    };

    const result = computeTaxesAU(profile);
    const expectedRate = (result.totalTaxLiability / result.totalIncome) * 100;
    expect(result.effectiveTaxRate).toBeCloseTo(expectedRate, 1);
  });

  it("should handle self-employment income", () => {
    const profile: TaxProfileAU = {
      financialYear: 2026,
      age: 40,
      residentStatus: "resident",
      income: {
        salary: 0,
        allowances: 0,
        businessIncome: 100000,
        rentalIncome: 0,
        capitalGains: 0,
        dividends: 0,
        interestIncome: 1000,
      },
      hasPrivateHealthInsurance: false,
      superContributions: 8000,
      capitalLosses: 0,
      helpDebt: false,
      lowIncomeOffset: false,
      taxPaidDuringYear: 18000,
    };

    const result = computeTaxesAU(profile);
    expect(result.totalIncome).toBe(101000);
    expect(result.taxableIncome).toBe(93000); // After super deduction
  });
});
