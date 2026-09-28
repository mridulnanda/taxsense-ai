# Tax Engine Implementation Template

## How to Build a New Country Tax Engine in 50 Hours

This template guides implementation of any country's tax engine for TaxSense Global. Each complete engine takes ~50-100 hours for one developer.

---

## Step 1: Research & Validation (8 hours)

### 1.1 Gather Statutory Information

**Primary Sources** (in priority order):
- [ ] Official government tax authority (IRS, HMRC, IRAS, ATO, etc.)
- [ ] Tax authority annual guides & publications
- [ ] Latest tax rates & thresholds (2024-2026)
- [ ] Form structures & filing requirements
- [ ] Compliance calendar (filing deadlines, payment dates)

**Useful Secondary Sources:**
- [ ] OECD tax database (tax rates comparison)
- [ ] Big 4 accounting firm tax guides (Deloitte, EY, KPMG, PwC)
- [ ] Tax software documentation (TaxTron, Wealthfront, etc.)
- [ ] Academic papers on tax systems

### 1.2 Build Constants Repository

Create a spreadsheet/document with ALL rates/brackets/thresholds:

```
Country: [NAME]
Tax Year: [YEAR]
Currency: [CODE]

Tax Brackets (Progressive)
- Single/Individual: [brackets table]
- Married: [brackets table]
- Other filing statuses: [brackets]

Standard Deductions
- Single: $X
- Married: $X
- Dependent: $X
- Age 65+: $X

Tax Credits
- Child Credit: $X
- Education Credit: $X
- [Others]

Dates & Deadlines
- Filing Deadline: [DATE]
- Tax Year: [PERIOD]
- Payment Due Dates: [DATES]

Capital Gains Rates
- Long-term: X%
- Short-term: X%
- Special: [categories]

GST/VAT
- Standard Rate: X%
- Reduced Rates: [categories]
- Exemptions: [categories]

Compliance Requirements
- Annual filing threshold: $X
- Quarterly estimated payments: [rules]
- Record retention: X years
```

### 1.3 Create Implementation Checklist

- [ ] Tax brackets confirmed against government source
- [ ] Rates validated for current year
- [ ] Deductions/credits listed completely
- [ ] Filing deadlines confirmed
- [ ] All income types identified
- [ ] Special rules documented (high earner phase-outs, etc.)

---

## Step 2: Type Definitions (6 hours)

### 2.1 Create `types.ts`

```typescript
/**
 * [COUNTRY_NAME] Tax Engine Types
 * Tax Year [YEAR]
 * Reference: [GOVERNMENT_SOURCE]
 */

import { z } from "zod";

// ===== Filing Status/Categories =====
export type FilingStatus = "single" | "married_jointly" | "head_of_household" | "[COUNTRY_SPECIFIC]";

// ===== Income Sources =====
export interface SalaryIncome {
  grossSalary: number;
  // Country-specific fields
}

export interface SelfEmploymentIncome {
  grossRevenue: number;
  businessExpenses: number;
  // Country-specific fields
}

// ... (all income types)

export interface TaxableIncomeSources {
  salary?: SalaryIncome;
  selfEmployment?: SelfEmploymentIncome;
  capitalGains?: Array<{ gain: number; holdingPeriod: "short_term" | "long_term" }>;
  dividends?: { domestic: number; foreign: number };
  interestIncome?: number;
  rentalIncome?: number;
  other?: number;
}

// ===== Deductions =====
export interface Deductions {
  standardDeduction?: number;
  itemizedDeductions?: {
    // Country-specific
  };
  aboveTheLineDeductions?: number;
}

// ===== Tax Profile (Main Input Type) =====
export interface TaxProfile {
  taxYear: number;
  filingStatus: FilingStatus;
  age: number;
  residentStatus: "resident" | "non_resident" | "citizen";
  // Core income & deduction fields
  incomeSources: TaxableIncomeSources;
  deductions: Deductions;
  taxCredits: Record<string, number>;
  // Optional country-specific fields
  [key: string]: unknown;
}

// ===== Result Types =====
export interface IncomeBreakdown {
  salary: number;
  selfEmployment: number;
  capitalGains: number;
  dividends: number;
  interest: number;
  rental: number;
  other: number;
  totalIncome: number;
}

export interface TaxComputationResult {
  profile: TaxProfile;
  // Detailed breakdowns
  incomeBreakdown: IncomeBreakdown;
  deductionBreakdown: Record<string, number>;
  taxableIncome: number;
  // Tax liability
  incomeTax: number;
  gstVat?: number;
  socialTaxes?: number;
  totalTaxLiability: number;
  // Results
  taxPaid: number;
  refundOrOwed: number; // + = refund, - = owed
  effectiveTaxRate: number;
  // Audit trail
  notes: string[];
}

// ===== Validation Schemas (Optional but recommended) =====
export const TaxProfileSchema = z.object({
  taxYear: z.number().min(2020).max(2030),
  filingStatus: z.enum(["single", "married_jointly", "head_of_household"]),
  age: z.number().min(0).max(150),
  // ... more validations
});

export type ValidatedTaxProfile = z.infer<typeof TaxProfileSchema>;
```

