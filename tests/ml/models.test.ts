/**
 * ML Models Test Suite
 * Comprehensive tests for all 15 specialized models
 */

import { describe, it, expect, beforeAll } from "vitest";
import { modelRegistry } from "@/lib/ml/models/model-registry";
import { SyntheticDataGenerator } from "@/lib/ml/pipeline/synthetic-data-generator";
import { FeatureEngineer } from "@/lib/ml/pipeline/feature-engineering";

describe("ML Platform - 15 Specialized Models", () => {
  const dataGenerator = new SyntheticDataGenerator({ totalSamples: 1000 });

  describe("Financial Prediction Models", () => {
    describe("Tax Liability Predictor", () => {
      it("should predict tax liability with reasonable accuracy", async () => {
        const model = await modelRegistry.loadModel("tax_liability");
        const profiles = dataGenerator.generateProfiles(10);

        const predictions = await Promise.all(
          profiles.map((profile) => model.predict(profile))
        );

        // All predictions should be non-negative numbers
        predictions.forEach((pred) => {
          expect(typeof pred).toBe("number");
          expect(pred).toBeGreaterThanOrEqual(0);
        });

        // Check model metadata
        const metadata = model.getMetadata();
        expect(metadata.accuracy).toBeGreaterThanOrEqual(0.85);
        expect(metadata.type).toBe("tax_liability");
      });

      it("should handle high-income profiles correctly", async () => {
        const model = await modelRegistry.loadModel("tax_liability");
        const highIncomeProfile = {
          gross_salary: 5000000,
          business_income: 2000000,
          capital_gains: 1000000,
          other_income: 500000,
          total_income: 8500000,
          total_deductions: 400000,
          deduction_ratio: 0.047,
          section_80c_used: 150000,
          section_80c_capacity_used_pct: 100,
          section_80d_used: 50000,
          section_80e_used: 0,
          section_80g_used: 0,
          age: 45,
          age_group: 2,
          is_senior: 0,
          is_metro: 1,
          residential_status: 0,
          income_growth_yoy: 0.15,
          income_stability_score: 0.85,
          regime_preference: 0,
          regime_changes_count: 1,
          previous_regime: 1,
          has_house_property: 1,
          house_property_count: 1,
          house_property_income: 600000,
          house_property_loss: 0,
          income_concentration: 0.6,
          audit_risk_flags: 1,
        };

        const prediction = await model.predict(highIncomeProfile);
        expect(prediction).toBeGreaterThan(1000000);
        expect(prediction).toBeLessThan(3000000);
      });
    });

    describe("Quarterly Tax Forecaster", () => {
      it("should forecast quarterly tax liabilities", async () => {
        const model = await modelRegistry.loadModel("quarterly_tax_forecaster");
        const profile = dataGenerator.generateProfiles(1)[0];

        const forecast = await model.predict(profile);
        expect(Array.isArray(forecast)).toBe(true);
        expect(forecast.length).toBe(4); // Q1-Q4
      });

      it("should sum quarterly to approximately annual tax", async () => {
        const model = await modelRegistry.loadModel("quarterly_tax_forecaster");
        const annualModel = await modelRegistry.loadModel("tax_liability");
        const profile = dataGenerator.generateProfiles(1)[0];

        const quarterly = (await model.predict(profile)) as number[];
        const annual = await annualModel.predict(profile);

        const quarterlySum = quarterly.reduce((a, b) => a + b, 0);
        const variance = Math.abs(quarterlySum - annual) / annual;

        expect(variance).toBeLessThan(0.2); // Within 20%
      });
    });

    describe("Income Anomaly Detector", () => {
      it("should detect normal income profiles", async () => {
        const model = await modelRegistry.loadModel("income_anomaly_detector");
        const normalProfiles = dataGenerator.generateProfiles(10);

        const scores = await Promise.all(
          normalProfiles.map((p) => model.predict(p))
        );

        // Most should have low anomaly scores
        const lowAnomalyCount = scores.filter((s) => s < 0.5).length;
        expect(lowAnomalyCount).toBeGreaterThan(5);
      });

      it("should flag high-income concentration as anomaly", async () => {
        const model = await modelRegistry.loadModel("income_anomaly_detector");
        const anomalousProfile = dataGenerator.generateProfiles(1)[0];
        anomalousProfile.income_concentration = 0.95; // Very high
        anomalousProfile.income_growth_yoy = 1.5; // Massive growth

        const score = await model.predict(anomalousProfile);
        expect(score).toBeGreaterThan(0.3);
      });
    });

    describe("Audit Risk Scorer", () => {
      it("should score audit risk between 0 and 1", async () => {
        const model = await modelRegistry.loadModel("audit_risk_scorer");
        const profiles = dataGenerator.generateProfiles(20);

        for (const profile of profiles) {
          const risk = await model.predict(profile);
          expect(risk).toBeGreaterThanOrEqual(0);
          expect(risk).toBeLessThanOrEqual(1);
        }
      });

      it("should increase risk for high-risk profiles", async () => {
        const model = await modelRegistry.loadModel("audit_risk_scorer");

        const lowRiskProfile = dataGenerator.generateProfiles(1)[0];
        lowRiskProfile.income_concentration = 0.3;
        lowRiskProfile.deduction_ratio = 0.1;
        lowRiskProfile.audit_risk_flags = 0;

        const highRiskProfile = dataGenerator.generateProfiles(1)[0];
        highRiskProfile.income_concentration = 0.9;
        highRiskProfile.deduction_ratio = 0.5;
        highRiskProfile.audit_risk_flags = 3;

        const lowRisk = await model.predict(lowRiskProfile);
        const highRisk = await model.predict(highRiskProfile);

        expect(highRisk).toBeGreaterThan(lowRisk);
      });
    });
  });

  describe("Optimization Models", () => {
    describe("Deduction Maximizer", () => {
      it("should suggest maximum deductions", async () => {
        const model = await modelRegistry.loadModel("deduction_optimizer");
        const profile = dataGenerator.generateProfiles(1)[0];

        const suggestion = await model.predict(profile);
        expect(suggestion).toBeGreaterThan(0);
        expect(suggestion).toBeLessThanOrEqual(400000); // Max for all sections
      });

      it("should suggest more for higher-income profiles", async () => {
        const model = await modelRegistry.loadModel("deduction_optimizer");

        const lowIncomeProfile = dataGenerator.generateProfiles(1)[0];
        lowIncomeProfile.gross_salary = 500000;

        const highIncomeProfile = dataGenerator.generateProfiles(1)[0];
        highIncomeProfile.gross_salary = 2000000;

        const lowSuggestion = await model.predict(lowIncomeProfile);
        const highSuggestion = await model.predict(highIncomeProfile);

        expect(highSuggestion).toBeGreaterThan(lowSuggestion);
      });
    });

    describe("Tax Loss Harvester", () => {
      it("should calculate harvest benefit", async () => {
        const model = await modelRegistry.loadModel("tax_loss_harvester");
        const profile = dataGenerator.generateProfiles(1)[0];

        const benefit = await model.predict(profile);
        expect(benefit).toBeGreaterThanOrEqual(0);
      });

      it("should scale with capital gains", async () => {
        const model = await modelRegistry.loadModel("tax_loss_harvester");

        const noGainsProfile = dataGenerator.generateProfiles(1)[0];
        noGainsProfile.capital_gains = 0;

        const withGainsProfile = dataGenerator.generateProfiles(1)[0];
        withGainsProfile.capital_gains = 500000;

        const noBenefit = await model.predict(noGainsProfile);
        const withBenefit = await model.predict(withGainsProfile);

        expect(withBenefit).toBeGreaterThan(noBenefit);
      });
    });

    describe("Regime Recommender", () => {
      it("should recommend either new (0) or old (1) regime", async () => {
        const model = await modelRegistry.loadModel("regime_recommender");
        const profiles = dataGenerator.generateProfiles(10);

        for (const profile of profiles) {
          const recommendation = await model.predict(profile);
          expect([0, 1]).toContain(recommendation);
        }
      });

      it("should return probabilities via predictProba", async () => {
        const model = await modelRegistry.loadModel("regime_recommender") as any;
        const profile = dataGenerator.generateProfiles(1)[0];

        const proba = await model.predictProba(profile);
        expect(proba.new_regime).toBeGreaterThanOrEqual(0);
        expect(proba.old_regime).toBeGreaterThanOrEqual(0);
        expect(proba.new_regime + proba.old_regime).toBeCloseTo(1, 2);
      });
    });
  });

  describe("Compliance & Strategy Models", () => {
    describe("Estimated Tax Planner", () => {
      it("should calculate quarterly tax payments", async () => {
        const model = await modelRegistry.loadModel("estimated_tax_planner");
        const profile = dataGenerator.generateProfiles(1)[0];

        const quarterlyPayment = await model.predict(profile);
        expect(quarterlyPayment).toBeGreaterThanOrEqual(0);
      });
    });

    describe("Expense Classifier", () => {
      it("should classify expenses into categories", async () => {
        const model = await modelRegistry.loadModel("expense_classifier");
        const profile = dataGenerator.generateProfiles(1)[0];

        const category = await model.predict(profile);
        expect(typeof category).toBe("number");
        expect(category).toBeGreaterThanOrEqual(0);
        expect(category).toBeLessThan(10);
      });
    });

    describe("Depreciation Optimizer", () => {
      it("should recommend depreciation method", async () => {
        const model = await modelRegistry.loadModel("depreciation_optimizer");
        const profile = dataGenerator.generateProfiles(1)[0];

        const method = await model.predict(profile);
        expect([0, 1, 2]).toContain(method); // 0: Section 179, 1: MACRS, 2: Straight-line
      });
    });

    describe("Retirement Savings Optimizer", () => {
      it("should recommend contribution amount", async () => {
        const model = await modelRegistry.loadModel("retirement_savings_optimizer");
        const profile = dataGenerator.generateProfiles(1)[0];

        const contribution = await model.predict(profile);
        expect(contribution).toBeGreaterThan(0);
        expect(contribution).toBeLessThanOrEqual(30000); // 2024 catch-up limit
      });
    });

    describe("International Tax Planner", () => {
      it("should calculate treaty benefit savings", async () => {
        const model = await modelRegistry.loadModel("international_tax_planner");
        const profile = dataGenerator.generateProfiles(1)[0];

        const savings = await model.predict(profile);
        expect(savings).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe("Model Registry", () => {
    it("should have all 15 models registered", async () => {
      const models = modelRegistry.getAllModelTypes();
      expect(models.length).toBe(15);
    });

    it("should load all models successfully", async () => {
      const models = modelRegistry.getAllModelTypes();
      for (const modelType of models) {
        const model = await modelRegistry.loadModel(modelType);
        expect(model).toBeDefined();
        expect(model.isReady()).toBe(true);
      }
    });

    it("should return model metadata", async () => {
      const metadata = await modelRegistry.getModelMetadata("tax_liability");
      expect(metadata.type).toBe("tax_liability");
      expect(metadata.accuracy).toBeGreaterThan(0);
      expect(metadata.version).toBeDefined();
    });

    it("should perform health check", async () => {
      const health = await modelRegistry.healthCheck();
      expect(Object.keys(health).length).toBe(15);

      // All should be healthy
      Object.values(health).forEach((isHealthy) => {
        expect(isHealthy).toBe(true);
      });
    });
  });

  describe("Batch Predictions", () => {
    it("should process multiple profiles", async () => {
      const profiles = dataGenerator.generateProfiles(100);
      const model = await modelRegistry.loadModel("tax_liability");

      const predictions = await model.batchPredict(profiles);
      expect(predictions.length).toBe(100);
      predictions.forEach((pred) => {
        expect(typeof pred).toBe("number");
      });
    });

    it("should handle large batches (1000+)", async () => {
      const profiles = dataGenerator.generateProfiles(1000);
      const model = await modelRegistry.loadModel("tax_liability");

      const startTime = Date.now();
      const predictions = await model.batchPredict(profiles);
      const elapsed = Date.now() - startTime;

      expect(predictions.length).toBe(1000);
      expect(elapsed).toBeLessThan(60000); // Should process 1000 in < 60 seconds
    });
  });

  describe("Inference Performance", () => {
    it("should make predictions in < 100ms", async () => {
      const model = await modelRegistry.loadModel("tax_liability");
      const profile = dataGenerator.generateProfiles(1)[0];

      const startTime = Date.now();
      await model.predict(profile);
      const elapsed = Date.now() - startTime;

      expect(elapsed).toBeLessThan(100);
    });

    it("should cache models for fast subsequent calls", async () => {
      const model1 = await modelRegistry.loadModel("tax_liability");
      const model2 = await modelRegistry.loadModel("tax_liability");

      // Should be the same instance (cached)
      expect(model1).toBe(model2);
    });
  });

  describe("Feature Engineering", () => {
    it("should extract 50+ features from profile", () => {
      const profile: any = dataGenerator.generateProfiles(1)[0];
      const features = FeatureEngineer.extractFeatures({ ...profile });

      // Should have many features
      expect(Object.keys(features).length).toBeGreaterThan(50);
    });

    it("should normalize features appropriately", () => {
      const profile: any = dataGenerator.generateProfiles(1)[0];
      const features = FeatureEngineer.extractFeatures({ ...profile });

      // Age should be within reasonable range
      expect(features.age).toBeGreaterThanOrEqual(18);
      expect(features.age).toBeLessThanOrEqual(120);

      // Ratios should be 0-1
      expect(features.deduction_ratio).toBeGreaterThanOrEqual(0);
      expect(features.deduction_ratio).toBeLessThanOrEqual(1);
    });
  });
});
