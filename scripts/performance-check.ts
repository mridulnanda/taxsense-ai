/**
 * Simple performance check script for TaxSense AI tax engine
 * Measures computation time for various profile complexities
 */

import { computeBoth, emptyProfile } from "../src/lib/tax-engine";
import type { TaxProfile } from "../src/lib/tax-engine";

interface Benchmark {
  name: string;
  profile: TaxProfile;
}

const benchmarks: Benchmark[] = [
  {
    name: "Simple salaried (1 income head)",
    profile: {
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
    },
  },
  {
    name: "Intermediate (salary + HRA + rental)",
    profile: {
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
    },
  },
  {
    name: "Complex (multi-head with all deductions)",
    profile: {
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
    },
  },
  {
    name: "High earner (1Cr+ salary + capital gains)",
    profile: {
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
    },
  },
];

function measurePerformance(name: string, fn: () => void, iterations = 100): number {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();
  return (end - start) / iterations;
}

console.log("TaxSense AI Performance Benchmarks (FY 2025-26)\n");
console.log("Target: <100ms for typical profiles, <200ms for complex scenarios\n");

let allPass = true;

for (const { name, profile } of benchmarks) {
  const avgMs = measurePerformance(name, () => computeBoth(profile), 100);
  const status = avgMs < 100 ? "✓ PASS" : avgMs < 200 ? "⚠ WARN" : "✗ FAIL";
  console.log(`${status} ${name.padEnd(40)} ${avgMs.toFixed(2)}ms`);

  if (avgMs >= 200) allPass = false;
}

console.log();
if (allPass) {
  console.log("✓ All benchmarks within target (<200ms)");
  process.exit(0);
} else {
  console.log("⚠ Some benchmarks exceed 200ms target");
  process.exit(1);
}