### 2.2 Verify Type Coverage

- [ ] All income sources covered
- [ ] All deductions/reliefs included
- [ ] All tax credits represented
- [ ] Filing status options complete
- [ ] Result structure comprehensive

---

## Step 3: Constants File (8 hours)

### 3.1 Create `constants.ts`

```typescript
/**
 * [COUNTRY] Tax Constants (Tax Year [YEAR])
 * Sources:
 *  - [GOVERNMENT_SOURCE]
 *  - [ALTERNATIVE_SOURCE]
 */

import type { FilingStatus } from "./types";

// ===== Tax Brackets (Progressive Income Tax) =====
export const TAX_BRACKETS: Record<FilingStatus, Array<[number, number, number]>> = {
  single: [
    [0, 50000, 0.10],
    [50000, 100000, 0.20],
    [100000, Infinity, 0.30],
  ],
  married_jointly: [
    [0, 100000, 0.10],
    [100000, 200000, 0.20],
    [200000, Infinity, 0.30],
  ],
  // ... other filing statuses
};

// ===== Standard Deductions =====
export const STANDARD_DEDUCTIONS: Record<FilingStatus, Record<string, number>> = {
  single: {
    base: 14600,
    age65Plus: 1850,
    blind: 1850,
  },
  married_jointly: {
    base: 29200,
    age65Plus: 2300,
    blind: 2300,
  },
  // ...
};

// ===== Tax Credits =====
export const TAX_CREDITS = {
  childCredit: {
    amount: 2000,
    phaseOutStart: 400000, // single threshold
    phaseOutRate: 50, // $1 reduction per $50 AGI over threshold
  },
  earnedIncomeCredit: {
    // ...
  },
  // ...
};

// ===== Capital Gains Rates =====
export const CAPITAL_GAINS_RATES = {
  longTerm: 0.15, // or bracket-based
  shortTerm: "ordinary", // taxed as regular income
  collectibles: 0.28,
  // ...
};

// ===== GST/VAT Rates =====
export const GST_RATES = {
  standard: 0.10,
  reduced: 0.05,
  exemptions: [
    "food",
    "medicine",
    // ...
  ],
};

// ===== Compliance Dates =====
export const COMPLIANCE_CALENDAR = {
  taxYear: "Jan 1 - Dec 31",
  filingDeadline: "Apr 15",
  estimatedQ1: "Apr 15",
  estimatedQ2: "Jun 15",
  estimatedQ3: "Sep 15",
  estimatedQ4: "Jan 15",
};

// ===== Other Thresholds =====
export const THRESHOLDS = {
  filingRequired: 15000, // income to trigger filing requirement
  capitalGainsInclusionRate: 0.5,
  // ...
};
```

### 3.2 Validation

