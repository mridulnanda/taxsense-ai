/**
 * Singapore Tax Engine Test Suite
 */

import { describe, it, expect } from "vitest";
import { computeTaxesSG } from "../engine";
import type { TaxProfileSG } from "../types";

describe("Singapore Tax Engine", () => {
  it("should compute income tax for resident", () => {
    const profile: TaxProfileSG = {
      yearEnding: 2026,
      age: 35,
      residentStatus: "citizen",
      income: {
        employmentIncome: 80000,
        tradeIncome: 0,
        dividendIncome: 1000,
        interestIncome: 500,
        rentalIncome: 0,
        foreignIncome: 0,
      },
      cpfContribution: { employeeContribution: 6400, employerContribution: 6400, voluntaryContribution: 0 },
      charityDonations: 0,
      taxPaidDuringYear: 4000,
    };

    const result = computeTaxesSG(profile);
    expect(result.totalAssessableIncome).toBe(80000);
    expect(result.exemptIncome).toBe(1500);
    expect(result.taxAfterRelief).toBeGreaterThanOrEqual(0);
  });

  it("should exclude exempt income from tax", () => {
    const profile: TaxProfileSG = {
      yearEnding: 2026,
      age: 40,
      residentStatus: "permanent_resident",
      income: {
        employmentIncome: 60000,
        tradeIncome: 0,
        dividendIncome: 5000,
        interestIncome: 2000,
        rentalIncome: 0,
        foreignIncome: 0,
      },
      cpfContribution: { employeeContribution: 4800, employerContribution: 4800, voluntaryContribution: 0 },
      charityDonations: 0,
      taxPaidDuringYear: 3000,
    };

    const result = computeTaxesSG(profile);
    expect(result.exemptIncome).toBe(7000);
    expect(result.totalAssessableIncome).toBe(60000);
  });

  it("should handle rental income correctly", () => {
    const profile: TaxProfileSG = {
      yearEnding: 2026,
      age: 50,
      residentStatus: "citizen",
      income: {
        employmentIncome: 0,
        tradeIncome: 0,
        dividendIncome: 0,
        interestIncome: 0,
        rentalIncome: 24000,
        foreignIncome: 0,
      },
      cpfContribution: { employeeContribution: 0, employerContribution: 0, voluntaryContribution: 3000 },
      charityDonations: 1000,
      taxPaidDuringYear: 1500,
    };

    const result = computeTaxesSG(profile);
    expect(result.totalAssessableIncome).toBe(24000);
    expect(result.taxAfterRelief).toBeGreaterThanOrEqual(0);
  });

  it("should deduct CPF contributions from income", () => {
    const profile: TaxProfileSG = {
      yearEnding: 2026,
      age: 45,
      residentStatus: "citizen",
      income: {
        employmentIncome: 100000,
        tradeIncome: 0,
        dividendIncome: 0,
        interestIncome: 0,
        rentalIncome: 0,
        foreignIncome: 0,
      },
      cpfContribution: { employeeContribution: 8000, employerContribution: 8000, voluntaryContribution: 5000 },
      charityDonations: 0,
      taxPaidDuringYear: 5000,
    };

    const result = computeTaxesSG(profile);
    expect(result.deductibleCPF).toBe(13000); // 8000 + 5000, employee+employer
    expect(result.chargeableIncome).toBeLessThan(100000);
  });
});
