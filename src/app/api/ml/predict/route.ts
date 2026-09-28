/**
 * ML Prediction API
 * POST /api/ml/predict
 * Single prediction for a tax profile
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MLPredictionService } from "@/lib/ml/prediction-service";
import { pino } from "pino";

const logger = pino();

const PredictionRequestSchema = z.object({
  profile_id: z.string(),
  profile: z.object({
    name: z.string().optional(),
    age: z.number().min(18).max(120),
    residentialStatus: z.enum(["resident", "nri"]),
    salary: z
      .object({
        grossSalary: z.number().min(0),
        basicPlusDA: z.number().min(0),
        hraReceived: z.number().min(0),
        rentPaid: z.number().min(0),
        isMetroCity: z.boolean(),
        employerNpsContribution: z.number().min(0),
        professionalTax: z.number().min(0),
      })
      .optional(),
    houseProperties: z.array(
      z.object({
        use: z.enum(["self-occupied", "let-out"]),
        annualRent: z.number().min(0),
        municipalTaxes: z.number().min(0),
        homeLoanInterest: z.number().min(0),
      })
    ),
    capitalGains: z
      .object({
        stcg111A: z.number().min(0),
        stcgOther: z.number().min(0),
        ltcg112A: z.number().min(0),
        ltcgOther: z.number().min(0),
      })
      .optional(),
    business: z
      .object({
        netIncome: z.number().min(0),
        presumptive: z.boolean(),
      })
      .optional(),
    otherSources: z
      .object({
        savingsInterest: z.number().min(0),
        fdInterest: z.number().min(0),
        dividends: z.number().min(0),
        familyPension: z.number().min(0),
        other: z.number().min(0),
      })
      .optional(),
    deductions: z.object({
      section80C: z.number().min(0).max(150000),
      section80CCD1B: z.number().min(0).max(50000).optional(),
      section80D_selfFamily: z.number().min(0),
      section80D_parents: z.number().min(0),
      parentsAreSenior: z.boolean(),
      section80E: z.number().min(0),
      section80G: z.number().min(0),
    }),
    taxesPaid: z.number().min(0),
  }),
  include_recommendations: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const validatedData = PredictionRequestSchema.parse(body);

    // Get predictions
    const service = MLPredictionService.getInstance();
    const result = await service.predictForProfile(validatedData.profile_id, validatedData.profile as any, validatedData.include_recommendations);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    logger.error("Prediction error:", error);

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
        error: error instanceof Error ? error.message : "Prediction failed",
      },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const preferredRegion = "iad1";
