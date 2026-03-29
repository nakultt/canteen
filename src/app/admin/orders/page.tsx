"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface OrderItem {
  food_item_id: number;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  items: OrderItem[];
}

export default function AdminOrders() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
        return;
      }
      if (user.role === "USER") {
        router.push("/");
        return;
      }
      fetchOrders();
    }
  }, [user, authLoading, router]);

  const fetchOrders = async () => {
    if (!user?.company_id) return;

    try {
      const res = await fetch(`/api/admin/orders?companyId=${user.company_id}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: number, status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        fetchOrders();
      } else {
        alert("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "PREPARING":
        return "bg-blue-100 text-blue-800";
      case "READY":
        return "bg-purple-100 text-purple-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredOrders = filter === "ALL" 
    ? orders 
    : orders.filter(o => o.status === filter);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <Link href="/admin" className="text-blue-200 hover:text-white">
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold mt-2">Orders</h1>
          </div>
          <div className="flex gap-2">
            {["ALL", "PENDING", "PREPARING", "READY", "COMPLETED", "CANCELLED"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1 rounded-full text-sm ${
                  filter === s
                    ? "bg-white text-blue-800"
                    : "bg-blue-700 text-white hover:bg-blue-600"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="container mx-auto p-8">
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">Order #{order.id}</h3>
                  <p className="text-gray-600">{order.user.name} ({order.user.email})</p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <p className="text-xl font-bold text-emerald-600 mt-2">
                    ₹{Number(order.total_amount).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4 mb-4">
                <h4 className="font-medium mb-2">Items:</h4>
                <div className="space-y-1">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.name} × {item.quantity}</span>
                      <span>₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                {order.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => updateStatus(order.id, "PREPARING")}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Start Preparing
                    </button>
                    <button
                      onClick={() => updateStatus(order.id, "CANCELLED")}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {order.status === "PREPARING" && (
                  <button
                    onClick={() => updateStatus(order.id, "READY")}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Mark Ready
                  </button>
                )}
                {order.status === "READY" && (
                  <button
                    onClick={() => updateStatus(order.id, "COMPLETED")}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Mark Completed
                  </button>
                )}
              </div>
            </div>
          ))}

          {filteredOrders.length === 0 && (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No orders found.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
