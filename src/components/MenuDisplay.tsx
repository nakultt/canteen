"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";

interface FoodItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
}

interface Menu {
  id: number;
  day_of_week: string;
  meal_type: string;
  start_time: string;
  end_time: string;
  items: FoodItem[];
}

interface MenuResponse {
  currentTime: string;
  currentDay: string;
  menus: Menu[];
  message?: string;
}

interface MenuDisplayProps {
  userId: number;
  onCartUpdate?: () => void;
}

export default function MenuDisplay({ userId, onCartUpdate }: MenuDisplayProps) {
  const { authFetch } = useAuth();
  const [menuData, setMenuData] = useState<MenuResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);

  useEffect(() => {
    fetchCurrentMenu();
  }, []);

  const fetchCurrentMenu = async () => {
    try {
      const response = await authFetch("/api/menu/current");
      const data = await response.json();
      setMenuData(data);
    } catch (error) {
      console.error("Error fetching menu:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (foodItemId: number) => {
    setAddingToCart(foodItemId);
    try {
      const response = await authFetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodItemId,
          quantity: 1,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onCartUpdate?.();
      } else {
        alert(data.error || "Failed to add item");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add item to cart");
    } finally {
      setAddingToCart(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-xl">Loading menu...</p>
      </div>
    );
  }

  if (!menuData || !menuData.menus || menuData.menus.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-xl text-gray-600">
          {menuData?.message || "No menu available at this time"}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-center bg-green-200 h-12 text-lg px-4">
        <span className="font-semibold">{menuData.currentDay}</span>
        <span className="mx-2">•</span>
        <span>Current time: {menuData.currentTime}</span>
      </div>

      {menuData.menus.map((menu) => (
        <div key={menu.id} className="mb-8">
          <div className="bg-emerald-100 py-2 px-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-emerald-800">
              {menu.meal_type}
            </h2>
            <span className="text-sm text-gray-600">
              {menu.start_time} - {menu.end_time}
            </span>
          </div>

          <div className="flex flex-row flex-wrap p-3 gap-4">
            {menu.items.map((item) => (
              <section key={item.id} className="p-6 flex justify-center">
                <article className="max-w-sm bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-shadow duration-300">
                  <div className="relative w-full h-48 mb-3">
                    <Image
                      src={
                        item.image_url ||
                        "https://media.istockphoto.com/id/1829241109/photo/enjoying-a-brunch-together.jpg?s=1024x1024&w=is&k=20&c=QPHFTWoscwMSXOEGKoAKOjlCnMGszppFBrqQHdy4EGc="
                      }
                      alt={item.name}
                      fill
                      className="rounded-xl object-cover"
                    />
                  </div>
                  <h2 className="text-lg font-semibold mb-2">{item.name}</h2>
                  <p className="text-gray-600 mb-2">
                    {item.description || "Delicious food item"}
                  </p>
                  <p className="text-xl font-bold text-emerald-600 mb-4">
                    ₹{Number(item.price).toFixed(2)}
                  </p>
                  <button
                    onClick={() => addToCart(item.id)}
                    disabled={addingToCart === item.id || !item.is_available}
                    className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-900 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {addingToCart === item.id
                      ? "Adding..."
                      : !item.is_available
                        ? "Unavailable"
                        : "Add to Cart"}
                  </button>
                </article>
              </section>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
