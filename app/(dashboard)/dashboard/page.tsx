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
    <div className="min-h-screen flex bg-gradient-to-br from-blue-800 via-blue-700 to-blue-400">

      {/* MAIN CONTENT */}
      <main className="flex-1 p-10 text-white">

        {/* DASHBOARD HEADING */}
        <h1 className="text-4xl font-bold text-white">Dashboard</h1>
        <p className="text-blue-100 mt-1">Goal‑Driven AI Scheduling Assistant</p>

        <h2 className="text-3xl font-semibold mt-6">
          Welcome back, {user.name}
        </h2>
        <p className="text-blue-100 mt-1">
          Here is your goal‑driven plan for today.
        </p>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-white/95 p-5 rounded-2xl shadow text-gray-800">
            <p className="text-sm text-gray-600">Today’s Tasks</p>
            <p className="text-2xl font-bold">5</p>
          </div>
          <div className="bg-white/95 p-5 rounded-2xl shadow text-gray-800">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold">2</p>
          </div>
          <div className="bg-white/95 p-5 rounded-2xl shadow text-gray-800">
            <p className="text-sm text-gray-600">Current XP</p>
            <p className="text-2xl font-bold">{user.xp}</p>
          </div>
          <div className="bg-white/95 p-5 rounded-2xl shadow text-gray-800">
            <p className="text-sm text-gray-600">Streak</p>
            <p className="text-2xl font-bold">{user.streak} days</p>
          </div>
        </div>

        {/* GRID BELOW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-10">

          {/* PROFILE OVERVIEW */}
          <div className="bg-white/95 p-8 rounded-[32px] shadow-xl text-gray-800">
            <h3 className="text-xl font-bold mb-4">Profile Overview</h3>

            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-blue-200 rounded-full flex items-center justify-center text-3xl font-bold text-blue-700">
                {user.name.charAt(0)}
              </div>

              <div>
                <p className="text-lg font-semibold">{user.name}</p>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-sm text-blue-600 mt-1">Level 3 Planner</p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-gray-700 font-medium mb-1">XP Progress</p>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full"
                  style={{ width: `${(user.xp / 400) * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">{user.xp} / 400 XP</p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 text-center">
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-2xl font-bold">{user.streak}</p>
                <p className="text-gray-600 text-sm">Day Streak 🔥</p>
              </div>

              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-2xl font-bold">3</p>
                <p className="text-gray-600 text-sm">Active Goals</p>
              </div>
            </div>
          </div>

          {/* PLANNING PREFERENCES */}
          <div className="col-span-2 bg-white/95 p-8 rounded-[32px] shadow-xl text-gray-800">
            <h3 className="text-xl font-bold mb-4">Planning Preferences</h3>

            <div className="grid grid-cols-2 gap-6">

              <div>
                <p className="text-gray-700 font-medium">Preferred start time</p>
                <p className="text-gray-900 font-semibold">{user.startTime}</p>
              </div>

              <div>
                <p className="text-gray-700 font-medium">Preferred end time</p>
                <p className="text-gray-900 font-semibold">{user.endTime}</p>
              </div>

              <div>
                <p className="text-gray-700 font-medium">Daily workload capacity</p>
                <p className="text-gray-900 font-semibold">{user.workload}</p>
              </div>

              <div>
                <p className="text-gray-700 font-medium">Preferred focus style</p>
                <p className="text-gray-900 font-semibold">{user.focusStyle}</p>
              </div>

              <div>
                <p className="text-gray-700 font-medium">Break preference</p>
                <p className="text-gray-900 font-semibold">{user.breakPref}</p>
              </div>

            </div>
          </div>

          {/* PERSONALISATION */}
          <div className="col-span-3 bg-white/95 p-8 rounded-[32px] shadow-xl text-gray-800">
            <h3 className="text-xl font-bold mb-4">Personalisation</h3>

            <div className="grid grid-cols-3 gap-6">

              <div>
                <p className="text-gray-700 font-medium">Motivation style</p>
                <p className="text-gray-900 font-semibold">{user.motivation}</p>
              </div>

              <div>
                <p className="text-gray-700 font-medium">Priority preference</p>
                <p className="text-gray-900 font-semibold">{user.priority}</p>
              </div>

              <div>
                <p className="text-gray-700 font-medium">Schedule style</p>
                <p className="text-gray-900 font-semibold">{user.scheduleStyle}</p>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}