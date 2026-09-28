/**
 * Support Tickets API
 */

import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json([
      {
        id: "ticket_1",
        title: "PDF Export Issue",
        description: "Users unable to export PDFs",
        status: "open",
        priority: "high",
        created_at: "2 hours ago",
      },
      {
        id: "ticket_2",
        title: "Computation Timeout",
        description: "Long computations timing out",
        status: "in_progress",
        priority: "urgent",
        created_at: "30 minutes ago",
      },
      {
        id: "ticket_3",
        title: "UI Layout Issue",
        description: "Mobile view broken on iOS",
        status: "open",
        priority: "medium",
        created_at: "1 day ago",
      },
    ]);
  } catch (error) {
    console.error("[Support Tickets API]", error);
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}
