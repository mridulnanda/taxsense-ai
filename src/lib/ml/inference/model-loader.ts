/**
 * Model Loader and Inference Engine
 * Manages model lifecycle, caching, and inference
 */

import { type TaxpayerFeatures, type ModelMetadata, type ModelType } from "../types";
import { BaseModel, RuleBasedModel, RegressionModel, ClassificationModel, AnomalyDetectionModel } from "../models/base-model";

/**
 * In-memory model cache with TTL
 */
class ModelCache {
  private cache: Map<string, { model: BaseModel; timestamp: number }> = new Map();
  private ttl = 3600000; // 1 hour in milliseconds

  set(key: string, model: BaseModel): void {
    this.cache.set(key, { model, timestamp: Date.now() });
  }

  get(key: string): BaseModel | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.model;
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

/**
 * Inference engine for all model types
 */
export class InferenceEngine {
  private static instance: InferenceEngine;
  private cache = new ModelCache();
  private fallbackModel: RuleBasedModel;
  private modelRegistry: Map<ModelType, new (config: any) => BaseModel> = new Map();

  private constructor() {
    this.fallbackModel = new RuleBasedModel({
      type: "tax_liability",
      algorithm: "rule_based",
      hyperparameters: {},
      feature_names: [],
    });
  }

  static getInstance(): InferenceEngine {
    if (!InferenceEngine.instance) {
      InferenceEngine.instance = new InferenceEngine();
    }
    return InferenceEngine.instance;
  }

