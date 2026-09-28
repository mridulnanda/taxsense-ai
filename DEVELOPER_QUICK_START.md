# Developer Quick Start: Building a Global Tax Engine

**For:** Engineers implementing new country tax engines  
**Duration:** ~70 hours per country (~2 weeks full-time)  
**Difficulty:** Medium (with template)

---

## Pre-Start Checklist

Before you begin, ensure:

- [ ] You have access to the TaxSense Global repository
- [ ] Node.js 18+ and npm installed
- [ ] TypeScript 5.5+ configured
- [ ] Vitest installed and working
- [ ] Target country's tax authority website reviewed
- [ ] 2024-2026 tax rates & brackets documented
- [ ] Google Drive link with research materials ready

---

## 5-Minute Setup

### 1. Clone the Repository (if needed)
```bash
git clone <repo>
cd taxsense-ai
npm install
```

### 2. Review Existing Implementation (Choose Your Template)

**Best Template to Copy From:**
```bash
# For most countries, copy the US engine as a starting point
cp -r src/lib/tax-engines/us src/lib/tax-engines/[country_code]

# For EU countries, copy UK engine
cp -r src/lib/tax-engines/uk src/lib/tax-engines/[country_code]

# For Asia-Pacific, copy Singapore engine
cp -r src/lib/tax-engines/sg src/lib/tax-engines/[country_code]
```

### 3. Explore Shared Utilities

```bash
# Review these before coding
ls -la src/lib/tax-engines/shared/
cat src/lib/tax-engines/shared/index.ts
```

**Key Utilities You'll Use:**
- `calculateProgressiveTax()` — For income tax brackets
- `applyAGIPhaseout()` — For tax credit reductions
- `aggregateCapitalGains()` — For gain/loss handling

---

## Implementation Workflow (Week 1-2)

### **Day 1: Research & Planning (6-8 hours)**

```bash
# Create your implementation directory
mkdir -p src/lib/tax-engines/[country_code]/__tests__

# Create these files (start empty)
touch src/lib/tax-engines/[country_code]/types.ts
touch src/lib/tax-engines/[country_code]/constants.ts
touch src/lib/tax-engines/[country_code]/engine.ts
touch src/lib/tax-engines/[country_code]/index.ts
touch src/lib/tax-engines/[country_code]/__tests__/[country].test.ts
```

**Deliverable:** Complete research spreadsheet with ALL rates/brackets

**Key Questions to Answer:**
- [ ] What's the tax year format? (Jan-Dec, Fiscal year, etc.)
- [ ] What are ALL tax brackets & rates (2024, 2025, 2026)?
- [ ] What are standard deductions/allowances?
- [ ] What income types exist in this country?
- [ ] What's the filing deadline?
- [ ] Are there state/regional taxes?
- [ ] How are capital gains taxed?
- [ ] Is there VAT/GST and at what rates?

---

### **Day 2: Type Definitions (4-6 hours)**

**Open:** `src/lib/tax-engines/[country_code]/types.ts`

