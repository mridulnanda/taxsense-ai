/**
 * What-If Tax Scenario Planning
 * Model various tax scenarios and compare outcomes
 * FY 2025-26 (AY 2026-27)
 */

import { computeBoth, type TaxProfile } from "../tax-engine";

export interface Scenario {
  /** Unique scenario ID */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what changes */
  description: string;
  /** Modified profile for this scenario */
  profile: TaxProfile;
  /** Computed tax result */
  result?: ReturnType<typeof computeBoth>;
}

export interface ScenarioComparison {
  baseline: Scenario;
  scenarios: Scenario[];
  /** Which scenario has lowest tax */
  bestScenario: Scenario;
  /** Max tax savings across all scenarios */
  maxSavings: number;
}

/**
 * Create scenario variants for comparison
 */
export class ScenarioPlanner {
  constructor(private baselineProfile: TaxProfile) {}

  /**
   * Model: Increase 80C investments
   */
  increaseDeductions80C(amount: number): Scenario {
    const profile = JSON.parse(JSON.stringify(this.baselineProfile)) as TaxProfile;
    profile.deductions.section80C = Math.min(
      (profile.deductions.section80C || 0) + amount,
      150_000
    );

    return {
      id: "scenario-80c",
      name: `Increase 80C by ₹${amount.toLocaleString("en-IN")}`,
      description: `Invest additional ₹${amount.toLocaleString("en-IN")} in PPF or ELSS`,
      profile,
    };
  }

  /**
   * Model: Increase HRA/rent adjustment
   */
  increaseRent(additionalRent: number): Scenario {
    const profile = JSON.parse(JSON.stringify(this.baselineProfile)) as TaxProfile;
    if (profile.salary) {
      profile.salary.rentPaid += additionalRent;
    }

    return {
      id: "scenario-hra",
      name: `Increase rent by ₹${additionalRent.toLocaleString("en-IN")}`,
      description: `Higher rent increases HRA exemption`,
      profile,
    };
  }

  /**
   * Model: Additional rental property
   */
  addRentalProperty(annualRent: number, interest: number): Scenario {
    const profile = JSON.parse(JSON.stringify(this.baselineProfile)) as TaxProfile;
    profile.houseProperties.push({
      use: "let-out",
      annualRent,
      municipalTaxes: Math.round(annualRent * 0.03), // assume 3%
      homeLoanInterest: interest,
    });

    return {
      id: "scenario-rental",
      name: `Add rental property (₹${annualRent.toLocaleString("en-IN")}/yr)`,
      description: `Acquire rental property with ₹${annualRent.toLocaleString("en-IN")} annual rent`,
      profile,
    };
  }

  /**
   * Model: Income increase
   */
  increaseIncome(salaryIncrease: number): Scenario {
    const profile = JSON.parse(JSON.stringify(this.baselineProfile)) as TaxProfile;
    if (profile.salary) {
      profile.salary.grossSalary += salaryIncrease;
      profile.salary.basicPlusDA += salaryIncrease * 0.5; // assume 50% is basic+DA
    }

    return {
      id: "scenario-income",
      name: `Income increase ₹${salaryIncrease.toLocaleString("en-IN")}`,
      description: `Salary increase to ₹${(profile.salary?.grossSalary || 0).toLocaleString("en-IN")}`,
      profile,
    };
  }

  /**
   * Model: Capital gains realization
   */
  realizeCapitalGains(ltcg: number, stcg: number): Scenario {
    const profile = JSON.parse(JSON.stringify(this.baselineProfile)) as TaxProfile;
    if (!profile.capitalGains) {
      profile.capitalGains = { stcg111A: 0, stcgOther: 0, ltcg112A: 0, ltcgOther: 0 };
    }
    profile.capitalGains.ltcg112A += ltcg;
    profile.capitalGains.stcgOther += stcg;

    return {
      id: "scenario-cg",
      name: `Realize CG: LTCG ₹${ltcg.toLocaleString("en-IN")}, STCG ₹${stcg.toLocaleString("en-IN")}`,
      description: `Sell investments realizing ${ltcg ? "long" : "short"}-term gains`,
      profile,
    };
  }

  /**
   * Model: Switch regimes
   */
  switchRegimes(): Scenario {
    const profile = JSON.parse(JSON.stringify(this.baselineProfile)) as TaxProfile;
    // Just flag for comparison; actual switch happens in UI
    return {
      id: "scenario-regime-switch",
      name: "Switch to alternative regime",
      description: "File return under other regime",
      profile,
    };
  }