- [ ] All brackets sum correctly
- [ ] No overlapping income ranges
- [ ] Rates match government sources exactly
- [ ] Dates confirmed (not estimated)
- [ ] Special rules noted (e.g., phase-out formulas)

---

## Step 4: Engine Implementation (20 hours)

### 4.1 Create `engine.ts`

Structure your implementation with these core functions:

```typescript
/**
 * [COUNTRY] Tax Engine
 * Computation functions for tax calculations
 */

import { calculateProgressiveTax, parseBrackets } from "@/lib/tax-engines/shared";
import type { TaxProfile, TaxComputationResult, IncomeBreakdown } from "./types";
import {
  TAX_BRACKETS,
  STANDARD_DEDUCTIONS,
  TAX_CREDITS,
  CAPITAL_GAINS_RATES,
} from "./constants";

// ===== Step 1: Aggregate Income =====
function computeIncomeBreakdown(profile: TaxProfile): IncomeBreakdown {
  // Sum all income sources
  return {
    salary: profile.incomeSources.salary?.grossSalary || 0,
    // ... other sources
    totalIncome: 0, // sum of all
  };
}

// ===== Step 2: Calculate Adjusted Gross Income (AGI) =====
function computeAGI(totalIncome: number, aboveTheLineDeductions: number): number {
  return Math.max(0, totalIncome - aboveTheLineDeductions);
}

// ===== Step 3: Compute Taxable Income =====
function computeTaxableIncome(
  agi: number,
  deductions: Record<string, number>,
  profile: TaxProfile
): number {
  let deductionAmount = deductions.standardDeduction || deductions.itemizedDeductions || 0;
  return Math.max(0, agi - deductionAmount);
}

// ===== Step 4: Calculate Income Tax =====
function computeIncomeTax(
  taxableIncome: number,
  filingStatus: FilingStatus
): { tax: number; breakdown: string[] } {
  const brackets = parseBrackets(TAX_BRACKETS[filingStatus]);
  const result = calculateProgressiveTax(taxableIncome, brackets);
  return {
    tax: result.tax,
    breakdown: result.breakdown.map((b) => `${b.bracket.rate * 100}%: $${b.taxInBracket}`),
  };
}

// ===== Step 5: Apply Tax Credits =====
function applyTaxCredits(tax: number, credits: Record<string, number>): number {
  let totalCredits = 0;
  for (const [key, amount] of Object.entries(credits)) {
    // Apply phase-out rules if applicable
    totalCredits += amount;
  }
  return Math.max(0, tax - totalCredits);
}

// ===== Main Orchestrator =====
export function computeTaxes(profile: TaxProfile): TaxComputationResult {
  // 1. Income breakdown
  const incomeBreakdown = computeIncomeBreakdown(profile);

  // 2. AGI
  const agi = computeAGI(
    incomeBreakdown.totalIncome,
    profile.deductions?.aboveTheLineDeductions || 0
  );

  // 3. Taxable income
  const taxableIncome = computeTaxableIncome(
    agi,
    {
      standardDeduction: STANDARD_DEDUCTIONS[profile.filingStatus].base,
      itemizedDeductions: profile.deductions?.itemizedDeductions,
    },
    profile
  );

  // 4. Income tax
  const { tax: incomeTax } = computeIncomeTax(taxableIncome, profile.filingStatus);

  // 5. Tax credits
  const taxAfterCredits = applyTaxCredits(incomeTax, profile.taxCredits);

  // 6. Other taxes (GST, payroll, etc.)
  const gstVat = computeGST(profile); // implement as needed
  const socialTaxes = computeSocialTaxes(profile); // implement as needed

  // 7. Total
  const totalTaxLiability = taxAfterCredits + (gstVat || 0) + (socialTaxes || 0);

  // 8. Refund/Owed
  const taxPaid = profile.taxPaid || 0; // from withholdings, estimated payments
  const refundOrOwed = taxPaid - totalTaxLiability;

  return {
    profile,
    incomeBreakdown,
    deductionBreakdown: {},
    taxableIncome,
    incomeTax: taxAfterCredits,
    gstVat,
    socialTaxes,
    totalTaxLiability,
    taxPaid,
    refundOrOwed,
    effectiveTaxRate: incomeBreakdown.totalIncome > 0 ? totalTaxLiability / incomeBreakdown.totalIncome : 0,
    notes: ["[Implementation notes]"],
  };
}
```