```typescript
/**
 * [COUNTRY] Tax Engine Types
 * Tax Year [YEAR]
 * Reference: [AUTHORITY] — [URL]
 */

import { z } from "zod";

// 1. Define filing statuses
export type FilingStatus = "single" | "married_jointly" | "[COUNTRY_SPECIFIC]";

// 2. Define income types
export interface EmploymentIncome {
  salary: number;
  bonus?: number;
  taxableBenefits?: number;
}

export interface SelfEmploymentIncome {
  grossRevenue: number;
  businessExpenses: number;
  netProfit?: number; // computed = grossRevenue - businessExpenses
}

// 3. Define all income sources
export interface TaxableIncomeSources {
  employment?: EmploymentIncome[];
  selfEmployment?: SelfEmploymentIncome[];
  capitalGains?: Array<{ gain: number; holdingPeriod: "short_term" | "long_term" }>;
  dividends?: { amount: number };
  rentalIncome?: number;
  interestIncome?: number;
  other?: number;
}

// 4. Define deductions
export interface Deductions {
  standardDeduction?: number;
  itemizedDeductions?: Record<string, number>;
  personalAllowances?: number;
  dependentAllowances?: number;
}

// 5. Main tax profile
export interface TaxProfile {
  taxYear: number;
  filingStatus: FilingStatus;
  age: number;
  residenceStatus: "resident" | "non_resident";
  incomeSources: TaxableIncomeSources;
  deductions: Deductions;
  taxCredits: Record<string, number>;
  taxesPaid?: number;
}

// 6. Result types
export interface IncomeBreakdown {
  employment: number;
  selfEmployment: number;
  capitalGains: number;
  dividends: number;
  rental: number;
  interest: number;
  other: number;
  total: number;
}

export interface TaxComputationResult {
  profile: TaxProfile;
  incomeBreakdown: IncomeBreakdown;
  deductionBreakdown: Record<string, number>;
  taxableIncome: number;
  incomeTax: number;
  gstVat?: number;
  socialTaxes?: number;
  totalTaxLiability: number;
  taxPaid: number;
  refundOrOwed: number; // + = refund, - = owed
  effectiveTaxRate: number;
  notes: string[];
}

// 7. Validation (optional but recommended)
export const TaxProfileSchema = z.object({
  taxYear: z.number().min(2020).max(2030),
  filingStatus: z.enum(["single", "married_jointly"]),
  age: z.number().min(0).max(150),
  residenceStatus: z.enum(["resident", "non_resident"]),
  incomeSources: z.object({
    employment: z.array(z.object({
      salary: z.number().nonnegative(),
      bonus: z.number().nonnegative().optional(),
    })).optional(),
    // ... more
  }),
  deductions: z.object({
    standardDeduction: z.number().nonnegative().optional(),
    // ... more
  }),
  taxCredits: z.record(z.number().nonnegative()).optional().default({}),
  taxesPaid: z.number().nonnegative().optional().default(0),
});

export type ValidatedTaxProfile = z.infer<typeof TaxProfileSchema>;
```

**Check:**
- [ ] All income sources represented
- [ ] All filing statuses defined
- [ ] All deductions/allowances included
- [ ] Result structure complete
- [ ] Types compile without errors

---

### **Day 2-3: Constants (8-10 hours)**

**Open:** `src/lib/tax-engines/[country_code]/constants.ts`

```typescript
/**
 * [COUNTRY] Tax Constants (2026 Tax Year)
 * Sources:
 *  - [GOVERNMENT_TAX_AUTHORITY_URL]
 *  - [ALTERNATIVE_SOURCE]
 */

import type { FilingStatus } from "./types";

// ===== TAX BRACKETS =====
// Format: [minIncome, maxIncome, rate]
export const TAX_BRACKETS: Record<FilingStatus, Array<[number, number, number]>> = {
  single: [
    [0, 50000, 0.10],          // First $50k at 10%
    [50000, 100000, 0.20],     // Next $50k at 20%
    [100000, Infinity, 0.30],  // Over $100k at 30%
  ],
  married_jointly: [
    [0, 100000, 0.10],
    [100000, 200000, 0.20],
    [200000, Infinity, 0.30],
  ],
};

// ===== STANDARD DEDUCTIONS =====
export const STANDARD_DEDUCTIONS: Record<FilingStatus, Record<string, number>> = {
  single: {
    base: 14000,
    age65Plus: 1800,
    blind: 1800,
  },
  married_jointly: {
    base: 28000,
    age65Plus: 2300,
    blind: 2300,
  },
};

// ===== TAX CREDITS =====
export const TAX_CREDITS = {
  child: {
    amount: 2000,
    phaseOutStart: 400000,
    phaseOutIncrement: 50, // $1 reduction per $50 AGI over start
  },
  educationCredit: {
    amount: 2500,
    phaseOutStart: 150000,
    phaseOutIncrement: 25,
  },
};

// ===== SPECIAL RATES =====
export const CAPITAL_GAINS_RATES = {
  shortTerm: "ordinary",        // Taxed as regular income
  longTerm: 0.15,               // 15% rate
  collectibles: 0.28,           // 28% (if applicable)
};

export const GST_RATES = {
  standard: 0.10,
  reduced: 0.05,
  zero: 0.0,
};

// ===== THRESHOLDS & DATES =====
export const THRESHOLDS = {
  filingRequired: 12500,        // Annual income threshold
  capitalGainsInclusion: 0.5,   // 50% of gains included
};

export const COMPLIANCE_DATES = {
  taxYearStart: "2026-01-01",
  taxYearEnd: "2026-12-31",
  filingDeadline: "2027-04-15",
  estimatedQ1: "2027-04-15",
  estimatedQ2: "2027-06-15",
  estimatedQ3: "2027-09-15",
  estimatedQ4: "2028-01-15",
};
```

