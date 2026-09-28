/**
 * ML Models Information API
 * GET /api/ml/models
 * Lists all 15 available ML models and their metadata
 */

import { NextRequest, NextResponse } from "next/server";
import { modelRegistry } from "@/lib/ml/models/model-registry";
import { pino } from "pino";

const logger = pino();

export async function GET(request: NextRequest) {
  try {
    // Get all models metadata
    const modelsMetadata = await modelRegistry.getAllModelsMetadata();
    const healthCheck = await modelRegistry.healthCheck();

    // Transform to readable format
    const models = modelRegistry.getAllModelTypes().map((modelType) => ({
      id: modelType,
      name: formatModelName(modelType),
      category: getModelCategory(modelType),
      description: getModelDescription(modelType),
      status: healthCheck[modelType] ? "healthy" : "unhealthy",
      accuracy: modelsMetadata[modelType]?.accuracy || 0,
      version: modelsMetadata[modelType]?.version || "1.0.0",
      features: modelsMetadata[modelType]?.input_features?.length || 0,
      training_samples: modelsMetadata[modelType]?.training_samples || 0,
      last_updated: modelsMetadata[modelType]?.updated_at || new Date(),
    }));

    // Group by category
    const grouped = {
      financial_prediction: models.filter(m => m.category === "financial_prediction"),
      optimization: models.filter(m => m.category === "optimization"),
      compliance_strategy: models.filter(m => m.category === "compliance_strategy"),
    };

    return NextResponse.json({
      success: true,
      total_models: models.length,
      healthy_models: Object.values(healthCheck).filter(v => v).length,
      models,
      grouped_by_category: grouped,
      timestamp: new Date(),
    }, { status: 200 });
  } catch (error) {
    logger.error("Models info error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to retrieve models info",
      },
      { status: 500 }
    );
  }
}

function formatModelName(modelType: string): string {
  return modelType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getModelCategory(modelType: string): string {
  const categories = {
    tax_liability: "financial_prediction",
    quarterly_tax_forecaster: "financial_prediction",
    income_anomaly_detector: "financial_prediction",
    audit_risk_scorer: "financial_prediction",
    deduction_optimizer: "optimization",
    tax_loss_harvester: "optimization",
    income_shifting_optimizer: "optimization",
    business_structure_optimizer: "optimization",
    charitable_giving_optimizer: "optimization",
    regime_recommender: "compliance_strategy",
    estimated_tax_planner: "compliance_strategy",
    expense_classifier: "compliance_strategy",
    depreciation_optimizer: "compliance_strategy",
    retirement_savings_optimizer: "compliance_strategy",
    international_tax_planner: "compliance_strategy",
  } as Record<string, string>;

  return categories[modelType] || "other";
}

function getModelDescription(modelType: string): string {
  const descriptions = {
    tax_liability: "Predicts annual tax liability with 95%+ accuracy based on income profile",
    quarterly_tax_forecaster: "Forecasts quarterly tax liabilities with seasonal adjustments",
    income_anomaly_detector: "Detects unusual income patterns and potential fraud indicators",
    audit_risk_scorer: "Scores probability of tax audit by authorities",
    deduction_optimizer: "Suggests maximum legal deductions for tax optimization",
    tax_loss_harvester: "Identifies capital loss harvesting opportunities",
    income_shifting_optimizer: "Recommends legal income redistribution strategies",
    business_structure_optimizer: "Determines optimal business structure (LLC/S-Corp/C-Corp)",
    charitable_giving_optimizer: "Maximizes donation tax benefits",
    regime_recommender: "Recommends optimal tax regime (new vs old)",
    estimated_tax_planner: "Calculates quarterly tax payment estimates",
    expense_classifier: "AI-powered expense categorization and deductibility analysis",
    depreciation_optimizer: "Recommends optimal depreciation method (Section 179 vs MACRS)",
    retirement_savings_optimizer: "Suggests retirement account strategy (401k/IRA/RRSP)",
    international_tax_planner: "Multi-country tax optimization for expats",
  } as Record<string, string>;

  return descriptions[modelType] || "ML Model";
}

export const runtime = "nodejs";
export const preferredRegion = "iad1";
