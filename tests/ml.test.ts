/**
 * ML System Tests
 * Comprehensive test suite for ML pipeline, models, and predictions
 */

import { describe, it, expect, beforeEach } from "vitest";
import { FeatureEngineer, FeatureScaler, DataSplitter } from "@/lib/ml/pipeline/feature-engineering";
import { DataCollector, SyntheticDataGenerator } from "@/lib/ml/pipeline/data-collection";
import { RuleBasedModel } from "@/lib/ml/models/base-model";
import { InferenceEngine } from "@/lib/ml/inference/model-loader";
import { MLPredictionService } from "@/lib/ml/prediction-service";
import { PerformanceMonitor, DataDriftDetector, RetrainingTrigger } from "@/lib/ml/monitoring/monitor";
import { RecommendationEngine } from "@/lib/ml/recommender/engine";

describe("ML Pipeline - Feature Engineering", () => {
  const mockProfile = {
    age: 35,
    residentialStatus: "resident" as const,
    salary: {
      grossSalary: 1000000,
      basicPlusDA: 600000,
      hraReceived: 150000,
      rentPaid: 150000,
      isMetroCity: true,
      employerNpsContribution: 50000,
      professionalTax: 2500,
    },
    houseProperties: [],
    capitalGains: {
      stcg111A: 0,
      stcgOther: 0,
      ltcg112A: 100000,
      ltcgOther: 0,
    },
    business: undefined,
    otherSources: {
      savingsInterest: 5000,
      fdInterest: 10000,
      dividends: 0,
      familyPension: 0,
      other: 0,
    },
    deductions: {
      section80C: 100000,
      section80CCD1B: 25000,
      section80D_selfFamily: 20000,
      section80D_parents: 15000,
      parentsAreSenior: false,
      section80E: 0,
      section80G: 0,
    },
    taxesPaid: 0,
  };

  it("should extract features from tax profile", () => {
    const features = FeatureEngineer.extractFeatures(mockProfile);

    expect(features.gross_salary).toBe(1000000);
    expect(features.total_income).toBeGreaterThan(0);
    expect(features.total_deductions).toBe(160000);
    expect(features.age).toBe(35);
    expect(features.is_metro).toBe(1);
    expect(features.residentialStatus).toBe(0); // resident
  });

  it("should calculate income concentration correctly", () => {
    const features = FeatureEngineer.extractFeatures(mockProfile);
    expect(features.income_concentration).toBeGreaterThanOrEqual(0);
    expect(features.income_concentration).toBeLessThanOrEqual(1);
  });

  it("should calculate audit risk flags", () => {
    const features = FeatureEngineer.extractFeatures(mockProfile);
    expect(typeof features.audit_risk_flags).toBe("number");
  });

  it("should scale features correctly", () => {
    const profiles = Array(10).fill(mockProfile);
    const featuresList = profiles.map((p) => FeatureEngineer.extractFeatures(p));

    const scaler = new FeatureScaler("standard");
    const transformed = scaler.fitTransform(featuresList);

    // After scaling, mean should be near 0, std near 1
    expect(transformed.length).toBe(10);

    // Get scaler params
    const params = scaler.getParams();
    expect(params.scaler_type).toBe("standard");
    expect(Object.keys(params.mean).length).toBeGreaterThan(0);
  });

  it("should split data correctly", () => {
    const data = Array(100)
      .fill(null)
      .map((_, i) => ({ id: i }));

    const split = DataSplitter.splitData(data, 0.7, 0.15);

    expect(split.train.length + split.test.length + split.validation.length).toBe(100);
    expect(split.train.length).toBeGreaterThanOrEqual(65);
    expect(split.validation.length).toBeGreaterThanOrEqual(10);
    expect(split.test.length).toBeGreaterThanOrEqual(15);
  });
});

describe("ML Pipeline - Data Collection", () => {
  it("should collect data points", () => {
    const profile = {
      age: 40,
      residentialStatus: "resident" as const,
      salary: {
        grossSalary: 2000000,
        basicPlusDA: 1200000,
        hraReceived: 300000,
        rentPaid: 300000,
        isMetroCity: true,
        employerNpsContribution: 100000,
        professionalTax: 2500,
      },
      houseProperties: [],
      deductions: {
        section80C: 150000,
        section80CCD1B: 50000,
        section80D_selfFamily: 25000,
        section80D_parents: 25000,
        parentsAreSenior: true,
        section80E: 0,
        section80G: 0,
      },
      taxesPaid: 500000,
    };

    const dataPoint = DataCollector.collectDataPoint("profile_123", profile as any, "FY2025-26", {
      actual_tax_liability: 450000,
    });

    expect(dataPoint.profile_id).toBe("profile_123");
    expect(dataPoint.fy).toBe("FY2025-26");
    expect(dataPoint.features).toBeDefined();
    expect(dataPoint.ground_truth?.actual_tax_liability).toBe(450000);
  });

  it("should generate synthetic profiles", () => {
    const profiles = SyntheticDataGenerator.generateProfiles(50);

    expect(profiles.length).toBe(50);
    expect(profiles[0].age).toBeGreaterThanOrEqual(25);
    expect(profiles[0].salary).toBeDefined();
    expect(profiles[0].deductions).toBeDefined();
  });

  it("should augment training data", () => {
    const profiles = SyntheticDataGenerator.generateProfiles(10);
    const augmented = SyntheticDataGenerator.augmentProfiles(profiles, 3);

    expect(augmented.length).toBeGreaterThan(10);
    expect(augmented.length).toBeLessThanOrEqual(30);
  });

  it("should compute dataset statistics", () => {
    const profiles = SyntheticDataGenerator.generateProfiles(100);
    const dataPoints = profiles.map((p, i) => DataCollector.collectDataPoint(`profile_${i}`, p, "FY2025-26"));

    const stats = DataCollector.computeStats(dataPoints);

    expect(stats.total_samples).toBe(100);
    expect(stats.feature_count).toBeGreaterThan(0);
    expect(Object.keys(stats.null_value_pct).length).toBeGreaterThan(0);
    expect(stats.train_samples + stats.test_samples + stats.validation_samples).toBeLessThanOrEqual(100);
  });
});

