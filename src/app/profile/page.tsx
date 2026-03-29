"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  company_id: number | null;
  company: {
    id: number;
    name: string;
    address: string;
  } | null;
  created_at: string;
}

export default function Profile() {
  const { user, loading: authLoading, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      fetchProfile();
    }
  }, [user, authLoading, router]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/user/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          name: data.name || "",
          email: data.email || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/user/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchProfile();
        setEditing(false);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name,
        email: profile.email,
      });
    }
    setEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "DEV":
        return "bg-purple-100 text-purple-800";
      case "ADMIN":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  if (authLoading || loading) {
    return (
      <div>
        <Navbar username={user?.name} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <p className="text-xl">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div>
        <Navbar username={user?.name} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-xl text-red-600">Failed to load profile</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar username={user?.name} />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">My Profile</h1>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 bg-emerald-600 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {profile.name?.charAt(0).toUpperCase() || "?"}
                </span>
              </div>
            </div>

            <div className="grid gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                ) : (
                  <p className="text-lg text-gray-900">{profile.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                {editing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                ) : (
                  <p className="text-lg text-gray-900">{profile.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(
                    profile.role
                  )}`}
                >
                  {profile.role}
                </span>
              </div>

              {profile.company && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company / Organization
                  </label>
                  <p className="text-lg text-gray-900">{profile.company.name}</p>
                  <p className="text-sm text-gray-500">{profile.company.address}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Member Since
                </label>
                <p className="text-lg text-gray-900">
                  {formatDate(profile.created_at)}
                </p>
              </div>
            </div>

            {editing && (
              <div className="flex space-x-4 pt-6 border-t">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-gray-400"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t">
            <h2 className="text-xl font-semibold mb-4">Account Actions</h2>
            <div className="space-y-3">
              {user?.role === "DEV" && (
                <button
                  onClick={() => router.push("/dev")}
                  className="w-full text-left px-4 py-3 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  Go to DEV Dashboard
                </button>
              )}
              {(user?.role === "DEV" || user?.role === "ADMIN") && (
                <button
                  onClick={() => router.push("/admin")}
                  className="w-full text-left px-4 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Go to Admin Dashboard
                </button>
              )}
              <button
                onClick={logout}
                className="w-full text-left px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
