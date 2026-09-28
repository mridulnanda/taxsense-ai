/**
 * Model Performance Metrics API
 * GET /api/ml/performance
 * Real-time model performance and health metrics
 */

import { NextRequest, NextResponse } from "next/server";
import { pino } from "pino";

const logger = pino();

export async function GET(request: NextRequest) {
  try {
    const modelType = request.nextUrl.searchParams.get("model_type");

    // Placeholder metrics (in production, would pull from monitoring service)
    const metrics = {
      success: true,
      timestamp: new Date().toISOString(),
      metrics: [
        {
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          model_type: "tax_liability",
          mae: 15000,
          rmse: 22000,
          mape: 8.5,
          r2_score: 0.92,
          predictions_count: 250,
        },
        {
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          model_type: "regime_recommender",
          mae: 0.05,
          rmse: 0.08,
          mape: 12,
          accuracy: 0.88,
          predictions_count: 180,
        },
        {
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          model_type: "deduction_optimizer",
          mae: 5000,
          rmse: 7500,
          mape: 10,
          r2_score: 0.85,
          predictions_count: 200,
        },
        {
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          model_type: "income_anomaly_detector",
          mae: 0.1,
          rmse: 0.15,
          mape: 15,
          accuracy: 0.91,
          predictions_count: 150,
        },
        {
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          model_type: "audit_risk_scorer",
          mae: 0.08,
          rmse: 0.12,
          mape: 14,
          accuracy: 0.86,
          predictions_count: 120,
        },
        {
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          model_type: "savings_forecaster",
          mae: 8000,
          rmse: 12000,
          mape: 11,
          r2_score: 0.83,
          predictions_count: 100,
        },
      ],
      alerts: [
        {
          alert_id: "drift_001",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          feature_name: "income_growth_yoy",
          drift_score: 0.72,
          drift_type: "mean_shift",
          reference_stats: {
            min: -5,
            max: 50,
            mean: 12.5,
            std: 8.2,
          },
          current_stats: {
            min: 5,
            max: 75,
            mean: 18.3,
            std: 12.1,
          },
          recommendation: "Income growth patterns have shifted. Monitor closely.",
        },
      ],
      health_status: "warning",
      recommendations: [
        "Monitor income growth feature drift",
        "Consider retraining regime_recommender model within 7 days",
        "Collect more edge case data for audit_risk_scorer",
      ],
    };

    // Filter by model type if requested
    if (modelType) {
      const filtered = metrics.metrics.filter((m) => m.model_type === modelType);
      if (filtered.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Model type ${modelType} not found`,
          },
          { status: 404 }
        );
      }
      return NextResponse.json({ ...metrics, metrics: filtered }, { status: 200 });
    }

    return NextResponse.json(metrics, { status: 200 });
  } catch (error) {
    logger.error("Performance metrics error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get performance metrics",
      },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
