"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useLiveUpdates } from "@/lib/use-live-updates";
import Navbar from "@/components/Navbar";
import MenuDisplay from "@/components/MenuDisplay";
import Cart from "@/components/Cart";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [cartRefreshKey, setCartRefreshKey] = useState(0);

  // Live updates — refresh cart when order status changes
  useLiveUpdates(
    (event) => {
      if (
        event.type === "order:updated" ||
        event.type === "cart:updated"
      ) {
        setCartRefreshKey((prev) => prev + 1);
      }
    },
    !!user
  );

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const onCartUpdate = () => {
    setCartRefreshKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div>
      <Navbar username={user.name} />
      <div className="mr-96">
        <MenuDisplay userId={user.id} onCartUpdate={onCartUpdate} />
      </div>
      <Cart userId={user.id} key={cartRefreshKey} />
    </div>
  );
}