describe("ML Models - Base Implementation", () => {
  it("should create and use rule-based model", async () => {
    const model = new RuleBasedModel({
      type: "tax_liability",
      algorithm: "rule_based",
      hyperparameters: {},
      feature_names: [],
    });

    await model.load();
    expect(model.isReady()).toBe(true);

    const features = FeatureEngineer.extractFeatures({
      age: 35,
      residentialStatus: "resident",
      salary: {
        grossSalary: 1000000,
        basicPlusDA: 600000,
        hraReceived: 150000,
        rentPaid: 150000,
        isMetroCity: true,
        employerNpsContribution: 50000,
        professionalTax: 2500,
      },
      houseProperties: [],
      deductions: {
        section80C: 100000,
        section80CCD1B: 25000,
        section80D_selfFamily: 20000,
        section80D_parents: 15000,
        parentsAreSenior: false,
        section80E: 0,
        section80G: 0,
      },
      taxesPaid: 0,
    });

    const prediction = await model.predict(features);
    expect(typeof prediction).toBe("number");
    expect(prediction).toBeGreaterThanOrEqual(0);
  });

  it("should get model metadata", async () => {
    const model = new RuleBasedModel({
      type: "tax_liability",
      algorithm: "rule_based",
      hyperparameters: {},
      feature_names: [],
    });

    await model.load();
    const metadata = model.getMetadata();

    expect(metadata.type).toBe("tax_liability");
    expect(metadata.version).toBe("1.0.0");
    expect(metadata.created_at).toBeDefined();
  });
});

describe("ML Inference Engine", () => {
  it("should load models without errors", async () => {
    const engine = InferenceEngine.getInstance();

    const taxModel = await engine.loadModel("tax_liability");
    expect(taxModel).toBeDefined();
    expect(taxModel.isReady()).toBe(true);

    const regimeModel = await engine.loadModel("regime_recommender");
    expect(regimeModel).toBeDefined();
  });

  it("should check model readiness", async () => {
    const engine = InferenceEngine.getInstance();

    const isReady = await engine.isModelReady("tax_liability");
    expect(isReady).toBe(true);
  });
});

describe("ML Prediction Service", () => {
  let service: MLPredictionService;

  beforeEach(() => {
    service = MLPredictionService.getInstance();
  });

  it("should generate predictions for a profile", async () => {
    const profile = {
      age: 35,
      residentialStatus: "resident" as const,
      salary: {
        grossSalary: 1500000,
        basicPlusDA: 900000,
        hraReceived: 225000,
        rentPaid: 225000,
        isMetroCity: true,
        employerNpsContribution: 75000,
        professionalTax: 2500,
      },
      houseProperties: [],
      capitalGains: { stcg111A: 0, stcgOther: 0, ltcg112A: 50000, ltcgOther: 0 },
      deductions: {
        section80C: 120000,
        section80CCD1B: 30000,
        section80D_selfFamily: 20000,
        section80D_parents: 20000,
        parentsAreSenior: false,
        section80E: 0,
        section80G: 0,
      },
      taxesPaid: 0,
    };

    const result = await service.predictForProfile("test_profile_1", profile as any, false);

    expect(result.success).toBe(true);
    expect(result.predictions).toBeDefined();
    expect(result.predictions.length).toBeGreaterThan(0);
    expect(result.processing_time_ms).toBeGreaterThan(0);
  });

  it("should include recommendations when requested", async () => {
    const profile = {
      age: 30,
      residentialStatus: "resident" as const,
      salary: {
        grossSalary: 800000,
        basicPlusDA: 480000,
        hraReceived: 120000,
        rentPaid: 120000,
        isMetroCity: false,
        employerNpsContribution: 40000,
        professionalTax: 2000,
      },
      houseProperties: [],
      deductions: {
        section80C: 50000,
        section80CCD1B: 0,
        section80D_selfFamily: 10000,
        section80D_parents: 0,
        parentsAreSenior: false,
        section80E: 0,
        section80G: 0,
      },
      taxesPaid: 0,
    };

    const result = await service.predictForProfile("test_profile_2", profile as any, true);

    expect(result.success).toBe(true);
    expect(result.recommendations).toBeDefined();
  });
});