**Verify Against Government Source:**
- [ ] Each bracket matches official rates
- [ ] Standard deductions are current-year
- [ ] Credit amounts are accurate
- [ ] Compliance dates confirmed (not estimated)
- [ ] No typos in large numbers

---

### **Day 3-5: Engine Implementation (20-25 hours)**

**Open:** `src/lib/tax-engines/[country_code]/engine.ts`

Start with this skeleton and fill in each function:

```typescript
/**
 * [COUNTRY] Tax Engine
 * Computation functions (pure functions, no side effects)
 */

import { calculateProgressiveTax, parseBrackets } from "@/lib/tax-engines/shared";
import type { TaxProfile, TaxComputationResult, IncomeBreakdown } from "./types";
import {
  TAX_BRACKETS,
  STANDARD_DEDUCTIONS,
  TAX_CREDITS,
  CAPITAL_GAINS_RATES,
} from "./constants";

// ========== STEP 1: AGGREGATE INCOME ==========

function computeIncomeBreakdown(profile: TaxProfile): IncomeBreakdown {
  const { incomeSources } = profile;
  
  const employment = (incomeSources.employment || []).reduce(
    (sum, item) => sum + (item.salary || 0),
    0
  );
  
  const selfEmployment = (incomeSources.selfEmployment || []).reduce(
    (sum, item) => sum + Math.max(0, item.grossRevenue - item.businessExpenses),
    0
  );
  
  // ... other income types
  
  return {
    employment,
    selfEmployment,
    capitalGains: 0,  // TODO: implement
    dividends: 0,     // TODO: implement
    rental: incomeSources.rentalIncome || 0,
    interest: incomeSources.interestIncome || 0,
    other: incomeSources.other || 0,
    total: employment + selfEmployment + (incomeSources.rentalIncome || 0) + ...,
  };
}

// ========== STEP 2: COMPUTE AGI ==========

function computeAGI(totalIncome: number, aboveTheLineDeductions: number): number {
  return Math.max(0, totalIncome - aboveTheLineDeductions);
}

// ========== STEP 3: COMPUTE TAXABLE INCOME ==========

function computeTaxableIncome(
  agi: number,
  filingStatus: FilingStatus,
  itemizedDeductions?: Record<string, number>
): number {
  const standardDeduction = STANDARD_DEDUCTIONS[filingStatus].base;
  let deduction = standardDeduction;
  
  // If itemized > standard, use itemized
  if (itemizedDeductions) {
    const itemizedTotal = Object.values(itemizedDeductions).reduce((a, b) => a + b, 0);
    deduction = Math.max(deduction, itemizedTotal);
  }
  
  return Math.max(0, agi - deduction);
}

// ========== STEP 4: COMPUTE INCOME TAX ==========

function computeIncomeTax(
  taxableIncome: number,
  filingStatus: FilingStatus
): { tax: number; breakdown: string[] } {
  const brackets = parseBrackets(TAX_BRACKETS[filingStatus]);
  const result = calculateProgressiveTax(taxableIncome, brackets);
  
  return {
    tax: result.tax,
    breakdown: [
      `Taxable Income: $${taxableIncome.toLocaleString()}`,
      `Marginal Rate: ${(result.marginalRate * 100).toFixed(0)}%`,
      `Effective Rate: ${(result.effectiveRate * 100).toFixed(2)}%`,
    ],
  };
}

// ========== STEP 5: APPLY TAX CREDITS ==========

function applyTaxCredits(
  tax: number,
  credits: Record<string, number>,
  agi: number
): number {
  let totalCredits = 0;
  
  // Example: Child credit with phase-out
  if (credits.child) {
    const childCredit = TAX_CREDITS.child;
    let creditAmount = credits.child * childCredit.amount;
    
    // Apply phase-out if AGI exceeds threshold
    if (agi > childCredit.phaseOutStart) {
      const excess = agi - childCredit.phaseOutStart;
      const reduction = Math.ceil(excess / childCredit.phaseOutIncrement);
      creditAmount = Math.max(0, creditAmount - reduction);
    }
    
    totalCredits += creditAmount;
  }
  
  // ... other credits
  
  return Math.max(0, tax - totalCredits);
}

// ========== MAIN ORCHESTRATOR ==========

export function computeTaxes(profile: TaxProfile): TaxComputationResult {
  const notes: string[] = [];
  
  // 1. Income aggregation
  const incomeBreakdown = computeIncomeBreakdown(profile);
  notes.push(`Total Income: $${incomeBreakdown.total.toLocaleString()}`);
  
  // 2. AGI calculation
  const agi = computeAGI(incomeBreakdown.total, 0); // TODO: add above-the-line deductions
  notes.push(`AGI: $${agi.toLocaleString()}`);
  
  // 3. Taxable income
  const taxableIncome = computeTaxableIncome(
    agi,
    profile.filingStatus,
    profile.deductions.itemizedDeductions
  );
  notes.push(`Taxable Income: $${taxableIncome.toLocaleString()}`);
  
  // 4. Income tax
  const { tax: incomeTaxBeforeCredits } = computeIncomeTax(taxableIncome, profile.filingStatus);
  
  // 5. Apply credits
  const incomeTaxAfterCredits = applyTaxCredits(incomeTaxBeforeCredits, profile.taxCredits, agi);
  
  // 6. Other taxes (GST, payroll, etc.)
  const gstVat = 0; // TODO: implement GST/VAT if applicable
  const socialTaxes = 0; // TODO: implement social security/payroll taxes
  
  // 7. Total
  const totalTaxLiability = incomeTaxAfterCredits + gstVat + socialTaxes;
  
  // 8. Refund/Owed
  const taxPaid = profile.taxesPaid || 0;
  const refundOrOwed = taxPaid - totalTaxLiability;
  
  return {
    profile,
    incomeBreakdown,
    deductionBreakdown: {},
    taxableIncome,
    incomeTax: incomeTaxAfterCredits,
    gstVat,
    socialTaxes,
    totalTaxLiability,
    taxPaid,
    refundOrOwed,
    effectiveTaxRate: incomeBreakdown.total > 0 ? totalTaxLiability / incomeBreakdown.total : 0,
    notes,
  };
}
```

