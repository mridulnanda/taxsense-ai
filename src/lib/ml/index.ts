/**
 * ML System - Main Export
 * Barrel export of all ML components for easy access
 */

// Types
export * from "./types";

// Pipeline
export { FeatureEngineer, FeatureScaler, DataSplitter } from "./pipeline/feature-engineering";
export { DataCollector, DataExporter } from "./pipeline/data-collection";
export { SyntheticDataGenerator, generateTrainingData, generateBalancedTrainingSet } from "./pipeline/synthetic-data-generator";

// Models
export { BaseModel, RegressionModel, ClassificationModel, AnomalyDetectionModel, NeuralNetworkModel, RuleBasedModel } from "./models/base-model";
export {
  TaxLiabilityModel,
  QuarterlyTaxForecasterModel,
  IncomeAnomalyDetectorModel,
  AuditRiskScorerModel,
  DeductionMaximizerModel,
  TaxLossHarvesterModel,
  IncomeShiftingOptimizerModel,
  BusinessStructureOptimizerModel,
  CharitableGivingOptimizerModel,
  RegimeRecommenderModel,
  EstimatedTaxPlannerModel,
  ExpenseClassifierModel,
  DepreciationOptimizerModel,
  RetirementSavingsOptimizerModel,
  InternationalTaxPlannerModel,
} from "./models/specialized-models";
export { ModelRegistry, modelRegistry } from "./models/model-registry";

// Inference
export { InferenceEngine, BatchInferenceProcessor } from "./inference/model-loader";

// Recommendations
export { RecommendationEngine, type RecommendationContext } from "./recommender/engine";

// Monitoring
export { PerformanceMonitor, DataDriftDetector, ModelHealthChecker, RetrainingTrigger } from "./monitoring/monitor";

// Prediction Service
export { MLPredictionService } from "./prediction-service";

// Utils
export const ML_VERSION = "1.0.0";
export const ML_BUILD_DATE = new Date().toISOString();

/**
 * Quick start guide:
 *
 * 1. Feature Extraction:
 *    import { FeatureEngineer } from '@/lib/ml';
 *    const features = FeatureEngineer.extractFeatures(taxProfile);
 *
 * 2. Make Predictions:
 *    import { MLPredictionService } from '@/lib/ml';
 *    const service = MLPredictionService.getInstance();
 *    const result = await service.predictForProfile(profileId, profile);
 *
 * 3. Get Recommendations:
 *    const recommendations = result.recommendations;
 *    recommendations.forEach(r => console.log(r.title));
 *
 * 4. Monitor Performance:
 *    import { PerformanceMonitor } from '@/lib/ml';
 *    const monitor = new PerformanceMonitor();
 *    monitor.recordMetric(metric);
 *    const summary = monitor.getSummary('tax_liability');
 *
 * 5. Check System Health:
 *    const response = await fetch('/api/ml/performance');
 *    const health = await response.json();
 *    console.log(health.health_status);
 */
