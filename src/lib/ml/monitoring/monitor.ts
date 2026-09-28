/**
 * Model Monitoring and Alert System
 * Tracks model performance, data drift, and triggers retraining
 */

import { type PredictionMetrics, type DataDriftAlert, type ModelPerformanceDegradation, type ModelType, type TaxpayerFeatures } from "../types";

/**
 * Performance monitor for predictions
 */
export class PerformanceMonitor {
  private metrics: Map<ModelType, PredictionMetrics[]> = new Map();
  private alertThresholds = {
    mae_degradation: 0.15, // 15% increase in error
    accuracy_degradation: 0.05, // 5% drop in accuracy
    prediction_latency: 100, // 100ms
  };

  /**
   * Record prediction metric
   */
  recordMetric(metric: PredictionMetrics): void {
    if (!this.metrics.has(metric.model_type)) {
      this.metrics.set(metric.model_type, []);
    }

    this.metrics.get(metric.model_type)!.push(metric);

    // Keep only recent 1000 records per model
    const modelMetrics = this.metrics.get(metric.model_type)!;
    if (modelMetrics.length > 1000) {
      modelMetrics.shift();
    }
  }

  /**
   * Get performance summary
   */
  getSummary(modelType: ModelType): { current: PredictionMetrics | null; trend: "improving" | "stable" | "degrading" } {
    const modelMetrics = this.metrics.get(modelType) || [];
    if (modelMetrics.length === 0) return { current: null, trend: "stable" };

    const current = modelMetrics[modelMetrics.length - 1];
    const previous = modelMetrics[Math.max(0, modelMetrics.length - 11)];

    let trend: "improving" | "stable" | "degrading" = "stable";

    if (modelMetrics.length >= 11) {
      const currentAccuracy = current.accuracy || current.r2_score;
      const previousAccuracy = previous.accuracy || previous.r2_score;

      if (currentAccuracy > previousAccuracy * 1.02) {
        trend = "improving";
      } else if (currentAccuracy < previousAccuracy * 0.95) {
        trend = "degrading";
      }
    }

    return { current, trend };
  }

  /**
   * Detect performance degradation
   */
  checkDegradation(modelType: ModelType): ModelPerformanceDegradation | null {
    const modelMetrics = this.metrics.get(modelType) || [];
    if (modelMetrics.length < 10) return null;

    const recent = modelMetrics.slice(-10);
    const older = modelMetrics.slice(-20, -10);

    if (older.length === 0) return null;

    const recentAvgAccuracy = recent.reduce((a, b) => a + (b.accuracy || b.r2_score), 0) / recent.length;
    const olderAvgAccuracy = older.reduce((a, b) => a + (b.accuracy || b.r2_score), 0) / older.length;

    const degradationPct = ((olderAvgAccuracy - recentAvgAccuracy) / olderAvgAccuracy) * 100;

    if (degradationPct > this.alertThresholds.accuracy_degradation * 100) {
      return {
        alert_id: `perf_degrad_${modelType}_${Date.now()}`,
        timestamp: new Date(),
        model_type: modelType,
        previous_metric: olderAvgAccuracy,
        current_metric: recentAvgAccuracy,
        metric_name: "accuracy",
        degradation_pct: degradationPct,
        samples_since_training: recent.length * 100, // Estimate
        recommendation: `Model ${modelType} accuracy has degraded. Consider retraining with recent data.`,
      };
    }

    return null;
  }

  /**
   * Get metrics history
   */
  getHistory(modelType: ModelType, limit = 100): PredictionMetrics[] {
    const modelMetrics = this.metrics.get(modelType) || [];
    return modelMetrics.slice(-limit);
  }
}

/**
 * Data drift detection
 */
export class DataDriftDetector {
  private referenceStats: Map<string, { min: number; max: number; mean: number; std: number }> = new Map();
  private driftThreshold = 3; // 3 standard deviations
  private alerts: DataDriftAlert[] = [];

  /**
   * Set reference distribution (from training data)
   */
  setReference(featureName: string, stats: { min: number; max: number; mean: number; std: number }): void {
    this.referenceStats.set(featureName, stats);
  }

  /**
   * Detect drift in a batch of features
   */
  detectDrift(features: TaxpayerFeatures[]): DataDriftAlert[] {
    const driftAlerts: DataDriftAlert[] = [];

    // Calculate current statistics
    const featureKeys = Object.keys(features[0]) as (keyof TaxpayerFeatures)[];

    for (const featureName of featureKeys) {
      const values = features.map((f) => f[featureName] as number).filter((v) => !isNaN(v) && v !== null);

      if (values.length === 0 || !this.referenceStats.has(featureName)) {
        continue;
      }

      const currentMean = values.reduce((a, b) => a + b, 0) / values.length;
      const currentStd = Math.sqrt(values.reduce((acc, val) => acc + Math.pow(val - currentMean, 2), 0) / values.length);
      const currentMin = Math.min(...values);
      const currentMax = Math.max(...values);

      const referenceStats = this.referenceStats.get(featureName)!;

      // Detect mean shift
      const meanDiff = Math.abs(currentMean - referenceStats.mean);
      const zScore = referenceStats.std > 0 ? meanDiff / referenceStats.std : 0;

      if (zScore > this.driftThreshold) {
        const alert: DataDriftAlert = {
          alert_id: `drift_${featureName}_${Date.now()}`,
          timestamp: new Date(),
          feature_name: featureName,
          drift_score: Math.min(1, zScore / (this.driftThreshold * 2)),
          drift_type: "mean_shift",
          reference_stats: referenceStats,
          current_stats: {
            min: currentMin,
            max: currentMax,
            mean: currentMean,
            std: currentStd,
          },
          recommendation: `Feature ${featureName} shows significant drift. Investigate data source and consider retraining.`,
        };
        driftAlerts.push(alert);
      }

      // Detect distribution shift (range expansion)
      const rangeExpansion = (currentMax - currentMin) / (referenceStats.max - referenceStats.min);
      if (rangeExpansion > 1.5) {
        const alert: DataDriftAlert = {
          alert_id: `range_shift_${featureName}_${Date.now()}`,
          timestamp: new Date(),
          feature_name: featureName,
          drift_score: Math.min(1, (rangeExpansion - 1) / 0.5),
          drift_type: "distribution_shift",
          reference_stats: referenceStats,
          current_stats: {
            min: currentMin,
            max: currentMax,
            mean: currentMean,
            std: currentStd,
          },
          recommendation: `Feature ${featureName} shows increased variability. Update data preprocessing if needed.`,
        };
        driftAlerts.push(alert);
      }
    }

    this.alerts = [...this.alerts, ...driftAlerts].slice(-100); // Keep last 100
    return driftAlerts;
  }