**Build Strategy:**
1. Start simple (just the core income + standard deduction + tax calculation)
2. Test locally
3. Add each feature one by one (credits, special income types, etc.)
4. Run tests after each feature

---

### **Day 5: Public API (1 hour)**

**Open:** `src/lib/tax-engines/[country_code]/index.ts`

```typescript
/**
 * [COUNTRY] Tax Engine — Public API
 */

export { computeTaxes as computeTaxes[CC] } from "./engine";

export type {
  FilingStatus,
  TaxProfile,
  TaxComputationResult,
  IncomeBreakdown,
  Deductions,
  TaxableIncomeSources,
} from "./types";

// Optional: Export validation if using Zod
export { TaxProfileSchema, type ValidatedTaxProfile } from "./types";
```

---

### **Day 6-7: Testing (15-20 hours)**

**Open:** `src/lib/tax-engines/[country_code]/__tests__/[country].test.ts`

```typescript
/**
 * [COUNTRY] Tax Engine — Test Suite
 * 50+ Test Cases covering all scenarios
 */

import { describe, it, expect } from "vitest";
import { computeTaxes } from "../engine";
import type { TaxProfile } from "../types";

describe("[COUNTRY] Tax Engine", () => {
  // ===== BASIC SCENARIOS =====
  
  it("should compute tax on salary income", () => {
    const profile: TaxProfile = {
      taxYear: 2026,
      filingStatus: "single",
      age: 35,
      residenceStatus: "resident",
      incomeSources: {
        employment: [{ salary: 50000 }],
      },
      deductions: {
        standardDeduction: 14000,
      },
      taxCredits: {},
    };
    
    const result = computeTaxes(profile);
    
    expect(result.incomeBreakdown.total).toBe(50000);
    expect(result.taxableIncome).toBe(36000); // 50k - 14k standard
    expect(result.totalTaxLiability).toBeGreaterThan(0);
    expect(result.effectiveTaxRate).toBeCloseTo(0.12, 1); // ~12%
  });
  
  it("should handle zero income", () => {
    const profile: TaxProfile = {
      // ... minimal profile
      incomeSources: {},
      deductions: {},
      taxCredits: {},
    };
    
    const result = computeTaxes(profile);
    expect(result.totalTaxLiability).toBe(0);
  });
  
  it("should aggregate multiple income sources", () => {
    const profile: TaxProfile = {
      // ... profile with:
      // - Salary: $50,000
      // - Rental: $10,000
      // - Interest: $1,000
    };
    
    const result = computeTaxes(profile);
    expect(result.incomeBreakdown.total).toBe(61000);
  });
  
  it("should apply standard deduction correctly", () => {
    const profile: TaxProfile = {
      // ... profile with $30k income
    };
    
    const result = computeTaxes(profile);
    expect(result.taxableIncome).toBeLessThan(30000);
  });
  
  // ===== TAX BRACKET TESTS =====
  
  it("should apply correct marginal rate", () => {
    // Test income at various bracket boundaries
  });
  
  it("should handle income straddling tax brackets", () => {
    // Test income exactly between brackets
  });
  
  // ===== CAPITAL GAINS TESTS =====
  
  it("should apply preferential long-term capital gains rate", () => {
    // Test LTCG at 15% vs ordinary income
  });
  
  it("should handle short-term capital gains as ordinary income", () => {
    // Test STCG taxed at ordinary rates
  });
  
  // ===== CREDIT TESTS =====
  
  it("should apply child tax credit", () => {
    // Test CTC calculation and phase-out
  });
  
  it("should apply credit phase-out above threshold", () => {
    // Test credit reduction with AGI
  });
  
  // ===== EDGE CASES =====
  
  it("should handle negative income (losses)", () => {
    // Test loss carryforward
  });
  
  it("should handle high-earner adjustments", () => {
    // Test income above threshold triggering special rules
  });
  
  it("should handle different filing statuses", () => {
    // Test single, MFJ, etc.
  });
  
  // ===== PERFORMANCE =====
  
  it("should compute tax in under 100ms", () => {
    const start = performance.now();
    // Run computation
    const end = performance.now();
    expect(end - start).toBeLessThan(100);
  });
});
```

