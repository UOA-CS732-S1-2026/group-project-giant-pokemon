"use client";

import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Editable fields
  const [name, setName] = useState("");
  const [role, setRole] = useState("Student");
  const [mainGoal, setMainGoal] = useState("");

  // Planning Preferences
  const [startTime, setStartTime] = useState("09:00 AM");
  const [endTime, setEndTime] = useState("05:00 PM");
  const [workload, setWorkload] = useState("Balanced");
  const [focusStyle, setFocusStyle] = useState("Deep Work");
  const [breakPref, setBreakPref] = useState("15 minutes");

  // Personalisation
  const [motivation, setMotivation] = useState("Encouraging");
  const [priority, setPriority] = useState("Balanced");
  const [scheduleStyle, setScheduleStyle] = useState("Flexible blocks");

  useEffect(() => {
    async function fetchUser() {
      const res = await fetch("/api/auth/me");

      if (!res.ok) {
        window.location.href = "/auth";
        return;
      }

      const data = await res.json();
      setUser(data.user);

      // Load existing values
      setName(data.user.name);
      setRole(data.user.role);
      setMainGoal(data.user.mainGoal);

      setStartTime(data.user.startTime);
      setEndTime(data.user.endTime);
      setWorkload(data.user.workload);
      setFocusStyle(data.user.focusStyle);
      setBreakPref(data.user.breakPref);

      setMotivation(data.user.motivation);
      setPriority(data.user.priority);
      setScheduleStyle(data.user.scheduleStyle);

      setLoading(false);
    }

    fetchUser();
  }, []);

  async function handleSave() {
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        role,
        mainGoal,
        startTime,
        endTime,
        workload,
        focusStyle,
        breakPref,
        motivation,
        priority,
        scheduleStyle,
      }),
    });

    alert("Profile updated!");
  }

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
          Profile Overview
        </h1>
        <p className="text-blue-300 mt-1 text-lg">
          Manage your personal details and preferences.
        </p>
      </header>

      {/* GRID: LEFT + RIGHT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 bg-gradient-to-b from-[#1a2b6d] via-[#0f1a4a] to-[#0a1138]
        border border-blue-500/20 rounded-3xl p-10 shadow-xl text-white">

        {/* LEFT CARD — PROFILE INFORMATION */}
        <div className="col-span-2 bg-gradient-to-b from-[#1a2b6d] via-[#0f1a4a] to-[#0a1138]
          border border-blue-500/20 rounded-3xl p-10 shadow-xl text-white">

          <h3 className="text-xl font-bold mb-6">Profile Information</h3>

          <div className="space-y-6">

            <div>
              <label className="block text-blue-200 font-medium mb-1">Full name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0d1538] text-white border border-blue-500/20 rounded-lg px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-blue-200 font-medium mb-1">Email</label>
              <input
                value={user.email}
                disabled
                className="w-full bg-[#0d1538] text-blue-300 border border-blue-500/20 rounded-lg px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-blue-200 font-medium mb-1">Role / Focus</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-[#0d1538] text-white border border-blue-500/20 rounded-lg px-4 py-2"
              >
                <option>Student</option>
                <option>Developer</option>
                <option>Researcher</option>
                <option>Professional</option>
              </select>
            </div>

            <div>
              <label className="block text-blue-200 font-medium mb-1">Main goal</label>
              <input
                value={mainGoal}
                onChange={(e) => setMainGoal(e.target.value)}
                className="w-full bg-[#0d1538] text-white border border-blue-500/20 rounded-lg px-4 py-2"
              />
            </div>

          </div>
        </div>

        {/* RIGHT CARD — PROFILE SUMMARY */}
        <div className="bg-gradient-to-b from-[#1a2b6d] via-[#0f1a4a] to-[#0a1138]
        border border-blue-500/20 rounded-3xl p-10 shadow-xl text-white shadow-xl text-center text-white flex flex-col items-center">

          <div className="w-28 h-28 bg-white/20 rounded-full flex items-center justify-center
            text-4xl font-bold uppercase shadow-lg">
            {user.name.charAt(0)}
          </div>

          <p className="text-blue-100 text-sm mt-3">{role}</p>

          <div className="w-full h-px bg-white/20 my-6"></div>

          <p className="text-lg font-semibold">Level 3 Planner</p>

          <div className="mt-6 space-y-2">
            <p className="text-blue-100">
              XP: <span className="font-bold text-white">{user.xp} XP</span>
            </p>
            <p className="text-blue-100">{user.streak} day streak</p>
          </div>

        </div>
      </div>

      {/* PLANNING PREFERENCES */}
      <div className="bg-gradient-to-b from-[#1a2b6d] via-[#0f1a4a] to-[#0a1138]
        border border-blue-500/20 rounded-3xl p-10 shadow-xl text-white">

        <h3 className="text-xl font-bold mb-6">Planning Preferences</h3>

        <div className="grid grid-cols-2 gap-6">

          <div>
            <label className="block text-blue-200 font-medium mb-1">Preferred start time</label>
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-[#0d1538] text-white border border-blue-500/20 rounded-lg px-4 py-2"
            >
              <option>07:00 AM</option>
              <option>08:00 AM</option>
              <option>09:00 AM</option>
            </select>
          </div>

          <div>
            <label className="block text-blue-200 font-medium mb-1">Preferred end time</label>
            <select
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full bg-[#0d1538] text-white border border-blue-500/20 rounded-lg px-4 py-2"
            >
              <option>04:00 PM</option>
              <option>05:00 PM</option>
              <option>06:00 PM</option>
            </select>
          </div>

          <div>
            <label className="block text-blue-200 font-medium mb-1">Daily workload capacity</label>
            <select
              value={workload}
              onChange={(e) => setWorkload(e.target.value)}
              className="w-full bg-[#0d1538] text-white border border-blue-500/20 rounded-lg px-4 py-2"
            >
              <option>Light</option>
              <option>Balanced</option>
              <option>Heavy</option>
            </select>
          </div>

          <div>
            <label className="block text-blue-200 font-medium mb-1">Preferred focus style</label>
            <select
              value={focusStyle}
              onChange={(e) => setFocusStyle(e.target.value)}
              className="w-full bg-[#0d1538] text-white border border-blue-500/20 rounded-lg px-4 py-2"
            >
              <option>Deep Work</option>
              <option>Pomodoro</option>
              <option>Short Bursts</option>
            </select>
          </div>

          <div>
            <label className="block text-blue-200 font-medium mb-1">Break preference</label>
            <select
              value={breakPref}
              onChange={(e) => setBreakPref(e.target.value)}
              className="w-full bg-[#0d1538] text-white border border-blue-500/20 rounded-lg px-4 py-2"
            >
              <option>5 minutes</option>
              <option>10 minutes</option>
              <option>15 minutes</option>
              <option>20 minutes</option>
            </select>
          </div>

        </div>
      </div>

      {/* PERSONALISATION */}
      <div className="bg-gradient-to-b from-[#1a2b6d] via-[#0f1a4a] to-[#0a1138]
        border border-blue-500/20 rounded-3xl p-10 shadow-xl text-white">

        <h3 className="text-xl font-bold mb-6">Personalisation</h3>

        <div className="grid grid-cols-3 gap-6">

          <div>
            <label className="block text-blue-200 font-medium mb-1">Motivation style</label>
            <select
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              className="w-full bg-[#0d1538] text-white border border-blue-500/20 rounded-lg px-4 py-2"
            >
              <option>Encouraging</option>
              <option>Strict</option>
              <option>Neutral</option>
            </select>
          </div>

          <div>
            <label className="block text-blue-200 font-medium mb-1">Priority preference</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-[#0d1538] text-white border border-blue-500/20 rounded-lg px-4 py-2"
            >
              <option>Balanced</option>
              <option>Urgency first</option>
              <option>Difficulty first</option>
            </select>
          </div>

          <div>
            <label className="block text-blue-200 font-medium mb-1">Schedule style</label>
            <select
              value={scheduleStyle}
              onChange={(e) => setScheduleStyle(e.target.value)}
              className="w-full bg-[#0d1538] text-white border border-blue-500/20 rounded-lg px-4 py-2"
            >
              <option>Flexible blocks</option>
              <option>Structured</option>
              <option>Adaptive</option>
            </select>
          </div>

        </div>
      </div>

      {/* SAVE BUTTON */}
      <div className="mt-12 flex justify-center">
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white font-semibold px-10 py-3 rounded-xl text-lg shadow-md hover:bg-blue-700 transition"
        >
          Save All Preferences
        </button>
      </div>
    </div>
  );
}
