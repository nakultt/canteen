import { queryOne } from "@/lib/db";
import { verifyPassword, createToken } from "@/lib/auth";
import { NextResponse } from "next/server";

interface User {
  id: number;
  email: string;
  name: string;
  password: string;
  role: "DEV" | "ADMIN" | "USER";
  company_id: number | null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, allowedRole } = body;

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

    // Verify bcrypt password
    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // If a specific login portal is used, enforce the role
    if (allowedRole) {
      const allowed: string[] = Array.isArray(allowedRole)
        ? allowedRole
        : [allowedRole];
      if (!allowed.includes(user.role)) {
        return NextResponse.json(
          {
            error: `This login is for ${allowed.join("/")} accounts only. Your account role is ${user.role}.`,
          },
          { status: 403 }
        );
      }
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

    // Create JWT
    const token = await createToken({
      id: user.id,
      role: user.role,
      companyId: user.company_id,
    });

    // Build response with HttpOnly cookie
    const response = NextResponse.json({
      token,
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

    response.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge: 86400, // 24 hours
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
