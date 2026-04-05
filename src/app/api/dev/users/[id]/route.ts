import { query, queryOne } from "@/lib/db";
import { getAuthUser, hashPassword } from "@/lib/auth";
import { eventBus } from "@/lib/events";
import { NextResponse } from "next/server";

// UPDATE user — DEV only
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (user.role !== "DEV") {
      return NextResponse.json({ error: "DEV access required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, email, role, companyId, password } = body;

    // Enforce single DEV: can't promote another user to DEV if one exists
    if (role === "DEV") {
      const existingDev = await queryOne<{ id: number }>(
        "SELECT id FROM users WHERE role = 'DEV' AND id != $1",
        [id]
      );
      if (existingDev) {
        return NextResponse.json(
          { error: "Only one DEV account is allowed" },
          { status: 400 }
        );
      }
    }

    // Prevent demoting the only DEV
    const targetUser = await queryOne<{ role: string }>(
      "SELECT role FROM users WHERE id = $1",
      [id]
    );
    if (targetUser?.role === "DEV" && role && role !== "DEV") {
      return NextResponse.json(
        { error: "Cannot change the DEV account's role" },
        { status: 400 }
      );
    }

    // Check email uniqueness if changing
    if (email) {
      const existing = await queryOne<{ id: number }>(
        "SELECT id FROM users WHERE email = $1 AND id != $2",
        [email, id]
      );
      if (existing) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 });
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
      const hashed = await hashPassword(password);
      updates.push(`password = $${paramIndex++}`);
      values.push(hashed);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(Number(id));

    const updatedUser = await queryOne<{
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

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    eventBus.emit({
      type: "user:updated",
      data: { user: updatedUser },
    });

    return NextResponse.json({
      user: updatedUser,
      message: "User updated successfully",
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE user — DEV only
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (user.role !== "DEV") {
      return NextResponse.json({ error: "DEV access required" }, { status: 403 });
    }

    const { id } = await params;

    // Prevent deleting the DEV account itself
    const targetUser = await queryOne<{ role: string }>(
      "SELECT role FROM users WHERE id = $1",
      [id]
    );
    if (targetUser?.role === "DEV") {
      return NextResponse.json(
        { error: "Cannot delete the DEV account" },
        { status: 400 }
      );
    }

    const deleted = await queryOne<{ id: number }>(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [id]
    );

    if (!deleted) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    eventBus.emit({
      type: "user:deleted",
      data: { userId: Number(id) },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
