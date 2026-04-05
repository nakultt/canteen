import { query } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { eventBus } from "@/lib/events";
import { NextResponse } from "next/server";

// GET all food items for the admin's company
export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (user.role === "USER") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Use company from JWT; DEV can optionally specify companyId via query
    let companyId = user.companyId;
    if (user.role === "DEV") {
      const { searchParams } = new URL(request.url);
      const qc = searchParams.get("companyId");
      if (qc) companyId = Number(qc);
    }

    if (!companyId) {
      return NextResponse.json({ error: "No company context" }, { status: 400 });
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
    if (error instanceof Response) return error;
    console.error("Error fetching food items:", error);
    return NextResponse.json({ error: "Failed to fetch food items" }, { status: 500 });
  }
}

// CREATE new food item
export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (user.role === "USER") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, price, imageUrl, isAvailable = true } = body;

    // Use company from JWT; DEV can specify companyId in body
    let companyId = user.companyId;
    if (user.role === "DEV" && body.companyId) {
      companyId = body.companyId;
    }

    if (!companyId || !name || price === undefined) {
      return NextResponse.json(
        { error: "name and price are required" },
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

    eventBus.emit({
      type: "food:created",
      data: { item: item[0] },
      companyId,
    });

    return NextResponse.json({
      item: item[0],
      message: "Food item created successfully",
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Error creating food item:", error);
    return NextResponse.json({ error: "Failed to create food item" }, { status: 500 });
  }
}
