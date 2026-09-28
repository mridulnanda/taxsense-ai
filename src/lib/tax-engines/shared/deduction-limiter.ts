/**
 * Deduction Limiter — Unified deduction/credit cap logic
 * Handles AGI-based phase-outs, annual caps, and percentage limitations
 */

export interface DeductionLimit {
  type: "absolute_cap" | "agi_phaseout" | "percentage_of_agi" | "over_threshold";
  limit: number;
  description: string;
}

export interface DeductionResult {
  claimed: number;
  allowed: number;
  disallowed: number;
  limit: DeductionLimit;
  notes: string[];
}

/**
 * Apply absolute cap to deduction
 * Example: SALT cap of $10,000 in US
 */
export function applyAbsoluteCap(
  claimed: number,
  cap: number,
  description: string = ""
): DeductionResult {
  const allowed = Math.min(claimed, cap);
  const disallowed = Math.max(0, claimed - cap);

  return {
    claimed,
    allowed,
    disallowed,
    limit: {
      type: "absolute_cap",
      limit: cap,
      description: description || `Absolute cap: $${cap.toLocaleString()}`,
    },
    notes: disallowed > 0 ? [`${disallowed.toLocaleString()} disallowed due to cap`] : [],
  };
}

/**
 * Apply AGI-based percentage limitation
 * Example: Medical expenses over 7.5% of AGI in US
 */
export function applyPercentageOfAGILimit(
  claimed: number,
  agi: number,
  percentageThreshold: number,
  description: string = ""
): DeductionResult {
  const threshold = agi * percentageThreshold;
  const allowed = Math.max(0, claimed - threshold);
  const disallowed = claimed - allowed;

  const notes: string[] = [];
  if (threshold > 0) {
    notes.push(`AGI threshold: ${(percentageThreshold * 100).toFixed(1)}% × $${agi.toLocaleString()} = $${threshold.toLocaleString()}`);
  }

  return {
    claimed,
    allowed,
    disallowed,
    limit: {
      type: "percentage_of_agi",
      limit: percentageThreshold,
      description: description || `Over ${(percentageThreshold * 100).toFixed(1)}% of AGI`,
    },
    notes: disallowed > 0 ? [...notes, `${disallowed.toLocaleString()} disallowed`] : notes,
  };
}

/**
 * Apply AGI-based phase-out (gradual reduction)
 * Example: Child Tax Credit phases out above certain AGI
 * @param claimed - Amount of deduction/credit
 * @param agi - Adjusted Gross Income
 * @param phaseOutStart - AGI threshold where phase-out begins
 * @param phaseOutEnd - AGI threshold where phase-out ends (full elimination)
 * @param phaseOutIncrement - Dollar amount of AGI for each $1 reduction (e.g., 50 = reduces $1 per $50 AGI)
 */
export function applyAGIPhaseout(
  claimed: number,
  agi: number,
  phaseOutStart: number,
  phaseOutEnd: number,
  phaseOutIncrement: number,
  description: string = ""
): DeductionResult {
  if (agi <= phaseOutStart) {
    return {
      claimed,
      allowed: claimed,
      disallowed: 0,
      limit: {
        type: "agi_phaseout",
        limit: phaseOutStart,
        description: description || `Phase-out begins at AGI $${phaseOutStart.toLocaleString()}`,
      },
      notes: [],
    };
  }

  if (agi >= phaseOutEnd) {
    return {
      claimed,
      allowed: 0,
      disallowed: claimed,
      limit: {
        type: "agi_phaseout",
        limit: phaseOutEnd,
        description: description || `Phase-out ends at AGI $${phaseOutEnd.toLocaleString()}`,
      },
      notes: [`Fully phased out at AGI $${agi.toLocaleString()}`],
    };
  }

  // Partial phase-out
  const excessAGI = agi - phaseOutStart;
  const reductionAmount = Math.ceil(excessAGI / phaseOutIncrement); // Ceiling = $1 per increment
  const allowed = Math.max(0, claimed - reductionAmount);

  return {
    claimed,
    allowed,
    disallowed: claimed - allowed,
    limit: {
      type: "agi_phaseout",
      limit: phaseOutStart,
      description: description || `Phase-out: $${phaseOutStart.toLocaleString()}-$${phaseOutEnd.toLocaleString()}`,
    },
    notes: [
      `Excess AGI: $${excessAGI.toLocaleString()}`,
      `Reduction: $${reductionAmount.toLocaleString()} (1 per $${phaseOutIncrement} over threshold)`,
      `Allowed: $${allowed.toLocaleString()}`,
    ],
  };
}

/**
 * Apply threshold-based deduction (only amount over threshold)
 * Example: Medical expenses must exceed 7.5% of AGI; only excess is deductible
 */
export function applyThresholdDeduction(
  claimed: number,
  threshold: number,
  description: string = ""
): DeductionResult {
  const allowed = Math.max(0, claimed - threshold);
  const disallowed = Math.min(claimed, threshold);

  return {
    claimed,
    allowed,
    disallowed,
    limit: {
      type: "over_threshold",
      limit: threshold,
      description: description || `Only amount over $${threshold.toLocaleString()} is deductible`,
    },
    notes: disallowed > 0 ? [`$${disallowed.toLocaleString()} disallowed as below threshold`] : [],
  };
}

/**
 * Chain multiple deduction limitations
 * Applies limitations sequentially (e.g., first cap, then phase-out)
 */
export function applyMultipleLimitations(
  claimed: number,
  limitations: Array<(amount: number) => DeductionResult>
): DeductionResult {
  let currentAmount = claimed;
  const allNotes: string[] = [];
  const resultLimits: DeductionLimit[] = [];

  for (const limitFn of limitations) {
    const result = limitFn(currentAmount);
    currentAmount = result.allowed;
    allNotes.push(...result.notes);
    resultLimits.push(result.limit);
  }

  return {
    claimed,
    allowed: currentAmount,
    disallowed: claimed - currentAmount,
    limit: {
      type: "absolute_cap",
      limit: claimed,
      description: `Multiple limitations applied: ${resultLimits.map((l) => l.description).join("; ")}`,
    },
    notes: allNotes,
  };
}

/**
 * Calculate percentage-based deduction
 * Example: Charitable deduction limited to % of AGI
 */
export function applyPercentageLimit(
  claimed: number,
  agi: number,
  allowedPercentage: number,
  description: string = ""
): DeductionResult {
  const maxAllowed = agi * allowedPercentage;
  const allowed = Math.min(claimed, maxAllowed);
  const disallowed = claimed - allowed;

  return {
    claimed,
    allowed,
    disallowed,
    limit: {
      type: "percentage_of_agi",
      limit: allowedPercentage,
      description: description || `Limited to ${(allowedPercentage * 100).toFixed(0)}% of AGI ($${maxAllowed.toLocaleString()})`,
    },
    notes: disallowed > 0 ? [`${(allowedPercentage * 100).toFixed(0)}% of AGI limit applies`] : [],
  };
}
