/**
 * Base Model Classes and Interfaces
 * Provides foundation for all predictive models
 */

import { type TaxpayerFeatures, type ModelMetadata, type ModelConfig, type ModelPrediction } from "../types";

/**
 * Abstract base class for all ML models
 */
export abstract class BaseModel {
  protected config: ModelConfig;
  protected metadata: ModelMetadata;
  protected isLoaded = false;

  constructor(config: ModelConfig) {
    this.config = config;
    this.metadata = {
      id: `model_${config.type}_${Date.now()}`,
      type: config.type,
      version: "1.0.0",
      created_at: new Date(),
      updated_at: new Date(),
      accuracy: 0,
      training_samples: 0,
      input_features: config.feature_names,
      output_type: this.getOutputType(),
      performance_metrics: {},
    };
  }

  /**
   * Load model from disk/cache
   */
  abstract load(): Promise<void>;

  /**
   * Make a single prediction
   */
  abstract predict(features: TaxpayerFeatures): Promise<number | number[] | Record<string, number>>;

  /**
   * Batch predictions
   */
  async batchPredict(featuresList: TaxpayerFeatures[]): Promise<Array<number | number[] | Record<string, number>>> {
    return Promise.all(featuresList.map((f) => this.predict(f)));
  }

  /**
   * Get model metadata
   */
  getMetadata(): ModelMetadata {
    return this.metadata;
  }

  /**
   * Update model performance metrics
   */
  updateMetrics(metrics: Record<string, number>): void {
    this.metadata.performance_metrics = metrics;
    if (metrics.accuracy) this.metadata.accuracy = metrics.accuracy;
    this.metadata.updated_at = new Date();
  }

  /**
   * Check if model is ready
   */
  isReady(): boolean {
    return this.isLoaded;
  }

  /**
   * Get feature names
   */
  getFeatures(): string[] {
    return this.config.feature_names;
  }

  /**
   * Output type for this model
   */
  abstract getOutputType(): string;

  /**
   * Feature scaling if needed
   */
  protected normalizeFeatures(features: TaxpayerFeatures): number[] {
    return this.config.feature_names.map((name) => {
      const val = features[name as keyof TaxpayerFeatures];
      return typeof val === "number" ? val : 0;
    });
  }
}

/**
 * Regression model (continuous output)
 */
export abstract class RegressionModel extends BaseModel {
  getOutputType(): string {
    return "regression";
  }

  abstract predict(features: TaxpayerFeatures): Promise<number>;

  async batchPredict(featuresList: TaxpayerFeatures[]): Promise<number[]> {
    return Promise.all(featuresList.map((f) => this.predict(f)));
  }
}

/**
 * Classification model (discrete output)
 */
export abstract class ClassificationModel extends BaseModel {
  protected numClasses: number;

  constructor(config: ModelConfig, numClasses = 2) {
    super(config);
    this.numClasses = numClasses;
  }

  getOutputType(): string {
    return "classification";
  }

  /**
   * Predict class and probabilities
   */
  async predictProba(features: TaxpayerFeatures): Promise<Record<string, number>> {
    const prediction = await this.predict(features);
    if (typeof prediction === "object" && !Array.isArray(prediction)) {
      return prediction;
    }
    return {};
  }

  /**
   * Batch predictions with probabilities
   */
  async batchPredictProba(featuresList: TaxpayerFeatures[]): Promise<Array<Record<string, number>>> {
    return Promise.all(featuresList.map((f) => this.predictProba(f)));
  }
}

/**
 * Anomaly detection model (unsupervised)
 */
export abstract class AnomalyDetectionModel extends BaseModel {
  getOutputType(): string {
    return "anomaly_detection";
  }

  /**
   * Get anomaly score (0-1)
   */
  abstract predict(features: TaxpayerFeatures): Promise<number>;

  /**
   * Batch anomaly detection
   */
  async batchPredict(featuresList: TaxpayerFeatures[]): Promise<number[]> {
    return Promise.all(featuresList.map((f) => this.predict(f)));
  }

  /**
   * Flag anomalies above threshold
   */
  async detectAnomalies(featuresList: TaxpayerFeatures[], threshold = 0.7): Promise<Array<{ index: number; score: number }>> {
    const scores = await this.batchPredict(featuresList);
    return scores
      .map((score, index) => ({ index, score }))
      .filter((item) => item.score > threshold)
      .sort((a, b) => b.score - a.score);
  }
}

/**
 * Neural network model (for time-series/forecasting)
 */
export abstract class NeuralNetworkModel extends BaseModel {
  protected lookback = 12; // Default 12-month lookback

  constructor(config: ModelConfig, lookback = 12) {
    super(config);
    this.lookback = lookback;
  }

  getOutputType(): string {
    return "neural_network";
  }

  /**
   * Sequential prediction (e.g., time series)
   */
  abstract predict(features: TaxpayerFeatures): Promise<number[] | number>;

  /**
   * Generate sequence predictions
   */
  async predictSequence(featureSequence: TaxpayerFeatures[], steps = 6): Promise<number[]> {
    const predictions: number[] = [];
    let currentFeatures = featureSequence[featureSequence.length - 1];

    for (let i = 0; i < steps; i++) {
      const pred = await this.predict(currentFeatures);
      const value = Array.isArray(pred) ? pred[0] : pred;
      predictions.push(value);

      // Update features for next iteration (simplified)
      currentFeatures = { ...currentFeatures };
    }

    return predictions;
  }
}

/**
 * Simple rule-based fallback model
 */
export class RuleBasedModel extends RegressionModel {
  async load(): Promise<void> {
    this.isLoaded = true;
  }

  async predict(features: TaxpayerFeatures): Promise<number> {
    // Simple rule-based tax prediction as fallback
    const baseIncome = features.gross_salary + features.business_income + features.other_income;
    const totalDeductions = features.total_deductions;
    const taxableIncome = Math.max(0, baseIncome - totalDeductions);

    // Simplified tax slab calculation
    let tax = 0;
    if (taxableIncome <= 250000) {
      tax = 0;
    } else if (taxableIncome <= 500000) {
      tax = (taxableIncome - 250000) * 0.05;
    } else if (taxableIncome <= 750000) {
      tax = 12500 + (taxableIncome - 500000) * 0.1;
    } else if (taxableIncome <= 1000000) {
      tax = 37500 + (taxableIncome - 750000) * 0.15;
    } else if (taxableIncome <= 1250000) {
      tax = 75000 + (taxableIncome - 1000000) * 0.2;
    } else if (taxableIncome <= 1500000) {
      tax = 125000 + (taxableIncome - 1250000) * 0.25;
    } else {
      tax = 187500 + (taxableIncome - 1500000) * 0.3;
    }

    return tax;
  }

  getOutputType(): string {
    return "rule_based";
  }
}
