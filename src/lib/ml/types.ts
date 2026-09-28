/**
 * ML System — Type Definitions and Interfaces
 * Core types for data pipeline, models, and predictions
 */

import { type TaxProfile } from "../tax-engine";

/* ===== Feature Engineering ===== */

export interface TaxpayerFeatures {
  // Income features
  gross_salary: number;
  investment_income: number;
  capital_gains: number;
  business_income: number;
  other_income: number;
  total_income: number;

  // Deduction features
  section_80c_used: number;
  section_80c_capacity_used_pct: number;
  section_80d_used: number;
  section_80e_used: number;
  section_80g_used: number;
  total_deductions: number;
  deduction_ratio: number;

  // Profile features
  age: number;
  age_group: number; // 0: <25, 1: 25-35, 2: 35-50, 3: 50-65, 4: 65+
  is_senior: number;
  is_metro: number;
  residential_status: number; // 0: resident, 1: nri

  // Income volatility
  income_growth_yoy: number;
  income_stability_score: number;

  // History features
  regime_preference: number; // 0: new, 1: old
  regime_changes_count: number;
  previous_regime: number;

  // House property features
  has_house_property: number;
  house_property_count: number;
  house_property_income: number;
  house_property_loss: number;

  // Risk features
  income_concentration: number; // higher = more risk
  audit_risk_flags: number;
}

export interface ModelPrediction {
  model_type: ModelType;
  value: number;
  confidence: number; // 0-1
  explanation: string;
  feature_importance?: Record<string, number>;
  timestamp: Date;
}

export interface TaxLiabilityPrediction extends ModelPrediction {
  model_type: "tax_liability";
  value: number; // predicted tax liability in rupees
  confidence: number;
  range: { lower: number; upper: number }; // confidence interval
}

export interface RegimeRecommendation extends ModelPrediction {
  model_type: "regime_recommender";
  value: 0 | 1; // 0: new regime, 1: old regime
  old_regime_probability: number;
  new_regime_probability: number;
  savings_estimate: number;
}

export interface DeductionOptimization extends ModelPrediction {
  model_type: "deduction_optimizer";
  recommendations: Array<{
    section: string; // "80C", "80D", etc.
    current: number;
    suggested_increase: number;
    potential_savings: number;
    confidence: number;
  }>;
}

export interface AnomalyDetection extends ModelPrediction {
  model_type: "income_anomaly_detector";
  anomaly_score: number; // 0-1
  is_anomaly: boolean;
  explanation: string;
  similar_profiles_count: number;
}

export interface AuditRiskScore extends ModelPrediction {
  model_type: "audit_risk_scorer";
  value: number; // 0-1 probability
  risk_level: "low" | "medium" | "high"; // Computed from value
  risk_factors: Array<{ factor: string; contribution: number }>;
}

export interface SavingsForecast extends ModelPrediction {
  model_type: "savings_forecaster";
  forecast_months: number; // 6 or 12
  forecasted_savings: Array<{
    month: number;
    expected_savings: number;
    confidence_lower: number;
    confidence_upper: number;
  }>;
}

export interface QuarterlyTaxForecast extends ModelPrediction {
  model_type: "quarterly_tax_forecaster";
  quarterly_taxes: Array<{
    quarter: number;
    estimated_tax: number;
    confidence_lower: number;
    confidence_upper: number;
  }>;
}

export interface TaxLossHarvestRecommendation extends ModelPrediction {
  model_type: "tax_loss_harvester";
  suggestions: Array<{
    security_id: string;
    symbol: string;
    current_loss: number;
    harvest_benefit: number;
    wash_sale_risk: number;
  }>;
  total_potential_savings: number;
}

export interface IncomeShiftingOptimization extends ModelPrediction {
  model_type: "income_shifting_optimizer";
  optimal_distribution: Record<string, number>;
  current_tax: number;
  optimized_tax: number;
  total_savings: number;
  strategies: Array<{
    strategy: string;
    tax_savings: number;
    feasibility: number;
  }>;
}

