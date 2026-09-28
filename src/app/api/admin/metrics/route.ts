/**
 * Admin Dashboard Metrics API
 * Real-time metrics endpoint for dashboard
 */

import { NextRequest, NextResponse } from "next/server";
import { DashboardMetrics } from "@/lib/admin/types";

// Mock metrics for demo - replace with real data from Supabase
function generateMockMetrics(): DashboardMetrics {
  const now = Date.now();
  const randomVariation = Math.random();

  return {
    active_users: Math.floor(1500 + randomVariation * 500),
    active_users_trend: Math.floor(randomVariation * 20 - 10),
    total_users: 5230,
    signups_today: Math.floor(15 + randomVariation * 20),
    signups_this_week: Math.floor(85 + randomVariation * 30),
    active_computations: Math.floor(120 + randomVariation * 100),
    avg_computation_time: 2500 + randomVariation * 2000,
    error_rate: Math.random() * 2,
    system_health: randomVariation > 0.8
      ? "critical"
      : randomVariation > 0.5
        ? "warning"
        : "healthy",
  };
}

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get metrics - in production, fetch from database
    const metrics = generateMockMetrics();

    return NextResponse.json(metrics, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    console.error("[Admin Metrics API]", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}
