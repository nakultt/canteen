import { query, queryOne } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await queryOne<{
      id: number;
      email: string;
      name: string;
      role: string;
      company_id: number | null;
      created_at: string;
    }>(
      `SELECT id, email, name, role, company_id, created_at 
       FROM users WHERE id = $1`,
      [userId]
    );

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get company name if user has one
    let companyName = null;
    if (user.company_id) {
      const company = await queryOne<{ name: string }>(
        "SELECT name FROM companies WHERE id = $1",
        [user.company_id]
      );
      companyName = company?.name;
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      company_id: user.company_id,
      company_name: companyName,
      created_at: user.created_at,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
