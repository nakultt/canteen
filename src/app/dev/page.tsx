"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLiveUpdates } from "@/lib/use-live-updates";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Company {
  id: number;
  name: string;
  address: string | null;
  user_count: number;
  admin_count: number;
}

export default function DevDashboard() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [userCount, setUserCount] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [compRes, userRes] = await Promise.all([
        authFetch("/api/dev/companies"),
        authFetch("/api/dev/users"),
      ]);

      const compData = await compRes.json();
      const userData = await userRes.json();

      setCompanies(compData.companies || []);
      setUserCount(userData.users?.length || 0);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [authFetch]);

  // Live updates — refresh when users, companies, or orders change
  useLiveUpdates(
    (event) => {
      if (
        event.type === "user:created" ||
        event.type === "user:updated" ||
        event.type === "user:deleted" ||
        event.type === "company:created" ||
        event.type === "company:updated" ||
        event.type === "company:deleted" ||
        event.type === "order:created" ||
        event.type === "order:updated"
      ) {
        fetchData();
      }
    },
    !!user && user.role === "DEV"
  );

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/dev/login");
        return;
      }
      if (user.role !== "DEV") {
        router.push("/");
        return;
      }
      fetchData();
    }
  }, [user, loading, router, fetchData]);

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-purple-900 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">DEV Dashboard</h1>
            <p className="text-purple-300">
              Global System Administration
              <span className="ml-2 inline-block w-2 h-2 bg-green-400 rounded-full" title="Live updates active" />
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span>Welcome, {user.name}</span>
            <Link href="/admin" className="text-purple-300 hover:text-white">
              Admin View
            </Link>
            <Link href="/" className="text-purple-300 hover:text-white">
              User View
            </Link>
            <Link
              href="/profile"
              className="text-purple-300 hover:text-white"
            >
              Profile
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm">Total Companies</h3>
            <p className="text-4xl font-bold text-purple-400">
              {companies.length}
            </p>
            <Link
              href="/dev/companies"
              className="text-purple-400 text-sm hover:underline"
            >
              Manage →
            </Link>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm">Total Users</h3>
            <p className="text-4xl font-bold text-green-400">{userCount}</p>
            <Link
              href="/dev/users"
              className="text-purple-400 text-sm hover:underline"
            >
              Manage →
            </Link>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm">Your Role</h3>
            <p className="text-4xl font-bold text-yellow-400">DEV</p>
            <p className="text-gray-500 text-sm">Full System Access</p>
          </div>
        </div>

        {/* Companies Overview */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Companies Overview</h2>
            <Link
              href="/dev/companies"
              className="bg-purple-600 px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              + Add Company
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="text-left py-3">Company Name</th>
                  <th className="text-left py-3">Address</th>
                  <th className="text-center py-3">Users</th>
                  <th className="text-center py-3">Admins</th>
                </tr>
              </thead>
              <tbody>
                {companies.slice(0, 5).map((company) => (
                  <tr key={company.id} className="border-b border-gray-700">
                    <td className="py-3 font-medium">{company.name}</td>
                    <td className="py-3 text-gray-400">
                      {company.address || "-"}
                    </td>
                    <td className="py-3 text-center">{company.user_count}</td>
                    <td className="py-3 text-center">
                      {company.admin_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            href="/dev/companies"
            className="block p-6 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <h3 className="font-bold text-purple-400 text-lg">
              Manage Companies
            </h3>
            <p className="text-gray-400">
              Add, edit, or remove companies from the system
            </p>
          </Link>
          <Link
            href="/dev/users"
            className="block p-6 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <h3 className="font-bold text-green-400 text-lg">
              Manage Users
            </h3>
            <p className="text-gray-400">
              View and manage all users across companies
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
