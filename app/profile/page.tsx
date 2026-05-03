"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function fetchUser() {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        window.location.href = "/login";
        return;
      }
      const data = await res.json();
      setUser(data.user);
      setName(data.user.name);
      setEmail(data.user.email);
    }
    fetchUser();
  }, []);

  async function handleUpdate() {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (res.ok) {
      alert("Profile updated!");
    } else {
      alert("Update failed");
    }
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="flex justify-center items-start pt-16 px-4">
        <div className="relative bg-white shadow-xl rounded-2xl p-8 w-full max-w-lg">

            {/* CLOSE BUTTON */}
            <button
            onClick={() => window.location.href = "/dashboard"}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
            ×
            </button>

            <h2 className="text-2xl font-bold mb-6 text-gray-800">Update Profile</h2>

            <div className="space-y-5">
            {/* NAME */}
            <div>
                <label className="block text-gray-700 mb-1 font-medium">Name</label>
                <input
                className="w-full border border-gray-300 px-3 py-2 rounded-lg bg-gray-200 
                text-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
                />
            </div>

            {/* EMAIL */}
            <div>
                <label className="block text-gray-700 mb-1 font-medium">Email</label>
                <input
                className="w-full border border-gray-300 px-3 py-2 rounded-lg bg-gray-200 
                text-gray-600 cursor-not-allowed"
                value={email}
                disabled
                />
            </div>

            <button
                onClick={handleUpdate}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
            >
                Save Changes
            </button>
            </div>
        </div>
        </div>
    </div>
  );
}