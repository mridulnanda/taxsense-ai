/**
 * Revenue Metrics API
 * Financial analytics endpoint
 */

import { NextResponse } from "next/server";
import { FinancialMetrics } from "@/lib/admin/types";

export async function GET() {
  try {
    // Mock financial metrics
    const metrics: FinancialMetrics = {
      mrr: 125000,
      arr: 1500000,
      arpu: 285,
      churn_rate: 3.2,
      ltv: 8500,
      ltv_cac_ratio: 4.2,
      growth_rate: 12.5,
      net_retention_rate: 115,
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("[Revenue Metrics API]", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}
