/**
 * ML Model Registry & Factory
 * Manages instantiation and lifecycle of all 15 models
 */

import { type ModelConfig, type ModelType } from "../types";
import { RuleBasedModel, BaseModel } from "./base-model";
import {
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
} from "./specialized-models";

/**
 * Default configurations for all 15 models
 */
const DEFAULT_CONFIGS: Record<ModelType, ModelConfig> = {
  tax_liability: {
    type: "tax_liability",
    algorithm: "xgboost",
    hyperparameters: {
      max_depth: 8,
      learning_rate: 0.1,
      n_estimators: 200,
      subsample: 0.8,
    },
    feature_names: [
      "gross_salary",
      "business_income",
      "capital_gains",
      "other_income",
      "total_deductions",
      "age_group",
      "house_property_income",
      "deduction_ratio",
      "income_stability_score",
    ],
    feature_scaler: "standard",
  },

  quarterly_tax_forecaster: {
    type: "quarterly_tax_forecaster",
    algorithm: "lstm",
    hyperparameters: {
      hidden_units: 128,
      lookback_window: 12,
      dropout_rate: 0.2,
      epochs: 50,
    },
    feature_names: [
      "gross_salary",
      "business_income",
      "income_growth_yoy",
      "income_stability_score",
    ],
  },

  income_anomaly_detector: {
    type: "income_anomaly_detector",
    algorithm: "isolation_forest",
    hyperparameters: {
      contamination: 0.05,
      n_estimators: 100,
      random_state: 42,
    },
    feature_names: [
      "income_concentration",
      "income_growth_yoy",
      "income_stability_score",
      "total_income",
    ],
  },

  audit_risk_scorer: {
    type: "audit_risk_scorer",
    algorithm: "xgboost",
    hyperparameters: {
      max_depth: 6,
      learning_rate: 0.1,
      n_estimators: 150,
      scale_pos_weight: 2,
    },
    feature_names: [
      "income_concentration",
      "deduction_ratio",
      "regime_changes_count",
      "age_group",
      "audit_risk_flags",
    ],
    feature_scaler: "minmax",
  },

  deduction_optimizer: {
    type: "deduction_optimizer",
    algorithm: "xgboost",
    hyperparameters: {
      max_depth: 7,
      learning_rate: 0.1,
      n_estimators: 180,
    },
    feature_names: [
      "gross_salary",
      "total_deductions",
      "section_80c_capacity_used_pct",
      "section_80d_used",
      "age",
    ],
  },

  tax_loss_harvester: {
    type: "tax_loss_harvester",
    algorithm: "gradient_boosting",
    hyperparameters: {
      n_estimators: 120,
      learning_rate: 0.05,
      max_depth: 5,
    },
    feature_names: [
      "capital_gains",
      "investment_income",
      "income_volatility",
    ],
  },

  income_shifting_optimizer: {
    type: "income_shifting_optimizer",
    algorithm: "xgboost",
    hyperparameters: {
      max_depth: 6,
      learning_rate: 0.1,
      n_estimators: 150,
    },
    feature_names: [
      "gross_salary",
      "business_income",
      "total_income",
      "age_group",
    ],
  },

  business_structure_optimizer: {
    type: "business_structure_optimizer",
    algorithm: "xgboost",
    hyperparameters: {
      max_depth: 7,
      learning_rate: 0.1,
      n_estimators: 160,
      num_class: 5,
    },
    feature_names: [
      "business_income",
      "total_deductions",
      "section_80c_used",
    ],
  },

  charitable_giving_optimizer: {
    type: "charitable_giving_optimizer",
    algorithm: "xgboost",
    hyperparameters: {
      max_depth: 5,
      learning_rate: 0.1,
      n_estimators: 100,
    },
    feature_names: [
      "gross_salary",
      "business_income",
      "total_deductions",
    ],
  },

  regime_recommender: {
    type: "regime_recommender",
    algorithm: "xgboost",
    hyperparameters: {
      max_depth: 6,
      learning_rate: 0.1,
      n_estimators: 180,
      scale_pos_weight: 1.2,
    },
    feature_names: [
      "gross_salary",
      "business_income",
      "capital_gains",
      "total_deductions",
      "age_group",
      "section_80c_capacity_used_pct",
    ],
    feature_scaler: "standard",
  },

  estimated_tax_planner: {
    type: "estimated_tax_planner",
    algorithm: "xgboost",
    hyperparameters: {
      max_depth: 5,
      learning_rate: 0.1,
      n_estimators: 120,
    },
    feature_names: [
      "total_income",
      "gross_salary",
      "income_growth_yoy",
    ],
  },

  expense_classifier: {
    type: "expense_classifier",
    algorithm: "xgboost",
    hyperparameters: {
      max_depth: 8,
      learning_rate: 0.1,
      n_estimators: 200,
      num_class: 10,
    },
    feature_names: [
      "total_deductions",
      "section_80c_used",
      "business_income",
    ],
  },

  depreciation_optimizer: {
    type: "depreciation_optimizer",
    algorithm: "xgboost",
    hyperparameters: {
      max_depth: 6,
      learning_rate: 0.1,
      n_estimators: 140,
      num_class: 3,
    },
    feature_names: [
      "business_income",
      "total_deductions",
    ],
  },

  retirement_savings_optimizer: {
    type: "retirement_savings_optimizer",
    algorithm: "xgboost",
    hyperparameters: {
      max_depth: 6,
      learning_rate: 0.1,
      n_estimators: 150,
    },
    feature_names: [
      "gross_salary",
      "business_income",
      "age",
      "age_group",
    ],
  },

  international_tax_planner: {
    type: "international_tax_planner",
    algorithm: "xgboost",
    hyperparameters: {
      max_depth: 7,
      learning_rate: 0.08,
      n_estimators: 180,
    },
    feature_names: [
      "capital_gains",
      "business_income",
      "other_income",
      "age_group",
    ],
  },
};

