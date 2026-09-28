# TaxSense AI API Reference

**FY 2025-26 (AY 2026-27)** — Indian Income-tax Act, 1961 (as amended by Finance Act 2025)

## Overview

TaxSense AI provides a pure-function tax engine for computing Indian income tax under both Old and New regimes, with automatic regime recommendation and detailed breakdown.

### Key Characteristics

- **Pure Functions**: All computations are deterministic; no I/O or side effects.
- **Dual Regime**: Computes both Old and New regimes, recommends the optimal choice.
- **Comprehensive**: Handles salary, house property, capital gains, business income, and other sources.
- **Auditable**: Produces detailed breakdowns and math trails for regulatory compliance.
- **Performance**: All profiles compute in <1ms; typical in <0.1ms.

---

## Core API

### `computeBoth(profile: TaxProfile): ComparisonResult`

Computes tax under both regimes and recommends the optimal one.

#### Example

```typescript
import { computeBoth } from "@/lib/tax-engine";

const profile = {
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
  // ... other income heads
};

const result = computeBoth(profile);
console.log(`Recommended: ${result.recommended} regime`);
console.log(`Savings: ₹${result.savings}`);
```

#### Returns

```typescript
interface ComparisonResult {
  old: RegimeComputation;      // Tax under old regime
  new: RegimeComputation;      // Tax under new regime
  recommended: "old" | "new";  // Which regime to file under
  savings: number;              // Tax saved by following recommendation
}
```

---

### `computeRegime(profile: TaxProfile, regime: "old" | "new"): RegimeComputation`

Computes tax under a single regime.

#### Example

```typescript
import { computeRegime } from "@/lib/tax-engine";

const newRegimeTax = computeRegime(profile, "new");
const oldRegimeTax = computeRegime(profile, "old");

console.log(`New regime tax: ₹${newRegimeTax.totalTaxLiability}`);
console.log(`Old regime tax: ₹${oldRegimeTax.totalTaxLiability}`);
```

#### Returns

```typescript
interface RegimeComputation {
  regime: "old" | "new";
  heads: HeadwiseIncome;                    // Income by head (salary, rental, etc.)
  salaryExemptions: { ... };                // HRA and other exemptions applied
  grossTotalIncome: number;
  deductionsAllowed: Record<string, number>; // Chapter VI-A actually allowed (post caps)
  totalDeductions: number;
  totalIncome: number;                      // Taxable income (TI)
  normalIncome: number;                     // Taxed at slab rates
  basicExemptionAdjustment: number;         // Unused exemption shifted to CG
  slabLines: SlabLine[];                    // Breakdown by slab (0-2.5L, 2.5L-5L, etc.)
  taxOnNormalIncome: number;
  specialRateTax: SpecialRateTax;           // LTCG, STCG tax details
  taxBeforeRebate: number;
  rebate87A: number;                        // Section 87A rebate
  rebateMarginalRelief: number;             // Marginal relief (income just above 12L)
  surcharge: number;
  surchargeMarginalRelief: number;          // Surcharge marginal relief (above 50L)
  cess: number;
  totalTaxLiability: number;                // Final tax payable
  taxesPaid: number;                        // TDS/advance tax already paid
  netPayable: number;                       // +ve = amount due, -ve = refund
  effectiveRatePct: number;                 // Tax as % of TI
  notes: string[];                          // Audit trail / explanation notes
}
```

---

## Input Types

### `TaxProfile`

Complete income and deduction profile for the year.

```typescript
interface TaxProfile {
  name?: string;                      // Optional: name for reports
  age: number;                        // Age (affects basic exemption)
  residentialStatus: "resident" | "nri"; // Currently only resident modeled
  salary?: SalaryIncome;              // Section 17 salary
  houseProperties: HouseProperty[];   // Self-occupied, let-out (Sections 22-26)
  capitalGains?: CapitalGains;        // Sections 111A, 112, 112A
  business?: BusinessIncome;          // Section 44 business income
  otherSources?: OtherSources;        // Interest, dividends, pensions (Chapter III-A)
  deductions: DeductionInputs;        // Chapter VI-A (80C–80U)
  taxesPaid: number;                  // TDS + advance tax (for refund calculation)
}
```

### `SalaryIncome`

Salary/pension income components.

```typescript
interface SalaryIncome {
  grossSalary: number;                // Total salary (before any exemption)
  basicPlusDA: number;                // Basic + DA (base for HRA and NPS caps)
  hraReceived: number;                // HRA component (part of gross)
  rentPaid: number;                   // Annual rent paid for HRA exemption
  isMetroCity: boolean;               // Metro vs non-metro (affects HRA %)
  employerNpsContribution: number;    // Employer NPS (80CCD(2), deductible in BOTH regimes)
  professionalTax: number;            // Professional tax (old regime only, Section 16(iii))
}
```

