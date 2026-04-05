"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";

interface CartItem {
  id: number;
  food_item_id: number;
  quantity: number;
  name: string;
  price: number;
  image_url: string | null;
}

interface CartData {
  id: number | null;
  user_id: number;
  items: CartItem[];
  total: number;
}

export default function Cart({ userId }: { userId: number }) {
  const { authFetch } = useAuth();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingItem, setProcessingItem] = useState<number | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    fetchCart();
  }, [userId]);

  const fetchCart = async () => {
    try {
      const response = await authFetch("/api/cart");
      const data = await response.json();
      setCart(data);
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (foodItemId: number, removeAll = false) => {
    setProcessingItem(foodItemId);
    try {
      const response = await authFetch("/api/cart/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodItemId, removeAll }),
      });

      if (response.ok) {
        const data = await response.json();
        setCart(data);
      }
    } catch (error) {
      console.error("Error removing item:", error);
    } finally {
      setProcessingItem(null);
    }
  };

  const addItem = async (foodItemId: number) => {
    setProcessingItem(foodItemId);
    try {
      const response = await authFetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodItemId, quantity: 1 }),
      });

      if (response.ok) {
        const data = await response.json();
        setCart(data);
      }
    } catch (error) {
      console.error("Error adding item:", error);
    } finally {
      setProcessingItem(null);
    }
  };

  const placeOrder = async () => {
    if (!cart || cart.items.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    setPlacingOrder(true);
    try {
      const response = await authFetch("/api/order/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Order placed successfully!");
        fetchCart();
      } else {
        alert(data.error || "Failed to place order");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Failed to place order");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading cart...</div>;
  }

  return (
    <div className="fixed right-0 top-12 w-96 h-[calc(100vh-3rem)] bg-white shadow-lg p-6 overflow-y-auto border-l">
      <h2 className="text-2xl font-bold mb-4">Your Cart</h2>

      {!cart || cart.items.length === 0 ? (
        <p className="text-gray-600">Your cart is empty</p>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center border-b pb-4"
              >
                <div className="flex-1">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-gray-600">
                    ₹{Number(item.price).toFixed(2)} each
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => removeItem(item.food_item_id)}
                      disabled={processingItem === item.food_item_id}
                      className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                    >
                      -
                    </button>
                    <span className="font-medium">{item.quantity}</span>
                    <button
                      onClick={() => addItem(item.food_item_id)}
                      disabled={processingItem === item.food_item_id}
                      className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-emerald-600 font-bold mt-1">
                    ₹{(Number(item.price) * item.quantity).toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => removeItem(item.food_item_id, true)}
                  disabled={processingItem === item.food_item_id}
                  className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-bold">Total:</span>
              <span className="text-2xl font-bold text-emerald-600">
                ₹{Number(cart.total).toFixed(2)}
              </span>
            </div>
            <button
              onClick={placeOrder}
              disabled={placingOrder}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {placingOrder ? "Placing Order..." : "Place Order"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
