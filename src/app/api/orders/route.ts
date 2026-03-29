import { query } from "@/lib/db";
import { NextResponse } from "next/server";

interface OrderItem {
  food_item_id: number;
  name: string;
  quantity: number;
  price: number;
  image_url: string | null;
}

interface Order {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Get all orders with items
    const rows = await query<{
      order_id: number;
      total_amount: number;
      status: string;
      created_at: string;
      food_item_id: number;
      name: string;
      quantity: number;
      price: number;
      image_url: string | null;
    }>(`
      SELECT 
        o.id as order_id,
        o.total_amount,
        o.status,
        o.created_at,
        oi.food_item_id,
        f.name,
        oi.quantity,
        oi.price,
        f.image_url
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN food_items f ON oi.food_item_id = f.id
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC
    `, [userId]);

    // Group by order
    const orderMap = new Map<number, Order>();

    for (const row of rows) {
      if (!orderMap.has(row.order_id)) {
        orderMap.set(row.order_id, {
          id: row.order_id,
          total_amount: row.total_amount,
          status: row.status,
          created_at: row.created_at,
          items: [],
        });
      }

      if (row.food_item_id) {
        orderMap.get(row.order_id)!.items.push({
          food_item_id: row.food_item_id,
          name: row.name,
          quantity: row.quantity,
          price: row.price,
          image_url: row.image_url,
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