**HRA Exemption Formula** (Old regime only):
```
HRA Exempt = min(HRA Received, Rent - 10% of BasicDA, 50% of BasicDA [metro] or 40% [non-metro])
```

### `HouseProperty`

Rental or self-occupied property details.

```typescript
interface HouseProperty {
  use: "self-occupied" | "let-out";
  annualRent: number;                 // Rent received (0 for self-occupied)
  municipalTaxes: number;             // Property taxes paid
  homeLoanInterest: number;           // Interest on housing loan (Section 24(b))
}
```

**Self-Occupied Property** (Old regime):
- Interest capped at ₹2,00,000
- No rent income; NAV (₹0 in most cases)

**Let-Out Property** (Old regime):
- Net Annual Value (NAV) = Rent − Municipal taxes − 30% standard deduction
- Loss from house property capped at ₹2,00,000 (can carry forward 8 years)
- Interest fully deductible (no cap)

**New Regime**:
- No house property set-off against salary; interest not deductible

### `CapitalGains`

Capital gains split by rate and holding period.

```typescript
interface CapitalGains {
  stcg111A: number;        // Short-term CG on STT-paid listed equity @ 20% (Sec. 111A)
  stcgOther: number;       // Other STCG (debt funds, property, etc.) @ slab rate
  ltcg112A: number;        // Long-term CG on STT-paid listed equity @ 12.5% (Sec. 112A)
  ltcgOther: number;       // Other LTCG (property, gold, pre-Jul-2024 debt) @ 12.5%
}
```

**Tax Rates** (Finance Act 2025, effective 23-Jul-2024):
- STCG 111A: 20% (on gains > basic exemption shortfall)
- STCG Other: Slab rate (6%–30%)
- LTCG 112A: 12.5% (on gains > basic exemption shortfall)
- LTCG Other: 12.5% (no indexation post 23-Jul-2024)

**Surcharge** on CG capped at 15% (vs. 25% on normal income in higher brackets).

### `DeductionInputs`

Chapter VI-A investments and payments (capped).

```typescript
interface DeductionInputs {
  section80C: number;              // EPF, PPF, ELSS, LIC, etc. (cap ₹1.5L)
  section80CCD1B: number;          // Self NPS over 80C (cap ₹50k)
  section80D_selfFamily: number;   // Health insurance: self/spouse/children
  section80D_parents: number;      // Health insurance: parents
  parentsAreSenior: boolean;        // Affects 80D parent cap (₹50k vs ₹25k)
  section80E: number;              // Education loan interest (no cap)
  section80G: number;              // Donations (verified post-limit; entered as given)
}
```

**Caps** (Old regime only; new regime ignores VI-A):
- 80C: ₹1.5L (includes employer NPS cap of ₹1.5L aggregate)
- 80CCD(1B): ₹50k (self NPS, over 80C cap)
- 80D: ₹25k (self/family), ₹25k (parents); ₹50k if parents ≥60

---

## Output Interpretation

### Tax Calculation Flow

1. **Income Heads**: Salary, house property, capital gains, business, other sources
2. **Head-Level Exemptions**: HRA (old only), standard deduction (salary)
3. **Gross Total Income**: Sum of all heads (after exemptions)
4. **Chapter VI-A Deductions**: Applied to reduce GTI (old regime only)
5. **Total Income (TI)**: GTI − deductions, rounded to nearest ₹10
6. **Normal Income**: Portion taxed at slab rates (after CG carve-out)
7. **Special-Rate Income**: CG taxed at fixed rates (20%, 12.5%, etc.)
8. **Tax on Normal**: Applied per slab; rebates (87A) applied
9. **Tax on Special-Rate**: Fixed rate applied
10. **Surcharge & Cess**: Levied on total tax before cess
11. **Marginal Relief**: Applied if income just crosses threshold (12L, 50L, etc.)

### Example Output Analysis

```typescript
const result = computeRegime(profile, "new");

// Headwise income breakdown
console.log(`Salary: ₹${result.heads.salary}`);
console.log(`Rental: ₹${result.heads.houseProperty}`);
console.log(`CG: ₹${result.heads.capitalGains}`);

// Tax brackets
result.slabLines.forEach(line => {
  console.log(`${line.from}–${line.to}: ₹${line.taxableInSlab} @ ${line.ratePct}% = ₹${line.tax}`);
});

// Final breakdown
console.log(`TI: ₹${result.totalIncome}`);
console.log(`Normal tax: ₹${result.taxOnNormalIncome}`);
console.log(`CG tax: ₹${result.specialRateTax.ltcg112A.tax}`);
console.log(`Rebate 87A: −₹${result.rebate87A}`);
console.log(`Surcharge: ₹${result.surcharge}`);
console.log(`Cess (4%): ₹${result.cess}`);
console.log(`Total tax due: ₹${result.totalTaxLiability}`);
console.log(`TDS already paid: ₹${result.taxesPaid}`);
console.log(`Refund/Due: ₹${result.netPayable}`);
```