**Test Coverage Checklist:**
- [ ] 50+ total test cases
- [ ] All income types covered
- [ ] All deductions tested
- [ ] All credits tested
- [ ] Tax bracket boundaries
- [ ] Edge cases (zero income, negative, high earners)
- [ ] Filing status variations
- [ ] Age/residence variations
- [ ] Performance verified

**Run Tests:**
```bash
npm test src/lib/tax-engines/[country_code]/__tests__
```

---

### **Day 7: Integration & Validation (2 hours)**

#### Update Master Export

**Open:** `src/lib/tax-engines/index.ts`

Add your country's export:
```typescript
export { computeTaxes[CC] } from "./[country_code]";
export type { TaxProfile[CC], TaxComputationResult[CC] } from "./[country_code]";
```

#### Final Checks

```bash
# 1. Type check (strict mode)
npm run typecheck

# 2. Run all tests
npm test

# 3. Lint & format
npm run lint --fix
npm run format

# 4. Build
npm run build

# 5. Verify against government calculator
# (Manual: check 5+ scenarios with official calculator)
```

---

## Key Files to Reference

### Templates to Copy
```bash
# Best all-around template
src/lib/tax-engines/us/

# Best for complex deductions
src/lib/tax-engines/uk/

# Best for simple systems
src/lib/tax-engines/sg/
```

### Documentation to Read
```bash
# Before you start
COUNTRY_IMPLEMENTATION_TEMPLATE.md
GLOBAL_TAX_ENGINE_ARCHITECTURE.md

# Mid-implementation
GLOBAL_TAX_ENGINE_50_COUNTRY_ROADMAP.md

# Reference while building
src/lib/tax-engines/README.md
src/lib/tax-engines/shared/index.ts
```

