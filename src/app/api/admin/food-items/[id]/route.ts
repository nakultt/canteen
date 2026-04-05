import { queryOne } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { eventBus } from "@/lib/events";
import { NextResponse } from "next/server";

// UPDATE food item
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (user.role === "USER") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, price, imageUrl, isAvailable } = body;

    // Verify the food item belongs to admin's company (unless DEV)
    if (user.role === "ADMIN" && user.companyId) {
      const existing = await queryOne<{ company_id: number }>(
        "SELECT company_id FROM food_items WHERE id = $1",
        [id]
      );
      if (existing && existing.company_id !== user.companyId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const item = await queryOne<{
      id: number;
      name: string;
      description: string | null;
      price: number;
      image_url: string | null;
      is_available: boolean;
    }>(
      `UPDATE food_items 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           image_url = COALESCE($4, image_url),
           is_available = COALESCE($5, is_available)
       WHERE id = $6
       RETURNING id, name, description, price, image_url, is_available`,
      [name, description, price, imageUrl, isAvailable, id]
    );

    if (!item) {
      return NextResponse.json({ error: "Food item not found" }, { status: 404 });
    }

    eventBus.emit({
      type: "food:updated",
      data: { item },
      companyId: user.companyId,
    });

    return NextResponse.json({
      item,
      message: "Food item updated successfully",
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Error updating food item:", error);
    return NextResponse.json({ error: "Failed to update food item" }, { status: 500 });
  }
}

// DELETE food item
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (user.role === "USER") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;

    // Verify ownership for ADMIN
    if (user.role === "ADMIN" && user.companyId) {
      const existing = await queryOne<{ company_id: number }>(
        "SELECT company_id FROM food_items WHERE id = $1",
        [id]
      );
      if (existing && existing.company_id !== user.companyId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const item = await queryOne<{ id: number }>(
      "DELETE FROM food_items WHERE id = $1 RETURNING id",
      [id]
    );

    if (!item) {
      return NextResponse.json({ error: "Food item not found" }, { status: 404 });
    }

    eventBus.emit({
      type: "food:deleted",
      data: { itemId: Number(id) },
      companyId: user.companyId,
    });

    return NextResponse.json({ message: "Food item deleted successfully" });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Error deleting food item:", error);
    return NextResponse.json({ error: "Failed to delete food item" }, { status: 500 });
  }
}
