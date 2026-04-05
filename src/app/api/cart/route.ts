import { query } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Get cart with items
    const cartItems = await query<{
      cart_id: number;
      user_id: number;
      item_id: number;
      food_item_id: number;
      quantity: number;
      name: string;
      price: number;
      image_url: string | null;
    }>(`
      SELECT 
        c.id as cart_id,
        c.user_id,
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

    if (cartItems.length === 0) {
      return NextResponse.json({
        id: null,
        user_id: userId,
        items: [],
        total: 0,
      });
    }

    const cart = {
      id: cartItems[0].cart_id,
      user_id: cartItems[0].user_id,
      items: [] as { id: number; food_item_id: number; quantity: number; name: string; price: number; image_url: string | null }[],
      total: 0,
    };

    for (const item of cartItems) {
      if (item.item_id) {
        cart.items.push({
          id: item.item_id,
          food_item_id: item.food_item_id,
          quantity: item.quantity,
          name: item.name,
          price: item.price,
          image_url: item.image_url,
        });
        cart.total += item.price * item.quantity;
      }
    }

    return NextResponse.json(cart);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}
