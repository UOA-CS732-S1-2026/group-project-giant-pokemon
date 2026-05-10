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
    <aside className="
      w-72 
      bg-gradient-to-b from-[#1a2b6d] via-[#0f1a4a] to-[#0a1138]
      border-r border-blue-500/20
      shadow-xl
      p-8 
      flex flex-col gap-8
      text-white
    ">
      {/* LOGO */}
      <h1 className="text-3xl font-extrabold tracking-wide text-white">
        TASKFLOW AI
      </h1>
      <p className="text-sm text-blue-200 -mt-4">
        Goal‑Driven AI Scheduling Assistant
      </p>

      {/* NAVIGATION */}
      <nav className="flex flex-col gap-4 font-medium text-gray-300">
         <Link href="/profile" className="flex items-center gap-3 hover:text-blue-400 transition">
          <UserCircleIcon className="w-5 h-5" /> Profile
        </Link>

        <Link href="/goals" className="flex items-center gap-3 hover:text-blue-400 transition">
          <FlagIcon className="w-5 h-5" /> Goals
        </Link>

        <Link href="/tasks" className="flex items-center gap-3 hover:text-blue-400 transition">
          <CheckCircleIcon className="w-5 h-5" /> Tasks
        </Link>

        <Link href="/schedule" className="flex items-center gap-3 hover:text-blue-400 transition">
          <CalendarDaysIcon className="w-5 h-5" /> Schedule
        </Link>

        <Link href="/dashboard" className="flex items-center gap-3 hover:text-blue-400 transition">
          <HomeIcon className="w-5 h-5" /> Dashboard
        </Link>
      </nav>

      {/* LOGOUT BUTTON */}
      <button
        onClick={async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          window.location.href = "/";
        }}
        className="
          mt-auto 
          bg-blue-600 
          text-white 
          py-2 
          rounded-lg 
          hover:bg-blue-700 
          transition 
          font-medium
        "
      >
        Logout
      </button>
    </aside>
  );
}
