import { queryOne } from "@/lib/db";
import { NextResponse } from "next/server";

// UPDATE company
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      company,
      message: "Company updated successfully",
    });
  } catch (error) {
    console.error("Error updating company:", error);
    return NextResponse.json(
      { error: "Failed to update company" },
      { status: 500 }
    );
  }
}

// DELETE company
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const company = await queryOne<{ id: number }>(
      "DELETE FROM companies WHERE id = $1 RETURNING id",
      [id]
    );

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Company deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting company:", error);
    return NextResponse.json(
      { error: "Failed to delete company" },
      { status: 500 }
    );
  }
}
