"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Company {
  id: number;
  name: string;
  address: string | null;
  user_count: number;
  admin_count: number;
}

export default function DevCompanies() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
  });

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
      fetchCompanies();
    }
  }, [user, authLoading, router]);

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/dev/companies");
      const data = await res.json();
      setCompanies(data.companies || []);
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const endpoint = editingCompany
      ? `/api/dev/companies/${editingCompany.id}`
      : "/api/dev/companies";
    const method = editingCompany ? "PUT" : "POST";

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        fetchCompanies();
        resetForm();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save");
      }
    } catch (error) {
      console.error("Error saving:", error);
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      address: company.address || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure? This will delete all associated users and data.")) return;

    try {
      const res = await fetch(`/api/dev/companies/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchCompanies();
      } else {
        alert("Failed to delete");
      }
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingCompany(null);
    setFormData({ name: "", address: "" });
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
            <h1 className="text-2xl font-bold mt-2">Manage Companies</h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-purple-600 px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            + Add Company
          </button>
        </div>
      </header>

      <main className="container mx-auto p-8">
        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">
                {editingCompany ? "Edit Company" : "Add New Company"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Company Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-purple-600 py-2 rounded-lg hover:bg-purple-700"
                  >
                    {editingCompany ? "Update" : "Create"}
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

        {/* Companies Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Address</th>
                <th className="px-4 py-3 text-center">Users</th>
                <th className="px-4 py-3 text-center">Admins</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id} className="border-t border-gray-700">
                  <td className="px-4 py-3">{company.id}</td>
                  <td className="px-4 py-3 font-medium">{company.name}</td>
                  <td className="px-4 py-3 text-gray-400">{company.address || "-"}</td>
                  <td className="px-4 py-3 text-center">{company.user_count}</td>
                  <td className="px-4 py-3 text-center">{company.admin_count}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleEdit(company)}
                      className="text-purple-400 hover:underline mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(company.id)}
                      className="text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No companies yet.
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
