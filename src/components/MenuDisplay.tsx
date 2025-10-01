"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface FoodItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
}

interface MenuData {
  mealType: string | null;
  closingTime: string | null;
  foodItems: FoodItem[];
  message?: string;
}

export default function MenuDisplay({ userId }: { userId: number }) {
  const [menu, setMenu] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);

  useEffect(() => {
    fetchCurrentMenu();
  }, []);

  const fetchCurrentMenu = async () => {
    try {
      const response = await fetch("/api/menu/current");
      const data = await response.json();
      setMenu(data);
    } catch (error) {
      console.error("Error fetching menu:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (foodItemId: number) => {
    setAddingToCart(foodItemId);
    try {
      const response = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          foodItemId,
          quantity: 1,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Item added to cart!");
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

  if (!menu || !menu.foodItems || menu.foodItems.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-xl text-gray-600">
          {menu?.message || "No menu available at this time"}
        </p>
      </div>
    );
  }

  return (
    <div>
      {menu.mealType && menu.closingTime && (
        <div className="flex items-center justify-center bg-green-200 h-12 text-2xl">
          {menu.mealType} orders close at{" "}
          {new Date(menu.closingTime).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      )}

      <div className="flex flex-row flex-wrap p-3 gap-4">
        {menu.foodItems.map((item) => (
          <section key={item.id} className="p-6 flex justify-center">
            <article className="max-w-sm bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-shadow duration-300">
              <div className="relative w-full h-48 mb-3">
                <Image
                  src={
                    item.imageUrl ||
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
                ₹{item.price.toFixed(2)}
              </p>
              <button
                onClick={() => addToCart(item.id)}
                disabled={addingToCart === item.id}
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-900 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {addingToCart === item.id ? "Adding..." : "Add to Cart"}
              </button>
            </article>
          </section>
        ))}
      </div>
    </div>
  );
}
