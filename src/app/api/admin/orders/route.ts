import { query } from "@/lib/db";
import { NextResponse } from "next/server";

// GET all orders for company
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

    // Get all orders from users belonging to this company
    const orders = await query<{
      order_id: number;
      total_amount: number;
      status: string;
      created_at: string;
      user_id: number;
      user_name: string;
      user_email: string;
      food_item_id: number;
      food_name: string;
      quantity: number;
      price: number;
    }>(
      `SELECT 
        o.id as order_id,
        o.total_amount,
        o.status,
        o.created_at,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        oi.food_item_id,
        f.name as food_name,
        oi.quantity,
        oi.price
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN food_items f ON oi.food_item_id = f.id
      WHERE u.company_id = $1
      ORDER BY o.created_at DESC`,
      [companyId]
    );

    // Group by order
    const orderMap = new Map<number, {
      id: number;
      total_amount: number;
      status: string;
      created_at: string;
      user: { id: number; name: string; email: string };
      items: { food_item_id: number; name: string; quantity: number; price: number }[];
    }>();

    for (const row of orders) {
      if (!orderMap.has(row.order_id)) {
        orderMap.set(row.order_id, {
          id: row.order_id,
          total_amount: row.total_amount,
          status: row.status,
          created_at: row.created_at,
          user: {
            id: row.user_id,
            name: row.user_name,
            email: row.user_email,
          },
          items: [],
        });
      }

      if (row.food_item_id) {
        orderMap.get(row.order_id)!.items.push({
          food_item_id: row.food_item_id,
          name: row.food_name,
          quantity: row.quantity,
          price: row.price,
        });
      }
    }

    return NextResponse.json({
      orders: Array.from(orderMap.values()),
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
