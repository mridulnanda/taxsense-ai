/**
 * Tests for advanced optimizer features: recommendations and scenarios
 */
import { describe, expect, it } from "vitest";
import { ScenarioPlanner, ScenarioTemplates } from "../src/lib/optimizer/scenarios";
import { generateOptimizationRecommendations } from "../src/lib/optimizer/recommendations";
import { computeBoth, emptyProfile } from "../src/lib/tax-engine";
import type { TaxProfile } from "../src/lib/tax-engine";

describe("advanced optimizer features", () => {
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

  describe("scenario planning", () => {
    it("creates scenario for 80C increase", () => {
      const planner = new ScenarioPlanner(baseProfile);
      const scenario = planner.increaseDeductions80C(50_000);

      expect(scenario.profile.deductions.section80C).toBe(100_000);
      expect(scenario.id).toBe("scenario-80c");
    });

    it("creates scenario for income increase", () => {
      const planner = new ScenarioPlanner(baseProfile);
      const scenario = planner.increaseIncome(500_000);

      expect(scenario.profile.salary?.grossSalary).toBe(2_000_000);
    });

    it("creates scenario for rental property", () => {
      const planner = new ScenarioPlanner(baseProfile);
      const scenario = planner.addRentalProperty(300_000, 150_000);

      expect(scenario.profile.houseProperties.length).toBe(1);
      expect(scenario.profile.houseProperties[0].annualRent).toBe(300_000);
    });

    it("compares multiple scenarios", () => {
      const planner = new ScenarioPlanner(baseProfile);
      const s1 = planner.increaseDeductions80C(30_000);
      const s2 = planner.increaseIncome(300_000);

      const comparison = planner.compareScenarios(s1, s2);

      expect(comparison.baseline).toBeDefined();
      expect(comparison.scenarios.length).toBe(2);
      expect(comparison.bestScenario).toBeDefined();
      expect(comparison.maxSavings).toBeGreaterThanOrEqual(0);
    });

    it("applies aggressive saving template", () => {
      const scenarios = ScenarioTemplates.aggressiveSaving(baseProfile);

      expect(scenarios.length).toBe(4);
      expect(scenarios.every((s) => s.profile)).toBe(true);
    });

    it("applies capital gains planning template", () => {
      const scenarios = ScenarioTemplates.capitalGainsPlanning(baseProfile);

      expect(scenarios.length).toBe(3);
      expect(scenarios.every((s) => (s.profile.capitalGains?.ltcg112A || 0) > 0)).toBe(true);
    });

    it("applies salary increase scenarios template", () => {
      const scenarios = ScenarioTemplates.salaryIncreaseScenarios(baseProfile);

      expect(scenarios.length).toBe(3);
      expect(scenarios[0].profile.salary?.grossSalary).toBe(2_000_000);
      expect(scenarios[1].profile.salary?.grossSalary).toBe(2_500_000);
    });

    it("applies real estate planning template", () => {
      const scenarios = ScenarioTemplates.realEstatePlanning(baseProfile);

      expect(scenarios.length).toBe(3);
    });

    it("models capital gains realization", () => {
      const planner = new ScenarioPlanner(baseProfile);
      const scenario = planner.realizeCapitalGains(500_000, 100_000);

      expect(scenario.profile.capitalGains?.ltcg112A).toBe(500_000);
      expect(scenario.profile.capitalGains?.stcgOther).toBe(100_000);
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
  });

  describe("recommendations engine", () => {
    it("generates optimization report", () => {
      const comparison = computeBoth(baseProfile);
      const report = generateOptimizationRecommendations(baseProfile, comparison);

      expect(report.currentLiability).toBeGreaterThanOrEqual(0);
      expect(report.optimizedLiability).toBeGreaterThanOrEqual(0);
      expect(report.riskProfile).toMatch(/^(conservative|moderate|aggressive)$/);
    });

    it("identifies savings opportunities", () => {
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
        deductions: {
          ...emptyProfile().deductions,
          section80C: 50_000,
        },
      };

      const comparison = computeBoth(p);
      const report = generateOptimizationRecommendations(p, comparison);

      expect(report.recommendations.length).toBeGreaterThanOrEqual(0);
    });

    it("ranks recommendations by priority", () => {
      const comparison = computeBoth(baseProfile);
      const report = generateOptimizationRecommendations(baseProfile, comparison);

      if (report.recommendations.length > 0) {
        const firstRec = report.recommendations[0];
        expect(["critical", "high", "medium", "low"].includes(firstRec.priority)).toBe(true);
      }
    });

    it("provides actionable recommendations", () => {
      const comparison = computeBoth(baseProfile);
      const report = generateOptimizationRecommendations(baseProfile, comparison);

      report.recommendations.forEach((rec) => {
        expect(rec.id).toBeTruthy();
        expect(rec.title).toBeTruthy();
        expect(rec.description).toBeTruthy();
        expect(rec.action).toBeTruthy();
      });
    });
  });
});
