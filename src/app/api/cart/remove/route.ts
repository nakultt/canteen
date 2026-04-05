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
    const body = await request.json();
    const { foodItemId, removeAll = false } = body;

    if (!foodItemId) {
      return NextResponse.json(
        { error: "foodItemId is required" },
        { status: 400 }
      );
    }

    const result = await withTransaction(async (client) => {
      const cart = await client.query(
        "SELECT id FROM carts WHERE user_id = $1",
        [userId]
      );

      if (cart.rows.length === 0) {
        throw new Error("Cart not found");
      }

      const cartId = cart.rows[0].id;

      const existingItem = await client.query(
        "SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND food_item_id = $2",
        [cartId, foodItemId]
      );

      if (existingItem.rows.length === 0) {
        throw new Error("Item not found in cart");
      }

      const currentQuantity = existingItem.rows[0].quantity;
      const itemId = existingItem.rows[0].id;

      if (removeAll || currentQuantity <= 1) {
        await client.query("DELETE FROM cart_items WHERE id = $1", [itemId]);
      } else {
        await client.query(
          "UPDATE cart_items SET quantity = quantity - 1 WHERE id = $1",
          [itemId]
        );
      }

      const updatedCart = await client.query(`
        SELECT 
          c.id as cart_id,
          ci.id as item_id,
          ci.food_item_id,
          ci.quantity,
          f.name,
          f.price,
          f.image_url
        FROM carts c
        LEFT JOIN cart_items ci ON c.id = ci.cart_id
        LEFT JOIN food_items f ON ci.food_item_id = f.id
        WHERE c.user_id = $1
      `, [userId]);

      return updatedCart.rows;
    });

    const items = result.filter((r: { item_id: number }) => r.item_id).map((r: { item_id: number; food_item_id: number; quantity: number; name: string; price: number; image_url: string | null }) => ({
      id: r.item_id,
      food_item_id: r.food_item_id,
      quantity: r.quantity,
      name: r.name,
      price: r.price,
      image_url: r.image_url,
    }));

    const total = items.reduce((sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0);

    // Emit live update
    eventBus.emit({
      type: "cart:updated",
      data: { userId, itemCount: items.length },
      companyId: user.companyId,
    });

    return NextResponse.json({
      id: result[0]?.cart_id,
      user_id: userId,
      items,
      total,
      message: "Item removed from cart",
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Error removing from cart:", error);
    const message = error instanceof Error ? error.message : "Failed to remove item";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
