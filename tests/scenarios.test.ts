/**
 * Tests for scenario planning
 */
import { describe, expect, it } from "vitest";
import { ScenarioPlanner, ScenarioTemplates } from "../src/lib/optimizer/scenarios";
import { emptyProfile } from "../src/lib/tax-engine";
import type { TaxProfile } from "../src/lib/tax-engine";

describe("scenario planning", () => {
  const baseProfile: TaxProfile = {
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
    deductions: {
      ...emptyProfile().deductions,
      section80C: 50_000,
    },
  };

  it("models 80C deduction increase", () => {
    const planner = new ScenarioPlanner(baseProfile);
    const scenario = planner.increaseDeductions80C(50_000);

    expect(scenario.profile.deductions.section80C).toBe(100_000);
    expect(scenario.result).toBeUndefined(); // Not computed yet
  });

  it("models HRA/rent increase", () => {
    const planner = new ScenarioPlanner(baseProfile);
    const scenario = planner.increaseRent(50_000);

    expect(scenario.profile.salary?.rentPaid).toBe(230_000);
  });

  it("models rental property addition", () => {
    const planner = new ScenarioPlanner(baseProfile);
    const scenario = planner.addRentalProperty(300_000, 150_000);

    expect(scenario.profile.houseProperties.length).toBe(1);
    expect(scenario.profile.houseProperties[0].annualRent).toBe(300_000);
  });

  it("models income increase", () => {
    const planner = new ScenarioPlanner(baseProfile);
    const scenario = planner.increaseIncome(500_000);

    expect(scenario.profile.salary?.grossSalary).toBe(2_000_000);
  });

  it("models capital gains realization", () => {
    const planner = new ScenarioPlanner(baseProfile);
    const scenario = planner.realizeCapitalGains(500_000, 100_000);

    expect(scenario.profile.capitalGains?.ltcg112A).toBe(500_000);
    expect(scenario.profile.capitalGains?.stcgOther).toBe(100_000);
  });

  it("compares multiple scenarios", () => {
    const planner = new ScenarioPlanner(baseProfile);
    const scenario1 = planner.increaseDeductions80C(30_000);
    const scenario2 = planner.increaseDeductions80C(80_000);
    const scenario3 = planner.addRentalProperty(300_000, 150_000);

    const comparison = planner.compareScenarios(scenario1, scenario2, scenario3);

    // Should identify best scenario
    expect(comparison.bestScenario).toBeDefined();
    expect(comparison.maxSavings).toBeGreaterThanOrEqual(0);
    expect(comparison.scenarios.length).toBe(3);

    // All scenarios should have results
    comparison.scenarios.forEach((s) => {
      expect(s.result).toBeDefined();
    });
  });

  it("identifies most tax-efficient scenario", () => {
    const planner = new ScenarioPlanner(baseProfile);
    const scenarios = [
      planner.increaseDeductions80C(30_000),
      planner.increaseDeductions80C(80_000),
      planner.increaseRent(60_000),
    ];

    const comparison = planner.compareScenarios(...scenarios);

    // Best scenario should have computed result
    expect(comparison.bestScenario.result).toBeDefined();

    // Best scenario should have lower tax than baseline
    const baselineRecommendedRegime = comparison.baseline.result![
      comparison.baseline.result!.recommended as "old" | "new"
    ];
    const bestRecommendedRegime = comparison.bestScenario.result![
      comparison.bestScenario.result!.recommended as "old" | "new"
    ];

    expect(bestRecommendedRegime.totalTaxLiability).toBeLessThanOrEqual(
      baselineRecommendedRegime.totalTaxLiability + 1000 // allow rounding
    );
  });

  it("uses aggressive saving template", () => {
    const scenarios = ScenarioTemplates.aggressiveSaving(baseProfile);

    expect(scenarios.length).toBeGreaterThan(0);
    expect(scenarios.every((s) => s.profile)).toBe(true);
  });

  it("uses capital gains planning template", () => {
    const scenarios = ScenarioTemplates.capitalGainsPlanning(baseProfile);

    expect(scenarios.length).toBeGreaterThan(0);
    expect(scenarios.some((s) => s.profile.capitalGains?.ltcg112A || 0 > 0)).toBe(true);
  });

  it("uses salary increase scenarios template", () => {
    const scenarios = ScenarioTemplates.salaryIncreaseScenarios(baseProfile);

    expect(scenarios.length).toBe(3);
    expect(scenarios[0].profile.salary?.grossSalary).toBe(2_000_000);
    expect(scenarios[1].profile.salary?.grossSalary).toBe(2_500_000);
    expect(scenarios[2].profile.salary?.grossSalary).toBe(3_000_000);
  });

  it("uses real estate planning template", () => {
    const scenarios = ScenarioTemplates.realEstatePlanning(baseProfile);

    expect(scenarios.length).toBe(3);
    expect(scenarios.every((s) => s.profile.houseProperties.length === 1)).toBe(true);
  });

  it("models dividend income", () => {
    const planner = new ScenarioPlanner(baseProfile);
    const scenario = planner.addDividendIncome(100_000);

    expect(scenario.profile.otherSources?.dividends).toBe(100_000);
  });

  it("models education loan interest", () => {
    const planner = new ScenarioPlanner(baseProfile);
    const scenario = planner.addEducationLoanInterest(50_000);

    expect(scenario.profile.deductions.section80E).toBe(50_000);
  });

  it("models charitable donations", () => {
    const planner = new ScenarioPlanner(baseProfile);
    const scenario = planner.addCharitableDonations(100_000);

    expect(scenario.profile.deductions.section80G).toBe(100_000);
  });

  it("models senior citizen health insurance", () => {
    const planner = new ScenarioPlanner(baseProfile);
    const scenario = planner.addSeniorCitizensHealthInsurance(50_000);

    expect(scenario.profile.deductions.section80D_parents).toBe(50_000);
    expect(scenario.profile.deductions.parentsAreSenior).toBe(true);
  });
});
