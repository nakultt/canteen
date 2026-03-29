"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  company_id: number | null;
  company_name: string | null;
}

interface Company {
  id: number;
  name: string;
}

export default function DevUsers() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER",
    companyId: "",
  });
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
        return;
      }
      if (user.role !== "DEV") {
        router.push("/");
        return;
      }
      fetchData();
    }
  }, [user, authLoading, router]);

  const fetchData = async () => {
    try {
      const [userRes, compRes] = await Promise.all([
        fetch("/api/dev/users"),
        fetch("/api/dev/companies"),
      ]);

      const userData = await userRes.json();
      const compData = await compRes.json();

      setUsers(userData.users || []);
      setCompanies(compData.companies || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const endpoint = editingUser
      ? `/api/dev/users/${editingUser.id}`
      : "/api/dev/users";
    const method = editingUser ? "PUT" : "POST";

    const body: Record<string, string | number | null> = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      companyId: formData.companyId ? parseInt(formData.companyId) : null,
    };

    if (formData.password || !editingUser) {
      body.password = formData.password;
    }

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        fetchData();
        resetForm();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save");
      }
    } catch (error) {
      console.error("Error saving:", error);
    }
  };

  const handleEdit = (u: User) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: "",
      role: u.role,
      companyId: u.company_id?.toString() || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(`/api/dev/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      } else {
        alert("Failed to delete");
      }
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({ name: "", email: "", password: "", role: "USER", companyId: "" });
  };

  const filteredUsers = filter === "ALL"
    ? users
    : users.filter((u) => u.role === filter);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "DEV":
        return "bg-purple-600";
      case "ADMIN":
        return "bg-blue-600";
      default:
        return "bg-green-600";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <p className="text-xl text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-purple-900 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <Link href="/dev" className="text-purple-300 hover:text-white">
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold mt-2">Manage Users</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {["ALL", "DEV", "ADMIN", "USER"].map((r) => (
                <button
                  key={r}
                  onClick={() => setFilter(r)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filter === r
                      ? "bg-white text-purple-900"
                      : "bg-purple-700 hover:bg-purple-600"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-purple-600 px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              + Add User
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-8">
        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">
                {editingUser ? "Edit User" : "Add New User"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Password {editingUser ? "(leave blank to keep current)" : "*"}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="DEV">DEV</option>
                  </select>
                </div>
                {formData.role !== "DEV" && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Company</label>
                    <select
                      value={formData.companyId}
                      onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                    >
                      <option value="">Select company...</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-purple-600 py-2 rounded-lg hover:bg-purple-700"
                  >
                    {editingUser ? "Update" : "Create"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-gray-600 py-2 rounded-lg hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-center">Role</th>
                <th className="px-4 py-3 text-left">Company</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="border-t border-gray-700">
                  <td className="px-4 py-3">{u.id}</td>
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-gray-400">{u.email}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${getRoleBadge(u.role)}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{u.company_name || "-"}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleEdit(u)}
                      className="text-purple-400 hover:underline mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="text-red-400 hover:underline"
                      disabled={u.id === user?.id}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No users found.
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
