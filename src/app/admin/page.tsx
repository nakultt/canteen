"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLiveUpdates } from "@/lib/use-live-updates";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminDashboard() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    foodItems: 0,
    orders: 0,
    pendingOrders: 0,
  });

  const fetchStats = useCallback(async () => {
    if (!user) return;

    try {
      const [foodRes, orderRes] = await Promise.all([
        authFetch("/api/admin/food-items"),
        authFetch("/api/admin/orders"),
      ]);
      const foodData = await foodRes.json();
      const orderData = await orderRes.json();

      const pendingOrders =
        orderData.orders?.filter(
          (o: { status: string }) =>
            o.status === "PENDING" || o.status === "PREPARING"
        ).length || 0;

      setStats({
        foodItems: foodData.items?.length || 0,
        orders: orderData.orders?.length || 0,
        pendingOrders,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, [user, authFetch]);

  // Live updates — refresh stats when orders or food items change
  useLiveUpdates(
    (event) => {
      if (
        event.type === "order:created" ||
        event.type === "order:updated" ||
        event.type === "food:created" ||
        event.type === "food:updated" ||
        event.type === "food:deleted"
      ) {
        fetchStats();
      }
    },
    !!user && user.role !== "USER"
  );

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/admin/login");
        return;
      }
      if (user.role === "USER") {
        router.push("/");
        return;
      }
      fetchStats();
    }
  }, [user, loading, router, fetchStats]);

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-blue-200">
              {user.company_name || "Company"}
              <span className="ml-2 inline-block w-2 h-2 bg-green-400 rounded-full" title="Live updates active" />
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span>Welcome, {user.name}</span>
            <Link href="/" className="text-blue-200 hover:text-white">
              User View
            </Link>
            <Link href="/profile" className="text-blue-200 hover:text-white">
              Profile
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm">Food Items</h3>
            <p className="text-3xl font-bold text-blue-600">
              {stats.foodItems}
            </p>
            <Link
              href="/admin/food-items"
              className="text-blue-500 text-sm hover:underline"
            >
              Manage →
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm">Total Orders</h3>
            <p className="text-3xl font-bold text-green-600">{stats.orders}</p>
            <Link
              href="/admin/orders"
              className="text-blue-500 text-sm hover:underline"
            >
              View All →
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm">Pending Orders</h3>
            <p className="text-3xl font-bold text-orange-600">
              {stats.pendingOrders}
            </p>
            <Link
              href="/admin/orders"
              className="text-blue-500 text-sm hover:underline"
            >
              Process →
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/admin/food-items"
              className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <h3 className="font-semibold text-blue-800">
                Manage Food Items
              </h3>
              <p className="text-sm text-gray-600">
                Add, edit, or remove menu items
              </p>
            </Link>
            <Link
              href="/admin/orders"
              className="block p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <h3 className="font-semibold text-green-800">View Orders</h3>
              <p className="text-sm text-gray-600">
                Track and update order status
              </p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
