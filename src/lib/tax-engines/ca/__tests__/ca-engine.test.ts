/**
 * Canadian Tax Engine Test Suite
 */

import { describe, it, expect } from "vitest";
import { computeTaxesCA } from "../engine";
import type { TaxProfileCA } from "../types";

describe("Canadian Tax Engine", () => {
  it("should compute federal tax correctly", () => {
    const profile: TaxProfileCA = {
      taxYear: 2026,
      age: 35,
      province: "ON",
      t4Income: [{ employmentIncome: 80000, deductionsAtSource: 5000 }],
      t1Income: undefined,
      cppContribution: { employeeContribution: 3500, employerContribution: 3500, voluntaryContribution: 0 },
      eiPremium: 1000,
      rrspContribution: 5000,
      capitalGainsClaimed: 0,
      capitalLossesClaimed: 0,
      tfsaContribution: 0,
      federalTaxWithheld: 12000,
      provincialTaxWithheld: 5000,
      cppPaid: 3500,
      eiPaid: 1000,
    };

    const result = computeTaxesCA(profile);
    expect(result.totalIncome).toBe(75000);
    expect(result.federalTax).toBeGreaterThan(0);
  });

  it("should apply RRSP deduction", () => {
    const profile: TaxProfileCA = {
      taxYear: 2026,
      age: 40,
      province: "BC",
      t4Income: [{ employmentIncome: 100000, deductionsAtSource: 5000 }],
      t1Income: undefined,
      cppContribution: { employeeContribution: 3500, employerContribution: 3500, voluntaryContribution: 0 },
      eiPremium: 1200,
      rrspContribution: 10000,
      capitalGainsClaimed: 0,
      capitalLossesClaimed: 0,
      tfsaContribution: 0,
      federalTaxWithheld: 15000,
      provincialTaxWithheld: 6000,
      cppPaid: 3500,
      eiPaid: 1200,
    };

    const result = computeTaxesCA(profile);
    expect(result.rrspDeduction).toBe(10000);
    expect(result.taxableIncome).toBeLessThan(95000);
  });

  it("should compute capital gains at 50% inclusion", () => {
    const profile: TaxProfileCA = {
      taxYear: 2026,
      age: 45,
      province: "ON",
      t4Income: [{ employmentIncome: 60000, deductionsAtSource: 3000 }],
      t1Income: undefined,
      cppContribution: { employeeContribution: 3500, employerContribution: 3500, voluntaryContribution: 0 },
      eiPremium: 900,
      rrspContribution: 3000,
      capitalGainsClaimed: 20000,
      capitalLossesClaimed: 0,
      tfsaContribution: 0,
      federalTaxWithheld: 9000,
      provincialTaxWithheld: 4000,
      cppPaid: 3500,
      eiPaid: 900,
    };

    const result = computeTaxesCA(profile);
    expect(result.capitalGainsIncome).toBe(10000); // 50% inclusion
  });

  it("should handle self-employment income and CPP", () => {
    const profile: TaxProfileCA = {
      taxYear: 2026,
      age: 50,
      province: "AB",
      t4Income: undefined,
      t1Income: { businessIncome: 80000, rentalIncome: 0, investmentIncome: 2000 },
      cppContribution: { employeeContribution: 0, employerContribution: 0, voluntaryContribution: 0 },
      eiPremium: 0,
      rrspContribution: 8000,
      capitalGainsClaimed: 5000,
      capitalLossesClaimed: 0,
      tfsaContribution: 0,
      federalTaxWithheld: 0,
      provincialTaxWithheld: 0,
      cppPaid: 3867,
      eiPaid: 0,
    };

    const result = computeTaxesCA(profile);
    expect(result.cppTax).toBeGreaterThan(0);
    expect(result.totalIncome).toBe(82000);
  });
});