### 4.2 Implementation Checklist

- [ ] All income sources aggregated
- [ ] AGI calculated correctly
- [ ] Deduction logic implemented
- [ ] Tax brackets applied properly
- [ ] Tax credits computed with phase-outs
- [ ] Special income treatments (capital gains, dividends)
- [ ] Other taxes included (GST, payroll)
- [ ] Result object complete
- [ ] Edge cases handled (zero income, high earners, negative items)

---

## Step 5: Public API (2 hours)

### 5.1 Create `index.ts`

```typescript
/**
 * [COUNTRY] Tax Engine — Public API
 */

export { computeTaxes as computeTaxes[COUNTRY_CODE] } from "./engine";

export type {
  FilingStatus,
  TaxProfile,
  TaxComputationResult,
  IncomeBreakdown,
} from "./types";

// Optional: Export validation schema
export { TaxProfileSchema } from "./types";
```

---

## Step 6: Comprehensive Testing (20 hours)

### 6.1 Create `__tests__/[country].test.ts`

Build 50+ test cases covering:

```typescript
/**
 * [COUNTRY] Tax Engine — 50+ Test Cases
 */

import { describe, it, expect } from "vitest";
import { computeTaxes[COUNTRY] } from "../engine";
import type { TaxProfile } from "../types";

describe("[COUNTRY] Tax Engine", () => {
  // ===== Basic Income Scenarios =====
  it("should compute tax on salary income", () => {
    const profile: TaxProfile = {
      // ... minimal profile
      incomeSources: { salary: { grossSalary: 50000 } },
    };
    const result = computeTaxes[COUNTRY](profile);
    expect(result.incomeTax).toBeCloseTo(7500); // Adjust for actual rate
  });

  it("should handle zero income", () => {
    const profile: TaxProfile = {
      // ... profile
      incomeSources: {},
    };
    const result = computeTaxes[COUNTRY](profile);
    expect(result.totalTaxLiability).toBe(0);
  });

  // ===== Multiple Income Sources =====
  it("should aggregate multiple income sources", () => {
    // salary + self-employment + dividends
  });

  // ===== Deductions =====
  it("should apply standard deduction", () => {
    // Test standard vs itemized
  });

  it("should respect deduction caps/phase-outs", () => {
    // Test AGI-based limitations
  });

  // ===== Tax Brackets =====
  it("should apply correct marginal rate", () => {
    // Test income at bracket boundaries
  });

  // ===== Capital Gains =====
  it("should apply preferential long-term capital gains rates", () => {
    // Long-term vs short-term
  });

  // ===== Tax Credits =====
  it("should apply tax credits with phase-out rules", () => {
    // Credits that reduce as AGI increases
  });

  // ===== Special Cases =====
  it("should handle high-earner phase-outs", () => {
    // Income thresholds triggering special rules
  });

  it("should handle multiple filing statuses", () => {
    // Single, married, head of household, etc.
  });

  it("should handle age-based adjustments", () => {
    // 65+, disabled, etc.
  });

  // ===== Edge Cases =====
  it("should handle negative income (losses)", () => {
    // Loss carryforward, negative AGI
  });

  it("should compute correct effective tax rate", () => {
    // totalTax / totalIncome
  });

  // ===== Performance =====
  it("should compute within 100ms", () => {
    // Benchmark test
  });
});
```

### 6.2 Test Coverage Targets

- [ ] 50+ test cases total
- [ ] All income types tested
- [ ] All deductions tested
- [ ] All credits tested
- [ ] Edge cases covered
- [ ] Filing status variations
- [ ] Age/residence variations
- [ ] Performance verified
- [ ] Cross-checked with government calculator
- [ ] All tests passing