  /**
   * Get recent drift alerts
   */
  getAlerts(limit = 10): DataDriftAlert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * Clear old alerts
   */
  clearOldAlerts(olderThan: Date): void {
    this.alerts = this.alerts.filter((a) => a.timestamp > olderThan);
  }
}

/**
 * Model health checker
 */
export class ModelHealthChecker {
  private performanceMonitor: PerformanceMonitor;
  private driftDetector: DataDriftDetector;

  constructor(performanceMonitor: PerformanceMonitor, driftDetector: DataDriftDetector) {
    this.performanceMonitor = performanceMonitor;
    this.driftDetector = driftDetector;
  }

  /**
   * Overall system health status
   */
  getHealthStatus(): "healthy" | "warning" | "critical" {
    const alerts = this.driftDetector.getAlerts();
    const criticalAlerts = alerts.filter((a) => a.drift_score > 0.8);

    if (criticalAlerts.length > 2) {
      return "critical";
    }

    if (alerts.length > 5) {
      return "warning";
    }

    return "healthy";
  }

  /**
   * Get comprehensive health report
   */
  getHealthReport(): {
    status: "healthy" | "warning" | "critical";
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    const alerts = this.driftDetector.getAlerts();

    // Check for data drift
    if (alerts.length > 0) {
      issues.push(`${alerts.length} data drift alerts detected`);
      if (alerts.length > 5) {
        recommendations.push("Multiple drift alerts suggest possible data quality issue or significant distribution change");
      }
    }

    // Check for high drift scores
    const highDriftAlerts = alerts.filter((a) => a.drift_score > 0.8);
    if (highDriftAlerts.length > 0) {
      issues.push(`${highDriftAlerts.length} severe drift alert(s)`);
      recommendations.push("Consider retraining models with recent data");
    }

    // Check model performance (would need model-specific checks)
    const status = this.getHealthStatus();

    if (status === "critical" && recommendations.length === 0) {
      recommendations.push("System has critical issues. Immediate attention required.");
    }

    return {
      status,
      issues,
      recommendations,
    };
  }
}

/**
 * Retraining trigger detection
 */
export class RetrainingTrigger {
  private lastTraining: Map<ModelType, Date> = new Map();
  private retrainingIntervalDays = 30;
  private triggerConditions = {
    max_degradation: 0.1, // 10% accuracy drop
    max_drift_score: 0.85,
    min_samples_since_training: 1000,
  };

  /**
   * Check if retraining is needed
   */
  shouldRetrain(
    modelType: ModelType,
    currentMetrics?: PredictionMetrics,
    driftAlerts?: DataDriftAlert[],
    sampleCount?: number
  ): { should_retrain: boolean; reasons: string[] } {
    const reasons: string[] = [];

    // Check time-based trigger
    const lastTrain = this.lastTraining.get(modelType);
    if (!lastTrain || new Date().getTime() - lastTrain.getTime() > this.retrainingIntervalDays * 24 * 60 * 60 * 1000) {
      reasons.push(`No training in ${this.retrainingIntervalDays} days`);
    }

    // Check drift-based trigger
    if (driftAlerts && driftAlerts.length > 0) {
      const severeAlerts = driftAlerts.filter((a) => a.drift_score > this.triggerConditions.max_drift_score);
      if (severeAlerts.length > 0) {
        reasons.push(`${severeAlerts.length} severe drift alert(s)`);
      }
    }

    // Check sample count trigger
    if (sampleCount && sampleCount > this.triggerConditions.min_samples_since_training) {
      reasons.push(`${sampleCount} new samples since last training`);
    }

    return {
      should_retrain: reasons.length > 0,
      reasons,
    };
  }

  /**
   * Record training completion
   */
  recordTraining(modelType: ModelType): void {
    this.lastTraining.set(modelType, new Date());
  }

  /**
   * Get last training time
   */
  getLastTrainingTime(modelType: ModelType): Date | null {
    return this.lastTraining.get(modelType) || null;
  }

  /**
   * Get next scheduled training
   */
  getNextScheduledTraining(modelType: ModelType): Date {
    const lastTrain = this.lastTraining.get(modelType) || new Date(0);
    return new Date(lastTrain.getTime() + this.retrainingIntervalDays * 24 * 60 * 60 * 1000);
  }
}