export interface BusinessStructureRecommendation extends ModelPrediction {
  model_type: "business_structure_optimizer";
  recommended_structure: "sole_proprietor" | "partnership" | "llc" | "s_corp" | "c_corp";
  current_tax: number;
  recommended_tax: number;
  annual_tax_savings: number;
  setup_cost: number;
  net_benefit: number;
}

export interface CharitableGivingOptimization extends ModelPrediction {
  model_type: "charitable_giving_optimizer";
  recommended_donation: number;
  tax_benefit: number;
  deduction_capacity_remaining: number;
  strategies: Array<{
    strategy: string;
    donation_amount: number;
    tax_benefit: number;
  }>;
}

export interface EstimatedTaxPlan extends ModelPrediction {
  model_type: "estimated_tax_planner";
  quarterly_payments: Array<{
    quarter: number;
    estimated_payment: number;
    deadline: string;
  }>;
  total_annual_estimate: number;
  payment_frequency: "quarterly" | "monthly" | "annual";
}

export interface ExpenseClassification extends ModelPrediction {
  model_type: "expense_classifier";
  category: string;
  confidence: number;
  is_deductible: boolean;
  deduction_type?: string;
  similar_expenses_count?: number;
}

export interface DepreciationOptimization extends ModelPrediction {
  model_type: "depreciation_optimizer";
  recommended_method: "section_179" | "macrs" | "straight_line";
  asset_category: string;
  annual_deduction: number;
  total_tax_benefit: number;
  recovery_period: number;
}

export interface RetirementSavingsOptimization extends ModelPrediction {
  model_type: "retirement_savings_optimizer";
  recommended_contribution: number;
  account_type: "401k" | "ira" | "roth_ira" | "sep_ira" | "solo_401k" | "rrsp" | "tfsa";
  tax_benefit: number;
  employer_match_potential: number;
  allocation: Record<string, number>;
  projection_at_retirement: number;
}

export interface InternationalTaxPlan extends ModelPrediction {
  model_type: "international_tax_planner";
  countries: Array<{
    country_code: string;
    country_name: string;
    income: number;
    local_tax: number;
    treaty_benefits: number;
  }>;
  total_global_tax: number;
  treaty_optimization_savings: number;
  compliance_requirements: string[];
  recommendations: Array<{
    recommendation: string;
    annual_savings: number;
  }>;
}

export type AnyPrediction =
  | TaxLiabilityPrediction
  | RegimeRecommendation
  | DeductionOptimization
  | AnomalyDetection
  | AuditRiskScore
  | SavingsForecast
  | QuarterlyTaxForecast
  | TaxLossHarvestRecommendation
  | IncomeShiftingOptimization
  | BusinessStructureRecommendation
  | CharitableGivingOptimization
  | EstimatedTaxPlan
  | ExpenseClassification
  | DepreciationOptimization
  | RetirementSavingsOptimization
  | InternationalTaxPlan;

export type ModelType =
  | "tax_liability"
  | "quarterly_tax_forecaster"
  | "income_anomaly_detector"
  | "audit_risk_scorer"
  | "deduction_optimizer"
  | "tax_loss_harvester"
  | "income_shifting_optimizer"
  | "business_structure_optimizer"
  | "charitable_giving_optimizer"
  | "regime_recommender"
  | "estimated_tax_planner"
  | "expense_classifier"
  | "depreciation_optimizer"
  | "retirement_savings_optimizer"
  | "international_tax_planner";

/* ===== Model Management ===== */

export interface ModelMetadata {
  id: string;
  type: ModelType;
  version: string;
  created_at: Date;
  updated_at: Date;
  accuracy: number; // 0-1
  precision?: number;
  recall?: number;
  f1_score?: number;
  training_samples: number;
  input_features: string[];
  output_type: string;
  performance_metrics: Record<string, number>;
}

