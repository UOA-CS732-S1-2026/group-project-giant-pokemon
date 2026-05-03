"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function fetchUser() {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    }
    fetchUser();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <nav className="w-full bg-white shadow-md px-6 py-4 flex justify-between items-center">
      <Link href="/dashboard" className="text-xl font-bold text-blue-700">
        TASKFLOW AI
      </Link>

      <div className="flex items-center gap-6">
        {user && (
          <span className="text-gray-700 font-medium">
            Welcome, {user.name}
          </span>
        )}

        <Link href="/profile" className="text-blue-600 hover:underline">
          Profile Settings
        </Link>

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-1 rounded-lg hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}