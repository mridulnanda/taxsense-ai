/**
 * Model Explanation API
 * POST /api/ml/explain
 * Get SHAP-style explanations for predictions
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MLPredictionService } from "@/lib/ml/prediction-service";
import { pino } from "pino";

const logger = pino();

const ExplainRequestSchema = z.object({
  profile: z.any(), // TaxProfile
  model_type: z.enum(["tax_liability", "regime_recommender", "deduction_optimizer", "income_anomaly_detector", "audit_risk_scorer", "savings_forecaster"]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ExplainRequestSchema.parse(body);

    const service = MLPredictionService.getInstance();
    const explanation = await service.explainPrediction(validatedData.profile as any, validatedData.model_type);

    return NextResponse.json(
      {
        success: true,
        explanation,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Explanation error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Explanation failed",
      },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
