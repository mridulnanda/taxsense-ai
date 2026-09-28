/**
 * ML Tax Optimization API
 * POST /api/ml/optimize
 * Multi-model tax optimization recommendations
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MLPredictionService } from "@/lib/ml/prediction-service";
import { modelRegistry } from "@/lib/ml/models/model-registry";
import { FeatureEngineer } from "@/lib/ml/pipeline/feature-engineering";
import { pino } from "pino";

const logger = pino();

const OptimizationRequestSchema = z.object({
  profile_id: z.string(),
  profile: z.object({
    age: z.number().min(18).max(120),
    gross_salary: z.number().min(0),
    business_income: z.number().min(0).optional(),
    capital_gains: z.number().min(0).optional(),
    other_income: z.number().min(0).optional(),
    section_80c_used: z.number().min(0).max(150000).optional(),
    section_80d_used: z.number().min(0).optional(),
    house_property_income: z.number().min(0).optional(),
  }),
  optimization_targets: z.array(z.enum([
    "deduction_maximization",
    "tax_loss_harvesting",
    "income_shifting",
    "business_structure",
    "charitable_giving",
    "retirement_savings",
    "depreciation",
  ])).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = OptimizationRequestSchema.parse(body);

    // Extract features
    const features = FeatureEngineer.extractFeatures(validatedData.profile as any);

    // Load optimization models
    const models = {
      deduction_optimizer: await modelRegistry.loadModel("deduction_optimizer"),
      tax_loss_harvester: await modelRegistry.loadModel("tax_loss_harvester"),
      income_shifting_optimizer: await modelRegistry.loadModel("income_shifting_optimizer"),
      business_structure_optimizer: await modelRegistry.loadModel("business_structure_optimizer"),
      charitable_giving_optimizer: await modelRegistry.loadModel("charitable_giving_optimizer"),
      retirement_savings_optimizer: await modelRegistry.loadModel("retirement_savings_optimizer"),
      depreciation_optimizer: await modelRegistry.loadModel("depreciation_optimizer"),
    };

    // Get predictions from all models
    const predictions = await Promise.all([
      models.deduction_optimizer.predict(features),
      models.tax_loss_harvester.predict(features),
      models.income_shifting_optimizer.predict(features),
      models.business_structure_optimizer.predict(features),
      models.charitable_giving_optimizer.predict(features),
      models.retirement_savings_optimizer.predict(features),
      models.depreciation_optimizer.predict(features),
    ]);

    // Calculate total optimization benefit
    const totalSavings = predictions.slice(1).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);

    return NextResponse.json({
      success: true,
      profile_id: validatedData.profile_id,
      optimizations: {
        deduction_maximization: {
          model: "deduction_optimizer",
          suggested_additional_deduction: predictions[0],
          tax_benefit: (typeof predictions[0] === "number" ? predictions[0] : 0) * 0.3,
        },
        tax_loss_harvesting: {
          model: "tax_loss_harvester",
          harvest_benefit: predictions[1],
        },
        income_shifting: {
          model: "income_shifting_optimizer",
          estimated_savings: predictions[2],
        },
        business_structure: {
          model: "business_structure_optimizer",
          recommendation: predictions[3] === 0 ? "sole_proprietor" : predictions[3] === 2 ? "llc" : predictions[3] === 3 ? "s_corp" : "c_corp",
          annual_savings: Math.abs(typeof predictions[3] === "number" ? predictions[3] : 0),
        },
        charitable_giving: {
          model: "charitable_giving_optimizer",
          recommended_donation: predictions[4],
        },
        retirement_savings: {
          model: "retirement_savings_optimizer",
          recommended_contribution: predictions[5],
        },
        depreciation: {
          model: "depreciation_optimizer",
          method: predictions[6] === 0 ? "section_179" : predictions[6] === 1 ? "macrs" : "straight_line",
        },
      },
      total_estimated_savings: totalSavings,
      confidence_score: 0.82,
      timestamp: new Date(),
    }, { status: 200 });
  } catch (error) {
    logger.error("Optimization error:", error);

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
        error: error instanceof Error ? error.message : "Optimization failed",
      },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const preferredRegion = "iad1";
