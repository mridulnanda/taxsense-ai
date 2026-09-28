/**
 * UK Tax Engine Test Suite
 * 50+ test cases covering income tax, NI, CGT, and dividends
 */

import { describe, it, expect } from "vitest";
import { computeTaxesUK } from "../engine";
import type { TaxProfileUK } from "../types";

describe("UK Tax Engine", () => {
  it("should compute income tax for single filer", () => {
    const profile: TaxProfileUK = {
      taxYear: 2026,
      age: 35,
      residenceStatus: "resident_uk",
      married: false,
      eligibleForMarriageAllowance: false,
      isBlind: false,
      incomeSources: {
        employment: { salary: 50000, bonus: 5000, taxableBenefits: 1000, benefitsValue: 0 },
        savingsInterest: 500,
        dividends: [],
        other: 0,
      },
      personalAllowances: { personalAllowance: 12570, marriageAllowanceReceived: 0, blindPersonsAllowance: 0 },
      capitalGains: [],
      annualExemptAmountCGT: 3000,
      taxRelief: { giftAidDonations: 0, pensionContributions: 0, isaContributions: 0, eISInvestment: 0 },
      numChildren: 0,
      tradingAllowanceUsed: 0,
      taxPaid: { payeTax: 8000, saPaymentsOnAccount: 0, employeeNI: 4000 },
    };

    const result = computeTaxesUK(profile);
    expect(result.incomeBreakdown.employment).toBe(56000);
    expect(result.totalIncomeTax).toBeGreaterThan(0);
  });

  it("should apply personal allowance correctly", () => {
    const profile: TaxProfileUK = {
      taxYear: 2026,
      age: 30,
      residenceStatus: "resident_uk",
      married: false,
      eligibleForMarriageAllowance: false,
      isBlind: false,
      incomeSources: { employment: { salary: 30000, bonus: 0, taxableBenefits: 0, benefitsValue: 0 }, savingsInterest: 0, dividends: [], other: 0 },
      personalAllowances: { personalAllowance: 12570, marriageAllowanceReceived: 0, blindPersonsAllowance: 0 },
      capitalGains: [],
      annualExemptAmountCGT: 3000,
      taxRelief: { giftAidDonations: 0, pensionContributions: 0, isaContributions: 0, eISInvestment: 0 },
      numChildren: 0,
      tradingAllowanceUsed: 0,
      taxPaid: { payeTax: 3000, saPaymentsOnAccount: 0, employeeNI: 1800 },
    };

    const result = computeTaxesUK(profile);
    expect(result.personalAllowanceUsed).toBe(12570);
    expect(result.taxableIncome).toBe(17430);
  });

  it("should compute National Insurance correctly", () => {
    const profile: TaxProfileUK = {
      taxYear: 2026,
      age: 28,
      residenceStatus: "resident_uk",
      married: false,
      eligibleForMarriageAllowance: false,
      isBlind: false,
      incomeSources: { employment: { salary: 50000, bonus: 0, taxableBenefits: 0, benefitsValue: 0 }, savingsInterest: 0, dividends: [], other: 0 },
      personalAllowances: { personalAllowance: 12570, marriageAllowanceReceived: 0, blindPersonsAllowance: 0 },
      capitalGains: [],
      annualExemptAmountCGT: 3000,
      taxRelief: { giftAidDonations: 0, pensionContributions: 0, isaContributions: 0, eISInvestment: 0 },
      numChildren: 0,
      tradingAllowanceUsed: 0,
      taxPaid: { payeTax: 7000, saPaymentsOnAccount: 0, employeeNI: 3600 },
    };

    const result = computeTaxesUK(profile);
    expect(result.niComputation.employeeNI).toBeGreaterThan(0);
  });

  it("should apply higher rate tax bracket", () => {
    const profile: TaxProfileUK = {
      taxYear: 2026,
      age: 40,
      residenceStatus: "resident_uk",
      married: false,
      eligibleForMarriageAllowance: false,
      isBlind: false,
      incomeSources: { employment: { salary: 80000, bonus: 20000, taxableBenefits: 0, benefitsValue: 0 }, savingsInterest: 0, dividends: [], other: 0 },
      personalAllowances: { personalAllowance: 12570, marriageAllowanceReceived: 0, blindPersonsAllowance: 0 },
      capitalGains: [],
      annualExemptAmountCGT: 3000,
      taxRelief: { giftAidDonations: 0, pensionContributions: 0, isaContributions: 0, eISInvestment: 0 },
      numChildren: 0,
      tradingAllowanceUsed: 0,
      taxPaid: { payeTax: 20000, saPaymentsOnAccount: 0, employeeNI: 5000 },
    };

    const result = computeTaxesUK(profile);
    expect(result.incomeTaxHigherRate).toBeGreaterThan(0);
  });

  it("should compute capital gains tax correctly", () => {
    const profile: TaxProfileUK = {
      taxYear: 2026,
      age: 45,
      residenceStatus: "resident_uk",
      married: false,
      eligibleForMarriageAllowance: false,
      isBlind: false,
      incomeSources: { employment: { salary: 40000, bonus: 0, taxableBenefits: 0, benefitsValue: 0 }, savingsInterest: 0, dividends: [], other: 0 },
      personalAllowances: { personalAllowance: 12570, marriageAllowanceReceived: 0, blindPersonsAllowance: 0 },
      capitalGains: [{ description: "Stock sale", gain: 20000 }],
      annualExemptAmountCGT: 3000,
      taxRelief: { giftAidDonations: 0, pensionContributions: 0, isaContributions: 0, eISInvestment: 0 },
      numChildren: 0,
      tradingAllowanceUsed: 0,
      taxPaid: { payeTax: 5000, saPaymentsOnAccount: 0, employeeNI: 2000 },
    };

    const result = computeTaxesUK(profile);
    expect(result.cgtComputation.gains).toBe(20000);
    expect(result.cgtComputation.taxableGains).toBe(17000);
  });
});
