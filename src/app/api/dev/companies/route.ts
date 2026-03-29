import { query } from "@/lib/db";
import { NextResponse } from "next/server";

// GET all companies
export async function GET() {
  try {
    const companies = await query<{
      id: number;
      name: string;
      address: string | null;
      created_at: string;
      user_count: number;
      admin_count: number;
    }>(
      `SELECT 
        c.id, c.name, c.address, c.created_at,
        COUNT(u.id) as user_count,
        COUNT(CASE WHEN u.role = 'ADMIN' THEN 1 END) as admin_count
      FROM companies c
      LEFT JOIN users u ON c.id = u.company_id
      GROUP BY c.id
      ORDER BY c.name`
    );

    return NextResponse.json({ companies });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}

// CREATE company
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, address } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    const company = await query<{
      id: number;
      name: string;
      address: string | null;
    }>(
      `INSERT INTO companies (name, address)
       VALUES ($1, $2)
       RETURNING id, name, address`,
      [name, address]
    );

    return NextResponse.json({
      company: company[0],
      message: "Company created successfully",
    });
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}
