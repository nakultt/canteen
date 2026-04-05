"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLiveUpdates } from "@/lib/use-live-updates";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import { useRouter } from "next/navigation";

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

export default function MyOrders() {
  const { user, loading: authLoading, authFetch } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Live updates — refresh when order is created or updated
  useLiveUpdates(
    (event) => {
      if (event.type === "order:created" || event.type === "order:updated") {
        fetchOrders();
      }
    },
    !!user
  );

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
        return;
      }
      fetchOrders();
    }
  }, [user, authLoading, router]);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      const response = await authFetch("/api/orders");
      const data = await response.json();

      if (response.ok) {
        setOrders(data.orders);
      } else {
        console.error("Error fetching orders:", data.error);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "preparing":
        return "bg-blue-100 text-blue-800";
      case "ready":
        return "bg-purple-100 text-purple-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (authLoading || loading) {
    return (
      <div>
        <Navbar username={user?.name} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <p className="text-xl">Loading your orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar username={user?.name} />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600 mb-4">No orders found</p>
            <p className="text-gray-500">
              You haven&apos;t placed any orders yet.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">
                      Order #{order.id}
                    </h2>
                    <p className="text-gray-600">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                    <p className="text-xl font-bold text-emerald-600 mt-2">
                      ₹{Number(order.total_amount).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">Order Items:</h3>
                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="relative w-16 h-16 flex-shrink-0">
                          <Image
                            src={
                              item.image_url ||
                              "https://media.istockphoto.com/id/1829241109/photo/enjoying-a-brunch-together.jpg?s=1024x1024&w=is&k=20&c=QPHFTWoscwMSXOEGKoAKOjlCnMGszppFBrqQHdy4EGc="
                            }
                            alt={item.name}
                            fill
                            className="rounded-lg object-cover"
                          />
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-medium">{item.name}</h4>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            ₹{Number(item.price).toFixed(2)} × {item.quantity}
                          </p>
                          <p className="text-sm text-gray-600">
                            Total: ₹
                            {(Number(item.price) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
