import { query } from "@/lib/db";
import { NextResponse } from "next/server";

// GET all food items for company
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId is required" },
        { status: 400 }
      );
    }

    const items = await query<{
      id: number;
      name: string;
      description: string | null;
      price: number;
      image_url: string | null;
      is_available: boolean;
      created_at: string;
    }>(
      `SELECT id, name, description, price, image_url, is_available, created_at 
       FROM food_items 
       WHERE company_id = $1 
       ORDER BY name`,
      [companyId]
    );

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching food items:", error);
    return NextResponse.json(
      { error: "Failed to fetch food items" },
      { status: 500 }
    );
  }
}

// CREATE new food item
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, name, description, price, imageUrl, isAvailable = true } = body;

    if (!companyId || !name || price === undefined) {
      return NextResponse.json(
        { error: "companyId, name, and price are required" },
        { status: 400 }
      );
    }

    const item = await query<{
      id: number;
      name: string;
      description: string | null;
      price: number;
      image_url: string | null;
      is_available: boolean;
    }>(
      `INSERT INTO food_items (company_id, name, description, price, image_url, is_available)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, description, price, image_url, is_available`,
      [companyId, name, description, price, imageUrl, isAvailable]
    );

    return NextResponse.json({
      item: item[0],
      message: "Food item created successfully",
    });
  } catch (error) {
    console.error("Error creating food item:", error);
    return NextResponse.json(
      { error: "Failed to create food item" },
      { status: 500 }
    );
  }
}
