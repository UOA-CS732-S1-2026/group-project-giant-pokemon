"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  FlagIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  SparklesIcon,
  UserCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Profile", href: "/profile", icon: UserCircleIcon },
    { name: "Goals", href: "/goals", icon: FlagIcon },
    { name: "Tasks", href: "/tasks", icon: CheckCircleIcon },
    { name: "Schedule", href: "/schedule", icon: CalendarDaysIcon },
    { name: "Timetable", href: "/timetable", icon: ClockIcon },  // ← 新增
    { name: "Ocean", href: "/productivity-ocean", icon: SparklesIcon },
    { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  ];

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
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 transition rounded-lg px-2 py-1.5
                ${isActive 
                  ? "bg-blue-500/20 text-blue-300" 
                  : "hover:text-blue-400 hover:bg-blue-500/10"
                }
              `}
            >
              <Icon className="w-5 h-5" /> {item.name}
            </Link>
          );
        })}
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