"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FoodItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
}

export default function AdminFoodItems() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    isAvailable: true,
  });

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
      fetchItems();
    }
  }, [user, authLoading, router]);

  const fetchItems = async () => {
    if (!user?.company_id) return;

    try {
      const res = await fetch(`/api/admin/food-items?companyId=${user.company_id}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const endpoint = editingItem 
      ? `/api/admin/food-items/${editingItem.id}`
      : "/api/admin/food-items";
    
    const method = editingItem ? "PUT" : "POST";

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: user?.company_id,
          name: formData.name,
          description: formData.description || null,
          price: parseFloat(formData.price),
          imageUrl: formData.imageUrl || null,
          isAvailable: formData.isAvailable,
        }),
      });

      if (res.ok) {
        fetchItems();
        resetForm();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save");
      }
    } catch (error) {
      console.error("Error saving:", error);
      alert("Failed to save");
    }
  };

  const handleEdit = (item: FoodItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      price: item.price.toString(),
      imageUrl: item.image_url || "",
      isAvailable: item.is_available,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const res = await fetch(`/api/admin/food-items/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchItems();
      } else {
        alert("Failed to delete");
      }
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      isAvailable: true,
    });
  };

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
            <h1 className="text-2xl font-bold mt-2">Manage Food Items</h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-white text-blue-800 px-4 py-2 rounded-lg hover:bg-blue-50"
          >
            + Add New Item
          </button>
        </div>
      </header>

      <main className="container mx-auto p-8">
        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">
                {editingItem ? "Edit Food Item" : "Add New Food Item"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Image URL</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  />
                  <label htmlFor="isAvailable">Available</label>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  >
                    {editingItem ? "Update" : "Create"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-gray-300 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Items Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-center">Available</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-gray-600 text-sm">
                    {item.description?.substring(0, 50) || "-"}
                  </td>
                  <td className="px-4 py-3 text-right">₹{Number(item.price).toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        item.is_available
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {item.is_available ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:underline mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No food items yet. Click "Add New Item" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
