/**
 * Model Info API
 * GET /api/ml/model-info
 * Get metadata and performance info about ML models
 */

import { NextRequest, NextResponse } from "next/server";
import { InferenceEngine } from "@/lib/ml/inference/model-loader";
import { pino } from "pino";

const logger = pino();

export async function GET(request: NextRequest) {
  try {
    const engine = InferenceEngine.getInstance();

    // Get metadata for all models
    const modelTypes = ["tax_liability", "regime_recommender", "deduction_optimizer", "income_anomaly_detector", "audit_risk_scorer", "savings_forecaster"] as const;

    const models = await Promise.all(modelTypes.map((type) => engine.getModelMetadata(type)));

    const response = {
      success: true,
      models,
      last_training: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last week (placeholder)
      next_retraining: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000), // In 23 days (placeholder)
      retraining_interval_days: 30,
      performance_summary: modelTypes.reduce(
        (acc, type) => {
          const model = models.find((m) => m.type === type);
          acc[type] = {
            accuracy: model?.accuracy || 0.85,
            last_updated: model?.updated_at || new Date(),
          };
          return acc;
        },
        {} as Record<string, any>
      ),
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    logger.error("Model info error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get model info",
      },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
