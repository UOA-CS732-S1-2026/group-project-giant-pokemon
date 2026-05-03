// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      const res = await fetch("/api/auth/me");

      if (!res.ok) {
        window.location.href = "/login";
        return;
      }

      const data = await res.json();
      setUser(data.user);
      setLoading(false);
    }

    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="p-10">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome back, {user.name} 👋
        </h1>

        <p className="text-gray-600 mt-2">
          Your email: <span className="font-medium">{user.email}</span>
        </p>
      </div>
    </div>
  );
}