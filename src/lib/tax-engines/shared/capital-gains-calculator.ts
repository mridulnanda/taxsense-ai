/**
 * Capital Gains Calculator — Unified for global tax engines
 * Handles gain/loss aggregation, holding period classification, netting rules
 */

export type HoldingPeriod = "short_term" | "long_term";
export type CapitalAssetType = "securities" | "property" | "crypto" | "collectibles" | "other";

export interface CapitalGainTransaction {
  description?: string;
  salePrice: number;
  costBasis: number;
  holdingPeriod: HoldingPeriod;
  assetType?: CapitalAssetType;
  dateAcquired?: string; // ISO format
  dateSold?: string; // ISO format
}

export interface CapitalGainLoss {
  gain: number;
  loss: number;
  net: number;
  type: HoldingPeriod;
}

export interface CapitalGainsSummary {
  shortTermGains: number;
  shortTermLosses: number;
  shortTermNet: number;

  longTermGains: number;
  longTermLosses: number;
  longTermNet: number;

  totalGains: number;
  totalLosses: number;
  totalNet: number;

  carryforwardLosses?: number; // Losses that exceed current year limit
  breakdown: CapitalGainLoss[];
  notes: string[];
}

/**
 * Aggregate capital gains and losses by holding period
 */
export function aggregateCapitalGains(
  transactions: CapitalGainTransaction[],
  maxLossDeduction: number = Infinity // Annual loss limitation (e.g., $3k in US)
): CapitalGainsSummary {
  let shortTermGains = 0;
  let shortTermLosses = 0;
  let longTermGains = 0;
  let longTermLosses = 0;

  const breakdown: CapitalGainLoss[] = [];
  const notes: string[] = [];

  for (const txn of transactions) {
    const gain = txn.salePrice - txn.costBasis;

    if (txn.holdingPeriod === "short_term") {
      if (gain >= 0) {
        shortTermGains += gain;
      } else {
        shortTermLosses += Math.abs(gain);
      }
    } else {
      if (gain >= 0) {
        longTermGains += gain;
      } else {
        longTermLosses += Math.abs(gain);
      }
    }

    breakdown.push({
      gain: Math.max(0, gain),
      loss: Math.max(0, -gain),
      net: gain,
      type: txn.holdingPeriod,
    });
  }

  // Net by holding period
  const shortTermNet = shortTermGains - shortTermLosses;
  const longTermNet = longTermGains - longTermLosses;
  const totalNet = shortTermNet + longTermNet;

  // Loss limitation handling
  let carryforwardLosses = 0;
  let allowedLosses = -Math.min(0, totalNet); // Total losses as positive

  if (allowedLosses > maxLossDeduction) {
    carryforwardLosses = allowedLosses - maxLossDeduction;
    allowedLosses = maxLossDeduction;
    notes.push(
      `Loss limited to $${maxLossDeduction.toLocaleString()} per year; ` +
        `$${carryforwardLosses.toLocaleString()} carried forward`
    );
  }

  return {
    shortTermGains,
    shortTermLosses,
    shortTermNet,
    longTermGains,
    longTermLosses,
    longTermNet,
    totalGains: shortTermGains + longTermGains,
    totalLosses: shortTermLosses + longTermLosses,
    totalNet: Math.max(-maxLossDeduction, totalNet),
    carryforwardLosses,
    breakdown,
    notes,
  };
}

/**
 * Calculate preferred capital gains tax
 * Many countries have preferential rates for long-term gains
 * @param gains - Long-term gains amount
 * @param taxableIncome - Total taxable income (used for rate determination)
 * @param longTermRates - Preferential rates (often bracket-based)
 * @returns Tax on long-term gains
 */
export function calculatePreferentialCapitalGainsTax(
  gains: number,
  taxableIncome: number,
  longTermRates: Array<[number, number, number]> // [minIncome, maxIncome, rate]
): number {
  if (gains <= 0) return 0;

  // Find applicable rate bracket
  for (const [min, max, rate] of longTermRates) {
    if (taxableIncome >= min && taxableIncome < max) {
      return gains * rate;
    }
  }

  // If income exceeds all brackets, use highest rate
  const [, , highestRate] = longTermRates[longTermRates.length - 1];
  return gains * highestRate;
}