  /**
   * Load a model by type
   */
  async loadModel(modelType: ModelType): Promise<BaseModel> {
    const cacheKey = `model_${modelType}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    let model: BaseModel;

    // In production, this would load from disk/cloud storage
    // For now, use fallback rule-based models
    switch (modelType) {
      case "tax_liability":
        model = new RuleBasedModel({
          type: "tax_liability",
          algorithm: "rule_based",
          hyperparameters: {},
          feature_names: Object.keys(new Object()) as string[],
        });
        break;

      case "regime_recommender":
        model = new RegimeRecommenderFallback({
          type: "regime_recommender",
          algorithm: "logistic_regression",
          hyperparameters: {},
          feature_names: [],
        });
        break;

      case "deduction_optimizer":
        model = new DeductionOptimizerFallback({
          type: "deduction_optimizer",
          algorithm: "gradient_boosting",
          hyperparameters: {},
          feature_names: [],
        });
        break;

      case "income_anomaly_detector":
        model = new AnomalyDetectorFallback({
          type: "income_anomaly_detector",
          algorithm: "isolation_forest",
          hyperparameters: {},
          feature_names: [],
        });
        break;

      case "audit_risk_scorer":
        model = new AuditRiskScorerFallback({
          type: "audit_risk_scorer",
          algorithm: "logistic_regression",
          hyperparameters: {},
          feature_names: [],
        });
        break;

      case "savings_forecaster":
        model = new SavingsForecastFallback({
          type: "savings_forecaster",
          algorithm: "lstm",
          hyperparameters: {},
          feature_names: [],
        });
        break;

      default:
        throw new Error(`Unknown model type: ${modelType}`);
    }

    await model.load();
    this.cache.set(cacheKey, model);

    return model;
  }

  /**
   * Unload a model to free memory
   */
  unloadModel(modelType: ModelType): void {
    const cacheKey = `model_${modelType}`;
    this.cache.clear(); // Could be optimized to remove only specific model
  }

  /**
   * Get model metadata
   */
  async getModelMetadata(modelType: ModelType): Promise<ModelMetadata> {
    const model = await this.loadModel(modelType);
    return model.getMetadata();
  }

  /**
   * Check if model is available and ready
   */
  async isModelReady(modelType: ModelType): Promise<boolean> {
    try {
      const model = await this.loadModel(modelType);
      return model.isReady();
    } catch {
      return false;
    }
  }
}

/**
 * Fallback implementations for each model type
 */

class RegimeRecommenderFallback extends ClassificationModel {
  constructor(config: any) {
    super(config, 2);
  }

  async load(): Promise<void> {
    this.isLoaded = true;
  }

  async predict(features: TaxpayerFeatures): Promise<0 | 1> {
    // Simple rule: if deduction ratio is high and income is stable, suggest new regime
    const deductionRatio = features.deduction_ratio;
    const incomeStability = features.income_stability_score;

    // New regime typically better for low deduction users
    if (deductionRatio < 0.1 && incomeStability > 80) {
      return 0; // New regime
    }
    if (deductionRatio > 0.2) {
      return 1; // Old regime
    }

    return Math.random() > 0.5 ? 0 : 1;
  }

  async predictProba(features: TaxpayerFeatures): Promise<Record<string, number>> {
    const prediction = await this.predict(features);
    const oldRegimeProb = prediction === 1 ? 0.6 : 0.4;
    return {
      new_regime: 1 - oldRegimeProb,
      old_regime: oldRegimeProb,
    };
  }
}

class DeductionOptimizerFallback extends RegressionModel {
  async load(): Promise<void> {
    this.isLoaded = true;
  }

  async predict(features: TaxpayerFeatures): Promise<number> {
    // Calculate potential deduction increase
    const capacityUsed = features.section_80c_capacity_used_pct;
    if (capacityUsed < 100) {
      return 150000 - features.section_80c_used;
    }
    return 0;
  }
}

class AnomalyDetectorFallback extends AnomalyDetectionModel {
  async load(): Promise<void> {
    this.isLoaded = true;
  }

  async predict(features: TaxpayerFeatures): Promise<number> {
    // Simple anomaly detection: flag high income growth
    const growth = Math.abs(features.income_growth_yoy);
    if (growth > 50) return 0.8;
    if (growth > 30) return 0.5;
    if (growth > 100) return 0.95;

    // Flag if income concentration is high
    const concentration = features.income_concentration;
    if (concentration > 0.8) return 0.7;

    return 0.1;
  }
}

class AuditRiskScorerFallback extends ClassificationModel {
  constructor(config: any) {
    super(config, 1);
  }

  async load(): Promise<void> {
    this.isLoaded = true;
  }

  async predict(features: TaxpayerFeatures): Promise<number> {
    // Calculate audit risk based on flags
    let riskScore = 0;

    // Risk factors
    const riskFactors = features.audit_risk_flags;
    riskScore = Math.min(1, (riskFactors * 0.15) || 0.1);

    // NRI status adds risk
    if (features.residential_status === 1) {
      riskScore += 0.2;
    }

    // High deductions add risk
    if (features.deduction_ratio > 0.3) {
      riskScore += 0.15;
    }

    // Multiple income sources add complexity
    const incomeSources = [features.gross_salary, features.capital_gains, features.business_income].filter((x) => x > 0).length;
    if (incomeSources > 2) {
      riskScore += 0.1;
    }

    return Math.min(1, riskScore);
  }
}

class SavingsForecastFallback extends RegressionModel {
  async load(): Promise<void> {
    this.isLoaded = true;
  }

  async predict(features: TaxpayerFeatures): Promise<number> {
    // Estimate annual tax savings opportunity
    const capacityRemaining = 150000 - features.section_80c_used;
    const potentialSavings = capacityRemaining * 0.3; // 30% tax bracket

    // Add deduction opportunity for other sections
    let additionalSavings = 0;
    if (features.section_80d_used < 50000) {
      additionalSavings += (50000 - features.section_80d_used) * 0.3;
    }

    return Math.max(0, potentialSavings + additionalSavings);
  }
}

/**
 * Batch inference processor
 */
export class BatchInferenceProcessor {
  private engine = InferenceEngine.getInstance();
  private batchSize = 100;
  private timeout = 30000; // 30 seconds

  async processBatch(features: TaxpayerFeatures[], modelType: ModelType): Promise<Array<number | Record<string, number>>> {
    const model = await this.engine.loadModel(modelType);
    const results: Array<number | Record<string, number>> = [];

    for (let i = 0; i < features.length; i += this.batchSize) {
      const batch = features.slice(i, Math.min(i + this.batchSize, features.length));
      const batchResults = await Promise.race([model.batchPredict(batch), this.createTimeout()]);

      if (Array.isArray(batchResults)) {
        results.push(...batchResults);
      } else {
        throw new Error("Batch processing timeout");
      }
    }

    return results;
  }

  private createTimeout(): Promise<never> {
    return new Promise((_, reject) => setTimeout(() => reject(new Error("Batch processing timeout")), this.timeout));
  }

  /**
   * Process multiple features in parallel
   */
  async processParallel(features: TaxpayerFeatures[], modelTypes: ModelType[]): Promise<Map<ModelType, any[]>> {
    const results = new Map<ModelType, any[]>();

    const promises = modelTypes.map(async (modelType) => {
      const model = await this.engine.loadModel(modelType);
      const predictions = await model.batchPredict(features);
      results.set(modelType, predictions);
    });

    await Promise.all(promises);
    return results;
  }
}
