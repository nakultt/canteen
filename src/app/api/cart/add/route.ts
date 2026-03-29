import { query, queryOne, withTransaction } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, foodItemId, quantity = 1 } = body;

    if (!userId || !foodItemId) {
      return NextResponse.json(
        { error: "userId and foodItemId are required" },
        { status: 400 }
      );
    }

    const result = await withTransaction(async (client) => {
      // Check if cart exists for user
      let cart = await client.query(
        "SELECT id FROM carts WHERE user_id = $1",
        [userId]
      );

      let cartId: number;

      if (cart.rows.length === 0) {
        // Create new cart
        const newCart = await client.query(
          "INSERT INTO carts (user_id) VALUES ($1) RETURNING id",
          [userId]
        );
        cartId = newCart.rows[0].id;
      } else {
        cartId = cart.rows[0].id;
      }

      // Check if item already exists in cart
      const existingItem = await client.query(
        "SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND food_item_id = $2",
        [cartId, foodItemId]
      );

      if (existingItem.rows.length > 0) {
        // Update quantity
        const newQuantity = existingItem.rows[0].quantity + quantity;
        await client.query(
          "UPDATE cart_items SET quantity = $1 WHERE id = $2",
          [newQuantity, existingItem.rows[0].id]
        );
      } else {
        // Add new item
        await client.query(
          "INSERT INTO cart_items (cart_id, food_item_id, quantity) VALUES ($1, $2, $3)",
          [cartId, foodItemId, quantity]
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
      message: "Item added to cart",
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json(
      { error: "Failed to add item to cart" },
      { status: 500 }
    );
  }
}