export interface ModelConfig {
  type: ModelType;
  algorithm: "xgboost" | "random_forest" | "gradient_boosting" | "logistic_regression" | "isolation_forest" | "lstm";
  hyperparameters: Record<string, any>;
  feature_names: string[];
  feature_scaler?: "standard" | "minmax" | "robust";
  feature_encoding?: Record<string, string[]>; // for categorical features
}

/* ===== Data Pipeline ===== */

export interface DataPoint {
  profile_id: string;
  fy: string;
  timestamp: Date;
  features: TaxpayerFeatures;
  ground_truth?: Record<string, number>; // actual tax liability, etc.
  split: "train" | "test" | "validation";
}

export interface DatasetStats {
  total_samples: number;
  train_samples: number;
  test_samples: number;
  validation_samples: number;
  feature_count: number;
  null_value_pct: Record<string, number>;
  outlier_pct: Record<string, number>;
  feature_distributions: Record<string, { min: number; max: number; mean: number; std: number }>;
}

/* ===== Training ===== */

export interface TrainingJob {
  job_id: string;
  model_type: ModelType;
  status: "pending" | "running" | "completed" | "failed";
  started_at: Date;
  completed_at?: Date;
  error?: string;
  metrics: Record<string, number>;
  config: ModelConfig;
}

export interface CrossValidationResult {
  fold: number;
  train_score: number;
  test_score: number;
  metrics: Record<string, number>;
}

/* ===== Recommendations ===== */

export interface PersonalizedRecommendation {
  id: string;
  profile_id: string;
  type: "regime_switch" | "deduction_increase" | "investment_suggestion" | "tax_planning";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  estimated_savings: number;
  feasibility: number; // 0-1, how easy to implement
  implementation_effort: string; // "quick", "medium", "complex"
  supporting_predictions: AnyPrediction[];
  created_at: Date;
  expiration_date?: Date;
}

/* ===== Monitoring ===== */

export interface PredictionMetrics {
  timestamp: Date;
  model_type: ModelType;
  mae: number; // mean absolute error
  rmse: number; // root mean squared error
  mape: number; // mean absolute percentage error
  r2_score: number;
  accuracy?: number; // for classifiers
  predictions_count: number;
}

export interface DataDriftAlert {
  alert_id: string;
  timestamp: Date;
  feature_name: string;
  drift_score: number; // 0-1
  drift_type: "mean_shift" | "distribution_shift" | "covariate_shift";
  reference_stats: { min: number; max: number; mean: number; std: number };
  current_stats: { min: number; max: number; mean: number; std: number };
  recommendation: string;
}

export interface ModelPerformanceDegradation {
  alert_id: string;
  timestamp: Date;
  model_type: ModelType;
  previous_metric: number;
  current_metric: number;
  metric_name: string;
  degradation_pct: number;
  samples_since_training: number;
  recommendation: string;
}

/* ===== API Response Types ===== */

export interface PredictionResponse {
  success: boolean;
  predictions: AnyPrediction[];
  profile_summary: {
    total_income: number;
    current_tax_regime: string;
    deductions_used: number;
  };
  recommendations: PersonalizedRecommendation[];
  timestamp: Date;
  processing_time_ms: number;
}

export interface BatchPredictionResponse {
  success: boolean;
  batch_id: string;
  total_profiles: number;
  completed: number;
  failed: number;
  predictions: Map<string, AnyPrediction[]>;
  errors: Map<string, string>;
  timestamp: Date;
}

export interface ModelInfoResponse {
  models: ModelMetadata[];
  last_training: Date;
  next_retraining: Date;
  retraining_interval_days: number;
  performance_summary: Record<ModelType, { accuracy: number; last_updated: Date }>;
}

export interface PerformanceMetricsResponse {
  timestamp: Date;
  metrics: PredictionMetrics[];
  alerts: (DataDriftAlert | ModelPerformanceDegradation)[];
  health_status: "healthy" | "warning" | "critical";
  recommendations: string[];
}
