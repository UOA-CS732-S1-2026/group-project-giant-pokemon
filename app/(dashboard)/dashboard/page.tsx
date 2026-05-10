"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      const res = await fetch("/api/auth/me");

      if (!res.ok) {
        window.location.href = "/auth";
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
      <div className="min-h-screen flex items-center justify-center bg-[#050b24] text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-12 bg-gradient-to-b from-[#1a2b6d] via-[#0f1a4a] to-[#0a1138]
        border border-blue-500/20 rounded-3xl p-10 shadow-xl text-white">

      {/* HEADER */}
      <header>
        <h1 className="text-4xl font-extrabold tracking-tight text-white">
          Dashboard
        </h1>
        <p className="text-blue-300 mt-1 text-lg">
          Goal‑Driven AI Scheduling Assistant
        </p>

        <div className="mt-6">
          <h2 className="text-3xl font-semibold text-white">
            Welcome back, {user.name}
          </h2>
          <p className="text-blue-300 mt-1 text-base">
            Here is your goal‑driven plan for today.
          </p>
        </div>
      </header>

      {/* STATS */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: "Today’s Tasks", value: 5 },
          { label: "Completed", value: 2 },
          { label: "Current XP", value: user.xp },
          { label: "Streak", value: `${user.streak} days` },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-gradient-to-b from-[#1a2b6d] via-[#0f1a4a] to-[#0a1138]
            border border-blue-500/20 p-6 rounded-3xl shadow-xl"
          >
            <p className="text-sm text-blue-200">{item.label}</p>
            <p className="text-3xl font-bold text-white mt-1">{item.value}</p>
          </div>
        ))}
      </section>

      {/* AI INSIGHTS */}
      <section className="bg-gradient-to-r from-blue-700 to-blue-500 p-6 rounded-3xl shadow-xl text-white border border-blue-500/20">
        <h3 className="text-xl font-bold">AI Insights</h3>
        <p className="text-blue-100 mt-2 text-sm">
          Based on your workload and habits, today is a great day for deep work.
        </p>
      </section>

      {/* TODAY’S SCHEDULE */}
      <section className="bg-gradient-to-b from-[#1a2b6d] via-[#0f1a4a] to-[#0a1138]
        p-6 rounded-3xl shadow-xl border border-blue-500/20">
        <h3 className="text-lg font-bold text-white mb-4">Today’s Schedule</h3>

        <div className="space-y-4">
          {[
            { title: "Deep Work Session", time: "09:00 AM – 11:00 AM" },
            { title: "Break", time: "15 minutes" },
            { title: "Task Block", time: "11:30 AM – 01:00 PM" },
          ].map((item, i) => (
            <div key={i} className="p-4 bg-[#0d1538] border border-blue-500/20 rounded-xl">
              <p className="font-semibold text-white">{item.title}</p>
              <p className="text-sm text-blue-200">{item.time}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PREFERENCES */}
      <section className="bg-gradient-to-b from-[#1a2b6d] via-[#0f1a4a] to-[#0a1138]
        p-6 rounded-3xl shadow-xl border border-blue-500/20">
        <h3 className="text-lg font-bold text-white mb-4">Planning Preferences</h3>

        <div className="grid grid-cols-2 gap-6">
          {[
            { label: "Start time", value: user.startTime },
            { label: "End time", value: user.endTime },
            { label: "Workload", value: user.workload },
            { label: "Focus style", value: user.focusStyle },
          ].map((item, i) => (
            <div key={i}>
              <p className="text-blue-200 text-sm">{item.label}</p>
              <p className="text-white font-semibold mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
