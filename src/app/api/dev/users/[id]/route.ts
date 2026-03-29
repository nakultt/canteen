import { query, queryOne } from "@/lib/db";
import { NextResponse } from "next/server";

// UPDATE user
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, role, companyId, password } = body;

    // Check email uniqueness if changing
    if (email) {
      const existing = await queryOne<{ id: number }>(
        "SELECT id FROM users WHERE email = $1 AND id != $2",
        [email, id]
      );
      if (existing) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        );
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: (string | number | null)[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (role !== undefined) {
      updates.push(`role = $${paramIndex++}`);
      values.push(role);
    }
    if (companyId !== undefined) {
      updates.push(`company_id = $${paramIndex++}`);
      values.push(role === "DEV" ? null : companyId);
    }
    if (password) {
      updates.push(`password = $${paramIndex++}`);
      values.push(password);
    }

    values.push(Number(id));

    const user = await queryOne<{
      id: number;
      email: string;
      name: string;
      role: string;
      company_id: number | null;
    }>(
      `UPDATE users 
       SET ${updates.join(", ")}
       WHERE id = $${paramIndex}
       RETURNING id, email, name, role, company_id`,
      values
    );

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await queryOne<{ id: number }>(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [id]
    );

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
