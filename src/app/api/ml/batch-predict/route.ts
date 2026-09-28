/**
 * Batch ML Prediction API
 * POST /api/ml/batch-predict
 * Process multiple profiles for predictions
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MLPredictionService } from "@/lib/ml/prediction-service";
import { pino } from "pino";

const logger = pino();

const BatchPredictionRequestSchema = z.object({
  profiles: z.array(
    z.object({
      profile_id: z.string(),
      profile: z.any(), // Use TaxProfile type
    })
  ),
  model_type: z.enum(["tax_liability", "regime_recommender", "deduction_optimizer", "income_anomaly_detector", "audit_risk_scorer", "savings_forecaster"]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = BatchPredictionRequestSchema.parse(body);

    if (validatedData.profiles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No profiles provided",
        },
        { status: 400 }
      );
    }

    if (validatedData.profiles.length > 1000) {
      return NextResponse.json(
        {
          success: false,
          error: "Batch size limited to 1000 profiles",
        },
        { status: 400 }
      );
    }

    const service = MLPredictionService.getInstance();
    const result = await service.batchPredict(validatedData.profiles as any);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    logger.error("Batch prediction error:", error);

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
        error: error instanceof Error ? error.message : "Batch prediction failed",
      },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const preferredRegion = "iad1";
