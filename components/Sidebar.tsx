"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CircleUserRound,
  Clock3,
  Flag,
  Home,
  ListChecks,
  LogOut,
  Sparkles,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Profile", href: "/profile", icon: CircleUserRound },
    { name: "Goals", href: "/goals", icon: Flag },
    { name: "Tasks", href: "/tasks", icon: ListChecks },
    { name: "Schedule", href: "/schedule", icon: CalendarDays },
    { name: "Timetable", href: "/timetable", icon: Clock3 },
    { name: "Ocean", href: "/productivity-ocean", icon: Sparkles },
  ];

  return (
    <aside className="flex h-fit flex-col rounded-lg border border-white/10 bg-slate-950/55 p-5 text-white shadow-2xl shadow-blue-950/30 backdrop-blur-xl lg:sticky lg:top-5 lg:min-h-[calc(100vh-2.5rem)]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-500 shadow-lg shadow-blue-500/30">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-white">Taskflow</h1>
          <p className="text-xs text-blue-200">AI scheduling console</p>
        </div>
      </div>

      <nav className="mt-8 grid gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md border px-3 py-3 text-sm font-medium transition ${
                isActive
                  ? "border-blue-300/30 bg-blue-500/20 text-white shadow-lg shadow-blue-950/20"
                  : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white"
                }
              `}
            >
              <Icon className="h-4 w-4" /> {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 rounded-md border border-cyan-300/20 bg-cyan-300/10 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">Today</p>
        <p className="mt-2 text-2xl font-semibold">Focus</p>
        <p className="mt-1 text-sm leading-5 text-cyan-50/75">Plan, execute, and keep the day visible.</p>
      </div>

      <button
        onClick={async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          window.location.href = "/";
        }}
        className="mt-auto inline-flex items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/20 transition hover:border-blue-200/50 hover:bg-blue-400/10"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </aside>
  );
}
