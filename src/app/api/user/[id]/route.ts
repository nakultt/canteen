import { queryOne } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET user profile
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const targetId = Number(id);

    // Users can only view their own profile; DEV/ADMIN can view any
    if (authUser.role === "USER" && authUser.id !== targetId) {
      return NextResponse.json(
        { error: "You can only view your own profile" },
        { status: 403 }
      );
    }

    const user = await queryOne<{
      id: number;
      email: string;
      name: string;
      role: string;
      company_id: number | null;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT id, email, name, role, company_id, created_at, updated_at 
       FROM users WHERE id = $1`,
      [targetId]
    );

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get company info
    let company = null;
    if (user.company_id) {
      company = await queryOne<{ id: number; name: string; address: string }>(
        "SELECT id, name, address FROM companies WHERE id = $1",
        [user.company_id]
      );
    }

    return NextResponse.json({
      ...user,
      company,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// UPDATE user profile
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const targetId = Number(id);

    // Users can only update their own profile
    if (authUser.role === "USER" && authUser.id !== targetId) {
      return NextResponse.json(
        { error: "You can only update your own profile" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email } = body;

    // Check if email is already taken by another user
    if (email) {
      const existing = await queryOne<{ id: number }>(
        "SELECT id FROM users WHERE email = $1 AND id != $2",
        [email, targetId]
      );
      if (existing) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        );
      }
    }

    // Update user
    const updated = await queryOne<{
      id: number;
      email: string;
      name: string;
      role: string;
      company_id: number | null;
    }>(
      `UPDATE users 
       SET name = COALESCE($1, name), 
           email = COALESCE($2, email)
       WHERE id = $3
       RETURNING id, email, name, role, company_id`,
      [name, email, targetId]
    );

    if (!updated) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...updated,
      message: "Profile updated successfully",
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