/**
 * Calculate blended capital gains tax
 * When gains span multiple tax brackets
 */
export function calculateCapitalGainsTaxWithBrackets(
  gains: number,
  ordinaryTaxableIncome: number,
  brackets: Array<[number, number, number]> // [min, max, rate]
): {
  tax: number;
  effectiveRate: number;
  breakdown: Array<{ bracketStart: number; bracketEnd: number; incomeInBracket: number; tax: number }>;
} {
  if (gains <= 0) {
    return {
      tax: 0,
      effectiveRate: 0,
      breakdown: [],
    };
  }

  let tax = 0;
  let remaining = gains;
  const breakdown = [];

  // Fill brackets starting from after ordinary income
  for (const [min, max, rate] of brackets) {
    const bracketStart = Math.max(min, ordinaryTaxableIncome);

    if (remaining <= 0 || bracketStart >= max) continue;

    const bracketEnd = min(max, ordinaryTaxableIncome + remaining);
    const incomeInBracket = bracketEnd - bracketStart;
    const taxInBracket = incomeInBracket * rate;

    tax += taxInBracket;
    remaining -= incomeInBracket;

    breakdown.push({
      bracketStart,
      bracketEnd,
      incomeInBracket,
      tax: taxInBracket,
    });
  }

  return {
    tax: Math.round(tax * 100) / 100,
    effectiveRate: gains > 0 ? tax / gains : 0,
    breakdown,
  };
}

/**
 * Separate gains into different tax treatment groups
 * Some countries treat certain gains at different rates (collectibles, etc.)
 */
export function segregateCapitalGainsByTaxTreatment(
  transactions: CapitalGainTransaction[],
  treatmentMap: Record<string, string> = {} // assetType -> treatmentGroup
): Record<string, CapitalGainsSummary> {
  const segregated: Record<string, CapitalGainTransaction[]> = {};

  for (const txn of transactions) {
    const treatment = treatmentMap[txn.assetType || "other"] || "ordinary";
    if (!segregated[treatment]) {
      segregated[treatment] = [];
    }
    segregated[treatment].push(txn);
  }

  const result: Record<string, CapitalGainsSummary> = {};
  for (const [treatment, txns] of Object.entries(segregated)) {
    result[treatment] = aggregateCapitalGains(txns);
  }

  return result;
}

/**
 * Apply capital loss carryback/carryforward rules
 * @param currentYearLosses - Losses in current year
 * @param priorYearCarryback - Losses carried back from prior year
 * @param carrybackYears - How many years to carry back (typically 0 or 3)
 * @returns { usedLosses, carriedForward }
 */
export function applyCapitalLossCarryover(
  currentYearLosses: number,
  priorYearCarryback: number = 0,
  carrybackYears: number = 0,
  maxLossDeduction: number = 3000 // US limit
): {
  usedCurrentYear: number;
  usedCarryback: number;
  carriedForward: number;
  notes: string[];
} {
  const totalAvailable = currentYearLosses + priorYearCarryback;
  const usedCurrentYear = Math.min(currentYearLosses, maxLossDeduction);
  const remaining = maxLossDeduction - usedCurrentYear;
  const usedCarryback = Math.min(priorYearCarryback, remaining);
  const carriedForward = totalAvailable - usedCurrentYear - usedCarryback;

  const notes: string[] = [];
  if (usedCurrentYear < currentYearLosses) {
    notes.push(`Current year losses limited to $${maxLossDeduction.toLocaleString()}`);
  }
  if (carriedForward > 0) {
    notes.push(`$${carriedForward.toLocaleString()} carried forward to future years`);
  }

  return {
    usedCurrentYear,
    usedCarryback,
    carriedForward,
    notes,
  };
}

/**
 * Helper: determine holding period based on dates
 * @returns "long_term" if held > 1 year, else "short_term"
 */
export function determineHoldingPeriod(
  dateAcquired: string,
  dateSold: string,
  longTermThresholdDays: number = 365
): HoldingPeriod {
  const acquired = new Date(dateAcquired).getTime();
  const sold = new Date(dateSold).getTime();
  const holdDays = (sold - acquired) / (1000 * 60 * 60 * 24);

  return holdDays > longTermThresholdDays ? "long_term" : "short_term";
}

// Helper
function min(a: number, b: number): number {
  return a < b ? a : b;
}
