import { query, queryOne } from "@/lib/db";
import { NextResponse } from "next/server";

interface User {
  id: number;
  email: string;
  name: string;
  password: string;
  role: string;
  company_id: number | null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await queryOne<User>(
      `SELECT id, email, name, password, role, company_id 
       FROM users WHERE email = $1`,
      [email]
    );

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check password (plain text for now - TODO: add bcrypt)
    if (user.password !== password) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
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

    // Return user data (excluding password)
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company_id: user.company_id,
        company_name: companyName,
      },
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
