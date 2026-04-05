import { queryOne } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { eventBus } from "@/lib/events";
import { NextResponse } from "next/server";

// UPDATE company — DEV only
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
    const { name, address } = body;

    const company = await queryOne<{
      id: number;
      name: string;
      address: string | null;
    }>(
      `UPDATE companies 
       SET name = COALESCE($1, name),
           address = COALESCE($2, address)
       WHERE id = $3
       RETURNING id, name, address`,
      [name, address, id]
    );

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    eventBus.emit({
      type: "company:updated",
      data: { company },
    });

    return NextResponse.json({
      company,
      message: "Company updated successfully",
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Error updating company:", error);
    return NextResponse.json({ error: "Failed to update company" }, { status: 500 });
  }
}

// DELETE company — DEV only
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

    const company = await queryOne<{ id: number }>(
      "DELETE FROM companies WHERE id = $1 RETURNING id",
      [id]
    );

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    eventBus.emit({
      type: "company:deleted",
      data: { companyId: Number(id) },
    });

    return NextResponse.json({ message: "Company deleted successfully" });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Error deleting company:", error);
    return NextResponse.json({ error: "Failed to delete company" }, { status: 500 });
  }
}
