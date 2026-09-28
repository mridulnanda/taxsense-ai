/**
 * Performance benchmarks for TaxSense AI
 * FY 2025-26 (AY 2026-27)
 *
 * Target: <100ms for typical profiles, <200ms for complex multi-head scenarios
 */
import { bench, describe } from "vitest";
import { computeBoth, computeRegime, emptyProfile } from "../src/lib/tax-engine";
import type { TaxProfile } from "../src/lib/tax-engine";

describe("tax engine performance", () => {
  bench("simple salaried: single income head", () => {
    const p: TaxProfile = {
      ...emptyProfile(),
      salary: {
        grossSalary: 1_200_000,
        basicPlusDA: 600_000,
        hraReceived: 0,
        rentPaid: 0,
        isMetroCity: false,
        employerNpsContribution: 0,
        professionalTax: 0,
      },
    };

    computeBoth(p);
  });

  bench("intermediate: salary + HRA + rental", () => {
    const p: TaxProfile = {
      ...emptyProfile(),
      salary: {
        grossSalary: 1_500_000,
        basicPlusDA: 750_000,
        hraReceived: 150_000,
        rentPaid: 180_000,
        isMetroCity: false,
        employerNpsContribution: 0,
        professionalTax: 2_000,
      },
      houseProperties: [
        { use: "let-out", annualRent: 300_000, municipalTaxes: 9_000, homeLoanInterest: 200_000 },
      ],
      deductions: {
        ...emptyProfile().deductions,
        section80C: 100_000,
        section80D_selfFamily: 15_000,
      },
    };

    computeBoth(p);
  });

  bench("complex: multi-head income with all deductions", () => {
    const p: TaxProfile = {
      ...emptyProfile(),
      age: 45,
      salary: {
        grossSalary: 2_500_000,
        basicPlusDA: 1_250_000,
        hraReceived: 300_000,
        rentPaid: 360_000,
        isMetroCity: true,
        employerNpsContribution: 100_000,
        professionalTax: 2_500,
      },
      houseProperties: [
        { use: "self-occupied", annualRent: 0, municipalTaxes: 0, homeLoanInterest: 400_000 },
        { use: "let-out", annualRent: 480_000, municipalTaxes: 15_000, homeLoanInterest: 300_000 },
      ],
      capitalGains: {
        stcg111A: 200_000,
        stcgOther: 0,
        ltcg112A: 500_000,
        ltcgOther: 0,
      },
      otherSources: {
        savingsInterest: 100_000,
        fdInterest: 50_000,
        dividends: 30_000,
        familyPension: 0,
        other: 20_000,
      },
      deductions: {
        section80C: 150_000,
        section80CCD1B: 50_000,
        section80D_selfFamily: 25_000,
        section80D_parents: 0,
        parentsAreSenior: false,
        section80E: 0,
        section80G: 50_000,
      },
    };

    computeBoth(p);
  });

  bench("regime computation: single regime (new)", () => {
    const p: TaxProfile = {
      ...emptyProfile(),
      salary: {
        grossSalary: 2_000_000,
        basicPlusDA: 1_000_000,
        hraReceived: 0,
        rentPaid: 0,
        isMetroCity: false,
        employerNpsContribution: 0,
        professionalTax: 0,
      },
    };

    computeRegime(p, "new");
  });

  bench("regime computation: single regime (old)", () => {
    const p: TaxProfile = {
      ...emptyProfile(),
      salary: {
        grossSalary: 2_000_000,
        basicPlusDA: 1_000_000,
        hraReceived: 200_000,
        rentPaid: 240_000,
        isMetroCity: true,
        employerNpsContribution: 0,
        professionalTax: 2_000,
      },
      houseProperties: [
        { use: "self-occupied", annualRent: 0, municipalTaxes: 0, homeLoanInterest: 250_000 },
      ],
      deductions: {
        ...emptyProfile().deductions,
        section80C: 150_000,
      },
    };

    computeRegime(p, "old");
  });

  bench("both regimes: comparison & recommendation", () => {
    const p: TaxProfile = {
      ...emptyProfile(),
      salary: {
        grossSalary: 2_000_000,
        basicPlusDA: 1_000_000,
        hraReceived: 200_000,
        rentPaid: 240_000,
        isMetroCity: true,
        employerNpsContribution: 0,
        professionalTax: 2_000,
      },
      houseProperties: [
        { use: "self-occupied", annualRent: 0, municipalTaxes: 0, homeLoanInterest: 250_000 },
      ],
      deductions: {
        ...emptyProfile().deductions,
        section80C: 150_000,
        section80D_selfFamily: 25_000,
      },
    };

    computeBoth(p);
  });

  bench("high earner: salary 1Cr+ with capital gains", () => {
    const p: TaxProfile = {
      ...emptyProfile(),
      salary: {
        grossSalary: 10_000_000,
        basicPlusDA: 5_000_000,
        hraReceived: 0,
        rentPaid: 0,
        isMetroCity: false,
        employerNpsContribution: 500_000,
        professionalTax: 0,
      },
      capitalGains: {
        stcg111A: 1_000_000,
        stcgOther: 500_000,
        ltcg112A: 2_000_000,
        ltcgOther: 1_000_000,
      },
      deductions: {
        ...emptyProfile().deductions,
        section80C: 150_000,
        section80CCD1B: 50_000,
      },
    };

    computeBoth(p);
  });
});
