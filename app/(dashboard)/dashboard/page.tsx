"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HomeIcon,
  FlagIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

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
      <div className="min-h-screen bg-gradient-to-br from-blue-800 via-blue-700 to-blue-400 flex items-center justify-center">
        <p className="text-white text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <>
  {/* HEADER */}
  <header className="mb-10">
    <h1 className="text-4xl font-extrabold tracking-tight text-white">
      Dashboard
    </h1>
    <p className="text-blue-100 mt-1 text-lg">
      Goal‑Driven AI Scheduling Assistant
    </p>

    <div className="mt-6">
      <h2 className="text-3xl font-semibold text-white">
        Welcome back, {user.name}
      </h2>
      <p className="text-blue-100 mt-1 text-base">
        Here is your goal‑driven plan for today.
      </p>
    </div>
  </header>

  {/* STATS */}
  <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
    <div className="bg-white/95 p-6 rounded-3xl shadow border border-gray-200">
      <p className="text-sm text-gray-500">Today’s Tasks</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">5</p>
    </div>

    <div className="bg-white/95 p-6 rounded-3xl shadow border border-gray-200">
      <p className="text-sm text-gray-500">Completed</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">2</p>
    </div>

    <div className="bg-white/95 p-6 rounded-3xl shadow border border-gray-200">
      <p className="text-sm text-gray-500">Current XP</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{user.xp}</p>
    </div>

    <div className="bg-white/95 p-6 rounded-3xl shadow border border-gray-200">
      <p className="text-sm text-gray-500">Streak</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{user.streak} days</p>
    </div>
  </section>

  {/* AI INSIGHTS */}
  <section className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 rounded-3xl shadow-xl mt-10 text-white">
    <h3 className="text-xl font-bold">AI Insights</h3>
    <p className="text-blue-100 mt-2 text-sm">
      Based on your workload and habits, today is a great day for deep work.
    </p>
  </section>

  {/* TODAY’S SCHEDULE */}
  <section className="bg-white/95 p-6 rounded-3xl shadow-xl mt-10">
    <h3 className="text-lg font-bold text-gray-900 mb-4">Today’s Schedule</h3>

    <div className="space-y-4">
      <div className="p-4 bg-gray-100 rounded-xl">
        <p className="font-semibold text-gray-900">Deep Work Session</p>
        <p className="text-sm text-gray-600">09:00 AM – 11:00 AM</p>
      </div>

      <div className="p-4 bg-gray-100 rounded-xl">
        <p className="font-semibold text-gray-900">Break</p>
        <p className="text-sm text-gray-600">15 minutes</p>
      </div>

      <div className="p-4 bg-gray-100 rounded-xl">
        <p className="font-semibold text-gray-900">Task Block</p>
        <p className="text-sm text-gray-600">11:30 AM – 01:00 PM</p>
      </div>
    </div>
  </section>

  {/* PREFERENCES */}
  <section className="bg-white/95 p-6 rounded-3xl shadow-xl mt-10">
    <h3 className="text-lg font-bold text-gray-900 mb-4">Planning Preferences</h3>

    <div className="grid grid-cols-2 gap-6">
      <div>
        <p className="text-gray-600 text-sm">Start time</p>
        <p className="text-gray-900 font-semibold mt-1">{user.startTime}</p>
      </div>

      <div>
        <p className="text-gray-600 text-sm">End time</p>
        <p className="text-gray-900 font-semibold mt-1">{user.endTime}</p>
      </div>

      <div>
        <p className="text-gray-600 text-sm">Workload</p>
        <p className="text-gray-900 font-semibold mt-1">{user.workload}</p>
      </div>

      <div>
        <p className="text-gray-600 text-sm">Focus style</p>
        <p className="text-gray-900 font-semibold mt-1">{user.focusStyle}</p>
      </div>
    </div>
  </section>
</>

  );
}