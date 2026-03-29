import { query, withTransaction } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, foodItemId, removeAll = false } = body;

    if (!userId || !foodItemId) {
      return NextResponse.json(
        { error: "userId and foodItemId are required" },
        { status: 400 }
      );
    }

    const result = await withTransaction(async (client) => {
      // Get cart
      const cart = await client.query(
        "SELECT id FROM carts WHERE user_id = $1",
        [userId]
      );

      if (cart.rows.length === 0) {
        throw new Error("Cart not found");
      }

      const cartId = cart.rows[0].id;

      // Get existing item
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
        // Remove item entirely
        await client.query("DELETE FROM cart_items WHERE id = $1", [itemId]);
      } else {
        // Decrease quantity by 1
        await client.query(
          "UPDATE cart_items SET quantity = quantity - 1 WHERE id = $1",
          [itemId]
        );
      }

      // Return updated cart
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

    // Format response
    const items = result.filter(r => r.item_id).map(r => ({
      id: r.item_id,
      food_item_id: r.food_item_id,
      quantity: r.quantity,
      name: r.name,
      price: r.price,
      image_url: r.image_url,
    }));

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return NextResponse.json({
      id: result[0]?.cart_id,
      user_id: userId,
      items,
      total,
      message: "Item removed from cart",
    });
  } catch (error) {
    console.error("Error removing from cart:", error);
    const message = error instanceof Error ? error.message : "Failed to remove item";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
