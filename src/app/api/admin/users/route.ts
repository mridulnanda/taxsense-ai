/**
 * Admin Users API
 * User management endpoints
 */

import { NextRequest, NextResponse } from "next/server";
import { AdminUser } from "@/lib/admin/types";

// Mock users for demo
const mockUsers: AdminUser[] = [
  {
    id: "user_1",
    email: "admin@taxsense.ai",
    name: "Admin User",
    role: "admin",
    permissions: [],
    two_fa_enabled: true,
    last_login: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
    updated_at: new Date(),
    is_active: true,
  },
  {
    id: "user_2",
    email: "manager@taxsense.ai",
    name: "Manager",
    role: "manager",
    permissions: [],
    two_fa_enabled: false,
    last_login: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
    updated_at: new Date(),
    is_active: true,
  },
  {
    id: "user_3",
    email: "analyst@taxsense.ai",
    name: "Data Analyst",
    role: "analyst",
    permissions: [],
    two_fa_enabled: true,
    last_login: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    updated_at: new Date(),
    is_active: true,
  },
];

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "all";

    let users = mockUsers;

    // Filter by search
    if (search) {
      users = users.filter(
        (u) =>
          u.email.includes(search.toLowerCase()) ||
          u.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by role
    if (role !== "all") {
      users = users.filter((u) => u.role === role);
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error("[Admin Users API]", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const newUser: AdminUser = {
      id: `user_${Date.now()}`,
      email: body.email,
      name: body.name,
      role: body.role || "viewer",
      permissions: [],
      two_fa_enabled: false,
      created_at: new Date(),
      updated_at: new Date(),
      is_active: true,
    };

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("[Admin Users API]", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
