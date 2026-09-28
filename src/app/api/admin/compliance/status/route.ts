/**
 * Compliance Status API
 */

import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json({
      total_rules: 12,
      active_rules: 10,
      compliance_score: 98,
      recent_audits: [],
      violations: [],
    });
  } catch (error) {
    console.error("[Compliance Status API]", error);
    return NextResponse.json(
      { error: "Failed to fetch compliance status" },
      { status: 500 }
    );
  }
}
