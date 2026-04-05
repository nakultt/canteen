"use client";

import { useAuth } from "@/lib/auth-context";

export default function LogoutButton() {
  const { logout } = useAuth();

  return (
    <button onClick={logout} className="cursor-pointer hover:underline">
      Logout
    </button>
  );
}
