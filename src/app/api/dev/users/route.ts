import { query } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";
import { eventBus } from "@/lib/events";
import { NextResponse } from "next/server";

// GET all users — DEV only
export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (user.role !== "DEV") {
      return NextResponse.json({ error: "DEV access required" }, { status: 403 });
    }

    const users = await query<{
      id: number;
      email: string;
      name: string;
      role: string;
      company_id: number | null;
      company_name: string | null;
      created_at: string;
    }>(
      `SELECT 
        u.id, u.email, u.name, u.role, u.company_id, 
        c.name as company_name,
        u.created_at
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      ORDER BY u.role, u.name`
    );

    return NextResponse.json({ users });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// CREATE user — DEV only
export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (user.role !== "DEV") {
      return NextResponse.json({ error: "DEV access required" }, { status: 403 });
    }

    const body = await request.json();
    const { email, name, password, role, companyId } = body;

    if (!email || !name || !password || !role) {
      return NextResponse.json(
        { error: "email, name, password, and role are required" },
        { status: 400 }
      );
    }

    // Enforce single DEV account
    if (role === "DEV") {
      const existingDev = await query<{ id: number }>(
        "SELECT id FROM users WHERE role = 'DEV'"
      );
      if (existingDev.length > 0) {
        return NextResponse.json(
          { error: "Only one DEV account is allowed in the system" },
          { status: 400 }
        );
      }
    }

    // Check if email exists
    const existing = await query<{ id: number }>(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existing.length > 0) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    // Hash password before storing
    const hashedPassword = await hashPassword(password);

    // DEV role cannot have company_id
    const actualCompanyId = role === "DEV" ? null : companyId;

    const newUser = await query<{
      id: number;
      email: string;
      name: string;
      role: string;
      company_id: number | null;
    }>(
      `INSERT INTO users (email, name, password, role, company_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, role, company_id`,
      [email, name, hashedPassword, role, actualCompanyId]
    );

    eventBus.emit({
      type: "user:created",
      data: { user: newUser[0] },
    });

    return NextResponse.json({
      user: newUser[0],
      message: "User created successfully",
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
