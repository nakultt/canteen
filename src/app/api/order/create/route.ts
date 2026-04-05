import { withTransaction } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { eventBus } from "@/lib/events";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = user.id;

    const order = await withTransaction(async (client) => {
      // Get cart with items
      const cartResult = await client.query(`
        SELECT 
          c.id as cart_id,
          ci.food_item_id,
          ci.quantity,
          f.price,
          f.name
        FROM carts c
        JOIN cart_items ci ON c.id = ci.cart_id
        JOIN food_items f ON ci.food_item_id = f.id
        WHERE c.user_id = $1
      `, [userId]);

      if (cartResult.rows.length === 0) {
        throw new Error("Cart is empty");
      }

      const cartItems = cartResult.rows;
      const cartId = cartItems[0].cart_id;

      // Calculate total
      const totalAmount = cartItems.reduce(
        (sum: number, item: { price: string; quantity: number }) =>
          sum + Number(item.price) * item.quantity,
        0
      );

      // Create order
      const orderResult = await client.query(
        `INSERT INTO orders (user_id, total_amount, status) 
         VALUES ($1, $2, 'PENDING') 
         RETURNING id, total_amount, status, created_at`,
        [userId, totalAmount]
      );

      const orderId = orderResult.rows[0].id;

      // Create order items
      for (const item of cartItems) {
        await client.query(
          `INSERT INTO order_items (order_id, food_item_id, quantity, price) 
           VALUES ($1, $2, $3, $4)`,
          [orderId, item.food_item_id, item.quantity, item.price]
        );
      }

      // Clear cart items
      await client.query("DELETE FROM cart_items WHERE cart_id = $1", [cartId]);

      // Get order with items for response
      const fullOrder = await client.query(`
        SELECT 
          o.id,
          o.total_amount,
          o.status,
          o.created_at,
          oi.food_item_id,
          oi.quantity,
          oi.price,
          f.name,
          f.image_url
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN food_items f ON oi.food_item_id = f.id
        WHERE o.id = $1
      `, [orderId]);

      return fullOrder.rows;
    });

    // Format response
    const items = order.map((row: { food_item_id: number; name: string; quantity: number; price: number; image_url: string | null }) => ({
      food_item_id: row.food_item_id,
      name: row.name,
      quantity: row.quantity,
      price: row.price,
      image_url: row.image_url,
    }));

    // Emit live update for both user and admin dashboards
    eventBus.emit({
      type: "order:created",
      data: {
        orderId: order[0].id,
        userId,
        totalAmount: order[0].total_amount,
        status: order[0].status,
        itemCount: items.length,
      },
      companyId: user.companyId,
    });

    return NextResponse.json({
      id: order[0].id,
      user_id: userId,
      total_amount: order[0].total_amount,
      status: order[0].status,
      created_at: order[0].created_at,
      items,
      message: "Order created successfully",
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Error creating order:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