describe("ML Monitoring - Performance Tracker", () => {
  it("should record and retrieve metrics", () => {
    const monitor = new PerformanceMonitor();

    const metric = {
      timestamp: new Date(),
      model_type: "tax_liability" as const,
      mae: 20000,
      rmse: 25000,
      mape: 10,
      r2_score: 0.90,
      predictions_count: 500,
    };

    monitor.recordMetric(metric);
    const summary = monitor.getSummary("tax_liability");

    expect(summary.current).toBeDefined();
    expect(summary.current?.mae).toBe(20000);
  });

  it("should detect performance degradation", () => {
    const monitor = new PerformanceMonitor();

    // Record metrics showing degradation
    for (let i = 0; i < 10; i++) {
      monitor.recordMetric({
        timestamp: new Date(),
        model_type: "tax_liability",
        mae: 15000,
        rmse: 20000,
        mape: 8,
        r2_score: 0.92,
        predictions_count: 100,
      });
    }

    // Add degraded metrics
    for (let i = 0; i < 5; i++) {
      monitor.recordMetric({
        timestamp: new Date(),
        model_type: "tax_liability",
        mae: 30000,
        rmse: 40000,
        mape: 16,
        r2_score: 0.75,
        predictions_count: 100,
      });
    }

    const degradation = monitor.checkDegradation("tax_liability");
    expect(degradation).toBeDefined();
  });
});

describe("ML Monitoring - Data Drift Detection", () => {
  it("should detect mean shift in features", () => {
    const detector = new DataDriftDetector();

    // Set reference stats
    detector.setReference("gross_salary", {
      min: 500000,
      max: 3000000,
      mean: 1500000,
      std: 500000,
    });

    // Create features with shifted mean
    const features = Array(100)
      .fill(null)
      .map((_, i) => ({
        gross_salary: 2500000 + Math.random() * 500000, // Shifted mean
        investment_income: 100000,
        capital_gains: 50000,
        business_income: 0,
        other_income: 0,
        total_income: 2650000,
        section_80c_used: 100000,
        section_80c_capacity_used_pct: 67,
        section_80d_used: 20000,
        section_80e_used: 0,
        section_80g_used: 0,
        total_deductions: 120000,
        deduction_ratio: 0.045,
        age: 35,
        age_group: 2,
        is_senior: 0,
        is_metro: 1,
        residential_status: 0,
        income_growth_yoy: 10,
        income_stability_score: 80,
        regime_preference: 0,
        regime_changes_count: 0,
        previous_regime: 0,
        has_house_property: 0,
        house_property_count: 0,
        house_property_income: 0,
        house_property_loss: 0,
        income_concentration: 0.6,
        audit_risk_flags: 1,
      }));

    const alerts = detector.detectDrift(features as any);
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].drift_type).toBe("mean_shift");
  });
});

describe("ML Monitoring - Retraining Triggers", () => {
  it("should trigger retraining based on time", () => {
    const trigger = new RetrainingTrigger();

    const check = trigger.shouldRetrain("tax_liability");
    expect(check.should_retrain).toBe(true);
    expect(check.reasons.length).toBeGreaterThan(0);
  });

  it("should record training and check next training time", () => {
    const trigger = new RetrainingTrigger();

    trigger.recordTraining("tax_liability");
    const check = trigger.shouldRetrain("tax_liability");
    // Should not need retraining immediately after training
    expect(check.reasons.some((r) => r.includes("No training"))).toBe(false);

    const nextTraining = trigger.getNextScheduledTraining("tax_liability");
    expect(nextTraining.getTime()).toBeGreaterThan(Date.now());
  });
});

describe("ML Recommendation Engine", () => {
  it("should generate personalized recommendations", async () => {
    const engine = new RecommendationEngine();

    const profile = {
      age: 40,
      residentialStatus: "resident" as const,
      salary: {
        grossSalary: 1500000,
        basicPlusDA: 900000,
        hraReceived: 225000,
        rentPaid: 225000,
        isMetroCity: true,
        employerNpsContribution: 75000,
        professionalTax: 2500,
      },
      houseProperties: [],
      capitalGains: { stcg111A: 0, stcgOther: 0, ltcg112A: 0, ltcgOther: 0 },
      deductions: {
        section80C: 50000,
        section80CCD1B: 0,
        section80D_selfFamily: 15000,
        section80D_parents: 0,
        parentsAreSenior: false,
        section80E: 0,
        section80G: 0,
      },
      taxesPaid: 0,
    };

    const recommendations = await engine.generateRecommendations({
      profileId: "test_profile",
      profile: profile as any,
      predictions: {},
    });

    expect(Array.isArray(recommendations)).toBe(true);
  });
});
