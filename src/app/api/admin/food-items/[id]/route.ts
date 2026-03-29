import { query, queryOne } from "@/lib/db";
import { NextResponse } from "next/server";

// UPDATE food item
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, price, imageUrl, isAvailable } = body;

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
      return NextResponse.json(
        { error: "Food item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      item,
      message: "Food item updated successfully",
    });
  } catch (error) {
    console.error("Error updating food item:", error);
    return NextResponse.json(
      { error: "Failed to update food item" },
      { status: 500 }
    );
  }
}

// DELETE food item
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const item = await queryOne<{ id: number }>(
      "DELETE FROM food_items WHERE id = $1 RETURNING id",
      [id]
    );

    if (!item) {
      return NextResponse.json(
        { error: "Food item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Food item deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting food item:", error);
    return NextResponse.json(
      { error: "Failed to delete food item" },
      { status: 500 }
    );
  }
}