---

## Useful Commands

```bash
# Run tests for your country only
npm test src/lib/tax-engines/[country]

# Run tests with coverage
npm test -- --coverage

# Watch mode (runs on file change)
npm run test:watch

# Type check only
npm run typecheck

# Format code
npm run format

# Build for production
npm run build
```

---

## Common Patterns

### Pattern 1: Apply Progressive Tax

```typescript
import { calculateProgressiveTax, parseBrackets } from "@/lib/tax-engines/shared";

const brackets = parseBrackets(TAX_BRACKETS[filingStatus]);
const result = calculateProgressiveTax(taxableIncome, brackets);
// result.tax, result.effectiveRate, result.breakdown
```

### Pattern 2: Apply Deduction Limits

```typescript
import { applyAGIPhaseout } from "@/lib/tax-engines/shared";

const deduction = applyAGIPhaseout(
  claimed: 5000,
  agi: 450000,
  phaseOutStart: 400000,
  phaseOutEnd: 500000,
  phaseOutIncrement: 50
);
// deduction.allowed, deduction.disallowed, deduction.notes
```

### Pattern 3: Aggregate Capital Gains

```typescript
import { aggregateCapitalGains } from "@/lib/tax-engines/shared";

const summary = aggregateCapitalGains(transactions);
// summary.shortTermNet, summary.longTermNet, summary.totalNet
```

---

## Troubleshooting

### Test Fails: "Expected X, got Y"
**Solution:** Cross-check against government calculator:
1. Use exact same income/deductions as your test
2. Get result from official calculator
3. Adjust engine code to match official result
4. Update test expected value

### TypeScript Error: "Unknown type..."
**Solution:**
```bash
npm run typecheck  # See exact errors
# Fix by importing type correctly
import type { FilingStatus } from "./types";
```

### Performance Test Fails: ">100ms"
**Solution:**
1. Profile with `console.time()`
2. Remove unnecessary loops
3. Cache computed values
4. Use `useMemo` in React components calling this

### Test Coverage Below 95%
**Solution:**
1. `npm test -- --coverage` to see which lines uncovered
2. Add test cases for uncovered code paths
3. Ensure all branches tested (if/else, etc.)

---

## When Stuck

### Debug Strategy

```typescript
// Add logging to see intermediate values
function computeIncomeTax(...) {
  console.log("Step 1 - Taxable income:", taxableIncome);
  console.log("Step 2 - Applying brackets:", brackets);
  const result = calculateProgressiveTax(taxableIncome, brackets);
  console.log("Step 3 - Tax calculation:", result);
  return result.tax;
}
```

### Cross-Validation

Always test against 3 sources:
1. Government's online calculator
2. Tax software (TurboTax, TaxTron, etc.)
3. CPA/tax professional resource

If your result doesn't match, your code is likely wrong. Fix it.

### Ask for Help

If stuck >1 hour:
1. Comment out the problematic function
2. Open an issue with:
   - Country code
   - Test case
   - Expected vs actual
   - Government calculator screenshot

---

## Estimated Timeline

| Task | Hours | Days |
|------|-------|------|
| Research | 8 | 1 |
| Types | 6 | 1 |
| Constants | 8 | 1 |
| Engine | 20 | 2.5 |
| API | 2 | 0.5 |
| Testing | 20 | 2.5 |
| Documentation | 4 | 0.5 |
| Integration | 2 | 0.5 |
| **Total** | **70** | **10 working days** |

**Pro tip:** Start with simple income (just salary + standard deduction). Get tests passing. Then add features incrementally.

---

## Success = ✅

When you can answer "yes" to all:

- [ ] All 50+ tests passing
- [ ] TypeScript strict mode (no errors)
- [ ] <100ms computation time verified
- [ ] Cross-checked with government calculator (5+ scenarios)
- [ ] Documentation complete
- [ ] JSDoc comments on all functions
- [ ] Integrated into main export
- [ ] Ready for production

---

**Version:** 1.0  
**Created:** September 28, 2026  
**Ready to Build:** 45+ Remaining Countries

**Next Country:** Follow same process with different statutory data

---

Good luck! You're building the foundation of a $100M financial empire. 🚀