/**
 * Model Registry - Singleton pattern
 */
export class ModelRegistry {
  private static instance: ModelRegistry;
  private models = new Map<ModelType, BaseModel>();
  private loadingPromises = new Map<ModelType, Promise<BaseModel>>();

  private constructor() {}

  static getInstance(): ModelRegistry {
    if (!ModelRegistry.instance) {
      ModelRegistry.instance = new ModelRegistry();
    }
    return ModelRegistry.instance;
  }

  /**
   * Load a model by type
   */
  async loadModel(modelType: ModelType): Promise<BaseModel> {
    // Return cached model if available
    if (this.models.has(modelType)) {
      return this.models.get(modelType)!;
    }

    // Return existing loading promise to avoid race conditions
    if (this.loadingPromises.has(modelType)) {
      return this.loadingPromises.get(modelType)!;
    }

    // Load model
    const loadPromise = this.instantiateModel(modelType);
    this.loadingPromises.set(modelType, loadPromise);

    const model = await loadPromise;
    this.models.set(modelType, model);
    this.loadingPromises.delete(modelType);

    return model;
  }

  /**
   * Instantiate a model based on type
   */
  private instantiateModel(modelType: ModelType): Promise<BaseModel> {
    const config = DEFAULT_CONFIGS[modelType];

    let model: BaseModel;

    switch (modelType) {
      case "tax_liability":
        model = new TaxLiabilityModel(config);
        break;
      case "quarterly_tax_forecaster":
        model = new QuarterlyTaxForecasterModel(config);
        break;
      case "income_anomaly_detector":
        model = new IncomeAnomalyDetectorModel(config);
        break;
      case "audit_risk_scorer":
        model = new AuditRiskScorerModel(config);
        break;
      case "deduction_optimizer":
        model = new DeductionMaximizerModel(config);
        break;
      case "tax_loss_harvester":
        model = new TaxLossHarvesterModel(config);
        break;
      case "income_shifting_optimizer":
        model = new IncomeShiftingOptimizerModel(config);
        break;
      case "business_structure_optimizer":
        model = new BusinessStructureOptimizerModel(config);
        break;
      case "charitable_giving_optimizer":
        model = new CharitableGivingOptimizerModel(config);
        break;
      case "regime_recommender":
        model = new RegimeRecommenderModel(config);
        break;
      case "estimated_tax_planner":
        model = new EstimatedTaxPlannerModel(config);
        break;
      case "expense_classifier":
        model = new ExpenseClassifierModel(config);
        break;
      case "depreciation_optimizer":
        model = new DepreciationOptimizerModel(config);
        break;
      case "retirement_savings_optimizer":
        model = new RetirementSavingsOptimizerModel(config);
        break;
      case "international_tax_planner":
        model = new InternationalTaxPlannerModel(config);
        break;
      default:
        model = new RuleBasedModel(config);
    }

    return model.load().then(() => model);
  }

  /**
   * Get all available models
   */
  getAllModelTypes(): ModelType[] {
    return Object.keys(DEFAULT_CONFIGS) as ModelType[];
  }

  /**
   * Get model metadata
   */
  async getModelMetadata(modelType: ModelType) {
    const model = await this.loadModel(modelType);
    return model.getMetadata();
  }

  /**
   * Get all models metadata
   */
  async getAllModelsMetadata() {
    const metadata: Record<ModelType, any> = {} as any;

    for (const modelType of this.getAllModelTypes()) {
      metadata[modelType] = await this.getModelMetadata(modelType);
    }

    return metadata;
  }

  /**
   * Clear cache (useful for retraining)
   */
  clearCache(modelType?: ModelType): void {
    if (modelType) {
      this.models.delete(modelType);
    } else {
      this.models.clear();
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};

    for (const modelType of this.getAllModelTypes()) {
      try {
        const model = await this.loadModel(modelType);
        health[modelType] = model.isReady();
      } catch (error) {
        health[modelType] = false;
      }
    }

    return health;
  }
}

/**
 * Export singleton instance
 */
export const modelRegistry = ModelRegistry.getInstance();