---

## Step 7: Documentation (4 hours)

### 7.1 Add to Country README

Update `src/lib/tax-engines/README.md` with:

```markdown
## [COUNTRY] Tax Engine

### Features
- Progressive income tax brackets
- [Specific features of this country]
- GST/VAT handling
- Social security contributions
- 50+ test cases

### Usage
\`\`\`typescript
import { computeTaxes[COUNTRY] } from "@/lib/tax-engines/[country_code]";
import type { TaxProfile } from "@/lib/tax-engines/[country_code]";

const profile: TaxProfile = {
  // ... profile data
};

const result = computeTaxes[COUNTRY](profile);
console.log(result.totalTaxLiability);
\`\`\`

### Statutory References
- [Primary legislation reference]
- [Tax authority guide]
- [Other authorities]

### Tax Year
[Year] (filed in [Year+1])

### Test Coverage
- Basic income computation
- Multiple income sources
- Deduction limits & caps
- Tax bracket calculations
- Special rates (capital gains, dividends)
- Credits & offsets
- Edge cases
- 50+ test cases total
```

### 7.2 Statute References

Document all primary sources:

```
## Statutory References

### Primary Legislation
- [Full Act Name], [Year], ss. [Section Numbers]
- URL: [Link to legislation]

### Tax Authority Guidance
- [Authority Name] Bulletin/Guide [Number]
- URL: [Link]

### Recent Amendments
- Amendment [Name], [Year]
- Effective Date: [Date]
- Impact: [Brief description]

### Useful Resources
- [Official calculator link]
- [CPA association guide]
- [Academic source]
```

---

## Step 8: Integration & Validation (2 hours)

### 8.1 Update Master Export

Edit `src/lib/tax-engines/index.ts`:

```typescript
export { computeTaxes[COUNTRY_CODE] } from "./[country_code]";
export type { TaxProfile[COUNTRY_CODE], TaxComputationResult[COUNTRY_CODE] } from "./[country_code]";
```

### 8.2 Cross-Validation

- [ ] Run all tests: `npm test src/lib/tax-engines/[country_code]/__tests__`
- [ ] Verify against government calculator with 5+ scenarios
- [ ] Check against CPA/accountant resources
- [ ] Performance benchmark: `npm run bench`
- [ ] TypeScript strict mode: `npm run typecheck`

---

## Estimated Timeline

| Step | Hours | Cumulative |
|------|-------|-----------|
| 1. Research | 8 | 8 |
| 2. Types | 6 | 14 |
| 3. Constants | 8 | 22 |
| 4. Engine | 20 | 42 |
| 5. API | 2 | 44 |
| 6. Testing | 20 | 64 |
| 7. Documentation | 4 | 68 |
| 8. Integration | 2 | 70 |

**Total: ~70 hours per country**

For 50 countries:
- 1 developer: 350 work weeks = 6.7 years
- **5 developers (parallel):** 1.3 years to complete all 50

---

## Example: Quick Start With Existing Engine

Use the **US engine** as your template:
- `/src/lib/tax-engines/us/types.ts` — Type structure to copy
- `/src/lib/tax-engines/us/constants.ts` — Constants pattern to follow
- `/src/lib/tax-engines/us/engine.ts` — Engine structure
- `/src/lib/tax-engines/us/__tests__/us.test.ts` — Test patterns

Copy, adapt, and customize for your target country.

---

## Quality Gate Checklist

Before submitting a new country engine:

- [ ] All 50+ tests passing
- [ ] TypeScript strict mode (no `any`, no errors)
- [ ] Performance verified <100ms
- [ ] Cross-checked with government calculator
- [ ] Statute references cited
- [ ] Documentation complete
- [ ] JSDoc comments on all functions
- [ ] README updated
- [ ] Integrated into main export
- [ ] Ready for production

---

**Document Version:** 1.0  
**Created:** September 28, 2026  
**Template for:** TaxSense Global 50-Country Expansion