  /**
   * Model: Dividend income
   */
  addDividendIncome(amount: number): Scenario {
    const profile = JSON.parse(JSON.stringify(this.baselineProfile)) as TaxProfile;
    if (!profile.otherSources) {
      profile.otherSources = {
        savingsInterest: 0,
        fdInterest: 0,
        dividends: 0,
        familyPension: 0,
        other: 0,
      };
    }
    profile.otherSources.dividends += amount;

    return {
      id: "scenario-dividends",
      name: `Add dividend income ₹${amount.toLocaleString("en-IN")}`,
      description: `Receive dividends from equity investments`,
      profile,
    };
  }

  /**
   * Model: Education loan interest
   */
  addEducationLoanInterest(interest: number): Scenario {
    const profile = JSON.parse(JSON.stringify(this.baselineProfile)) as TaxProfile;
    profile.deductions.section80E += interest;

    return {
      id: "scenario-80e",
      name: `Add education loan interest ₹${interest.toLocaleString("en-IN")}`,
      description: `Claim Section 80E deduction for education loan interest`,
      profile,
    };
  }

  /**
   * Model: Charitable donations
   */
  addCharitableDonations(amount: number): Scenario {
    const profile = JSON.parse(JSON.stringify(this.baselineProfile)) as TaxProfile;
    profile.deductions.section80G += amount;

    return {
      id: "scenario-80g",
      name: `Charitable donations ₹${amount.toLocaleString("en-IN")}`,
      description: `Donate to eligible charitable institutions (50% or 100% deduction)`,
      profile,
    };
  }

  /**
   * Model: Senior citizen health insurance
   */
  addSeniorCitizensHealthInsurance(premium: number): Scenario {
    const profile = JSON.parse(JSON.stringify(this.baselineProfile)) as TaxProfile;
    profile.deductions.section80D_parents += premium;
    profile.deductions.parentsAreSenior = true;

    return {
      id: "scenario-80d-senior",
      name: `Senior parents health insurance ₹${premium.toLocaleString("en-IN")}`,
      description: `Health insurance for parents aged 60+`,
      profile,
    };
  }

  /**
   * Compute all scenarios and compare
   */
  compareScenarios(...scenarios: Scenario[]): ScenarioComparison {
    const baseline: Scenario = {
      id: "baseline",
      name: "Current Plan",
      description: "Your current profile",
      profile: this.baselineProfile,
      result: computeBoth(this.baselineProfile),
    };

    // Compute results for all scenarios
    const computedScenarios = scenarios.map((s) => ({
      ...s,
      result: computeBoth(s.profile),
    }));

    // Find best scenario
    let bestScenario = baseline;
    let minTax = baseline.result!.recommended === "old"
      ? baseline.result!.old.totalTaxLiability
      : baseline.result!.new.totalTaxLiability;

    for (const scenario of computedScenarios) {
      const tax =
        scenario.result![scenario.result!.recommended === "old" ? "old" : "new"].totalTaxLiability;
      if (tax < minTax) {
        minTax = tax;
        bestScenario = scenario;
      }
    }

    const baselineTax = baseline.result!.recommended === "old"
      ? baseline.result!.old.totalTaxLiability
      : baseline.result!.new.totalTaxLiability;
    const maxSavings = baselineTax - minTax;

    return {
      baseline,
      scenarios: computedScenarios,
      bestScenario,
      maxSavings,
    };
  }
}

/**
 * Pre-built scenario templates
 */
export const ScenarioTemplates = {
  /**
   * Aggressive tax saving plan
   */
  aggressiveSaving: (profile: TaxProfile): Scenario[] => {
    const planner = new ScenarioPlanner(profile);
    return [
      planner.increaseDeductions80C(50_000), // Additional PPF
      planner.addEducationLoanInterest(100_000),
      planner.addCharitableDonations(50_000),
      planner.increaseRent(50_000),
    ];
  },

  /**
   * Conservative capital gains planning
   */
  capitalGainsPlanning: (profile: TaxProfile): Scenario[] => {
    const planner = new ScenarioPlanner(profile);
    return [
      planner.realizeCapitalGains(500_000, 0), // LTCG only
      planner.realizeCapitalGains(1_000_000, 0), // Larger LTCG
      planner.realizeCapitalGains(500_000, 200_000), // Mixed LTCG + STCG
    ];
  },

  /**
   * Salary increase planning
   */
  salaryIncreaseScenarios: (profile: TaxProfile): Scenario[] => {
    const planner = new ScenarioPlanner(profile);
    return [
      planner.increaseIncome(500_000),
      planner.increaseIncome(1_000_000),
      planner.increaseIncome(1_500_000),
    ];
  },

  /**
   * Real estate investment
   */
  realEstatePlanning: (profile: TaxProfile): Scenario[] => {
    const planner = new ScenarioPlanner(profile);
    return [
      planner.addRentalProperty(300_000, 150_000),
      planner.addRentalProperty(500_000, 250_000),
      planner.addRentalProperty(800_000, 400_000),
    ];
  },
};
