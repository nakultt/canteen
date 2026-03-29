import { query } from "@/lib/db";
import { NextResponse } from "next/server";

interface CartItem {
  id: number;
  food_item_id: number;
  quantity: number;
  name: string;
  price: number;
  image_url: string | null;
}

interface Cart {
  id: number;
  user_id: number;
  items: CartItem[];
  total: number;
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
      // No cart exists
      return NextResponse.json({
        id: null,
        user_id: Number.parseInt(userId),
        items: [],
        total: 0,
      });
    }

    const cart: Cart = {
      id: cartItems[0].cart_id,
      user_id: cartItems[0].user_id,
      items: [],
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
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}