---

## Accuracy & Limitations

### In Scope (FY 2025-26)

- Resident individuals (Sections 6, 8)
- Salary (Section 17), HRA (Section 10(13A))
- House property (Sections 22–26)
- Capital gains (Sections 111A, 112, 112A) — post 23-Jul-2024 rates
- Business/professional income (Sections 28–43; presumptive schemes 44AD/44ADA as net income)
- Other sources (Chapter III-A)
- Chapter VI-A deductions (Sections 80C–80U) with statutory caps
- Both regimes (Sections 115BAC(1) & (2))
- Senior citizen exemptions & 80TTB
- Rebates, surcharge, marginal relief, cess

### Out of Scope (Flagged to User)

- NRI / DTAA taxation
- Foreign assets / foreign income
- Fund of Funds / off-shore structures
- Alternate Minimum Tax (AMT)
- Income clubbing (spousal income, minors, etc.)
- Form 10BA, angel tax, startup deductions
- Tonnage tax, ship leasing

The engine flags these and recommends CA review rather than guessing.

---

## Helper Functions

### `hraExemption(salary: SalaryIncome): number`

Calculates HRA exemption (old regime only).

```typescript
import { hraExemption } from "@/lib/tax-engine";

const salary = { /* ... */ };
const hraExempt = hraExemption(salary);
console.log(`HRA exempt: ₹${hraExempt}`);
```

---

## Error Handling

All functions assume valid input and do not throw. Invalid or missing fields are treated as 0.

```typescript
// Edge case: partial profile
const minimalProfile = {
  age: 30,
  residentialStatus: "resident",
  houseProperties: [],
  deductions: { /* all 0 */ },
  taxesPaid: 0,
  // salary, capitalGains, etc. omitted → treated as 0
};

const result = computeBoth(minimalProfile); // No error; TI = 0, tax = 0
```

---

## Performance

**Benchmarks** (FY 2025-26):

| Scenario | Time |
|----------|------|
| Simple (salary only) | 0.05ms |
| Intermediate (+ rental) | 0.03ms |
| Complex (multi-head, all deductions) | 0.25ms |
| High earner (1Cr salary + CG) | 0.06ms |

**Target**: <100ms typical; <200ms worst-case.

---

## Statutory Sources

All constants and formulas verified against:

- **Income-tax Act, 1961** (as amended by Finance Act 2025)
- **incometax.gov.in** (official Ministry of Finance)
- **ClearTax** (third-party auditing, FY2025-26, verified 2026-07-06)

See `src/lib/tax-engine/constants.ts` for sourced figures and verification dates.

---

## Examples

### Example 1: Simple Salaried

```typescript
const profile: TaxProfile = {
  age: 35,
  residentialStatus: "resident",
  salary: {
    grossSalary: 1_200_000,
    basicPlusDA: 600_000,
    hraReceived: 0,
    rentPaid: 0,
    isMetroCity: false,
    employerNpsContribution: 0,
    professionalTax: 0,
  },
  houseProperties: [],
  deductions: { /* all 0 */ },
  taxesPaid: 0,
};

const result = computeBoth(profile);
// new regime: TI = 1,125,000 (−75k std deduction)
// tax = (75k @ 0% + 50k @ 5% + 50k @ 10%) = 7,500 → rebate 87A = 7,500 → 0
// old regime: TI = 1,175,000 (−50k std deduction)
// tax = (75k @ 0% + 75k @ 5% + ... ) = higher
// Recommendation: new (₹0 vs ₹..., savings ₹...)
```

### Example 2: Salaried with Rental & Deductions

```typescript
const profile: TaxProfile = {
  age: 40,
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
    section80C: 100_000,
    section80D_selfFamily: 15_000,
    // ... rest 0
  },
  // ...
};

const result = computeBoth(profile);
// old regime benefits from HRA (₹max), rental loss set-off, VI-A deductions
// new regime: no HRA, no rental loss → higher TI
// Recommendation: old (HRA + rental losses win)
```

---

## Support & Feedback

For bugs, enhancements, or clarifications, open an issue or contact MNB Research.

**Not a substitute for professional tax advice.** Consult a qualified Chartered Accountant (CA) for:
- Complex structures (trusts, partnerships, NRI)
- Disputed deductions
- TDS reconciliation
- E-filing submission & amendment
