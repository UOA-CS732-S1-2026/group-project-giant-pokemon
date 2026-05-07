"use client";

import Link from "next/link";
import {
  HomeIcon,
  FlagIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

export default function Sidebar() {
  return (
    <aside className="w-72 bg-white/95 backdrop-blur-md shadow-2xl rounded-r-[32px] p-8 flex flex-col gap-8">
      <h1 className="text-3xl font-extrabold text-blue-700">TASKFLOW AI</h1>
      <p className="text-sm text-gray-600 -mt-4">Goal‑Driven AI Scheduling Assistant</p>

      <nav className="flex flex-col gap-4 text-gray-700 font-medium">
        <Link href="/dashboard" className="flex items-center gap-3 hover:text-blue-600 transition">
          <HomeIcon className="w-5 h-5" /> Dashboard
        </Link>

        <Link href="/goals" className="flex items-center gap-3 hover:text-blue-600 transition">
          <FlagIcon className="w-5 h-5" /> Goals
        </Link>

        <Link href="/tasks" className="flex items-center gap-3 hover:text-blue-600 transition">
          <CheckCircleIcon className="w-5 h-5" /> Tasks
        </Link>

        <Link href="/schedule" className="flex items-center gap-3 hover:text-blue-600 transition">
          <CalendarDaysIcon className="w-5 h-5" /> Schedule
        </Link>

        <Link href="/profile" className="flex items-center gap-3 hover:text-blue-600 transition">
          <UserCircleIcon className="w-5 h-5" /> Profile
        </Link>
      </nav>
      <button
        onClick={async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          window.location.href = "/login";
        }}
        className="mt-auto bg-blue-500 text-white py-2 rounded-lg hover:bg-red-600 transition"
      >
        Logout
      </button>
    </aside>
  );
}
