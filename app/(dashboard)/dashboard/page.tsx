"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Flag, ListChecks, Sparkles } from "lucide-react";
import { Badge, LoadingState, PageHeader, Panel } from "@/components/ui/foundation";

type DashboardUser = {
  name?: string;
};

type TasksStatsResponse = {
  success?: boolean;
  data?: unknown[];
};

type ScheduleStatsResponse = {
  success?: boolean;
  data?: unknown[];
};

type GoalsStatsResponse = {
  success?: boolean;
  data?: { status: string }[];
};

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    activeGoals: 0,
    scheduleToday: 0,
  });

  const fetchStats = useCallback(async () => {
    try {
      const [tasksRes, scheduleRes, goalsRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch(`/api/schedules?date=${new Date().toISOString().slice(0, 10)}`),
        fetch("/api/goals"),
      ]);
      const tasksData = (await tasksRes.json()) as TasksStatsResponse;
      const scheduleData = (await scheduleRes.json()) as ScheduleStatsResponse;
      const goalsData = (await goalsRes.json()) as GoalsStatsResponse;

      if (tasksData.success) {
        setStats((prev) => ({ ...prev, totalTasks: tasksData.data?.length ?? 0 }));
      }
      if (scheduleData.success) {
        setStats((prev) => ({ ...prev, scheduleToday: scheduleData.data?.length ?? 0 }));
      }
      if (goalsData.success) {
        setStats((prev) => ({
          ...prev,
          activeGoals: goalsData.data?.filter((g) => g.status === "active").length ?? 0,
        }));
      }
    } catch {
      console.error("Failed to fetch stats");
    }
  }, []);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) { router.push("/login"); return; }
      const data = (await res.json()) as { user: DashboardUser };
      setUser(data.user);
      await fetchStats();
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [fetchStats, router]);

  useEffect(() => { fetchUser(); }, [fetchUser, pathname]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return <LoadingState label="Loading workspace..." />;
  }

  const statCards = [
    { label: "Total tasks", value: stats.totalTasks, tone: "blue" },
    { label: "Active goals", value: stats.activeGoals, tone: "violet" },
    { label: "Completed", value: stats.completedTasks, tone: "emerald" },
    { label: "Scheduled today", value: stats.scheduleToday, tone: "amber" },
  ];

  const navCards = [
    { href: "/tasks", icon: ListChecks, title: "Tasks", desc: "Manage your daily work", meta: `${stats.totalTasks} active`, tone: "blue" },
    { href: "/goals", icon: Flag, title: "Goals", desc: "Track milestones", meta: `${stats.activeGoals} in progress`, tone: "violet" },
    { href: "/schedule", icon: Sparkles, title: "Schedule", desc: "AI-powered planning", meta: "Generate today", tone: "emerald" },
    { href: "/timetable", icon: CalendarDays, title: "Timetable", desc: "View daily layout", meta: `${stats.scheduleToday} today`, tone: "amber" },
  ];

  return (
    <>
      <PageHeader
        label="Workspace"
        title={`${getGreeting()}, ${user?.name?.split(" ")[0] ?? "there"}`}
        description={today}
        actions={
          <div className="flex h-11 w-11 items-center justify-center rounded-md border border-blue-300/30 bg-blue-500/20 text-sm font-semibold text-white shadow-lg shadow-blue-950/20">
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <Panel key={stat.label} className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{stat.label}</p>
            <p className="mt-4 text-3xl font-semibold text-white">{stat.value}</p>
            <Badge tone={stat.tone as "blue"} className="mt-3">{stat.label === "Scheduled today" ? "Today" : "Live"}</Badge>
          </Panel>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {navCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href} className="group rounded-lg border border-white/10 bg-slate-950/55 p-5 shadow-2xl shadow-blue-950/20 backdrop-blur-xl transition hover:border-blue-200/40 hover:bg-slate-950/70">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-blue-300/30 bg-blue-500/20 text-blue-50">
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-500 transition group-hover:text-blue-100" />
              </div>
              <h2 className="mt-5 text-lg font-semibold text-white">{card.title}</h2>
              <p className="mt-1 text-sm text-slate-400">{card.desc}</p>
              <Badge tone={card.tone as "blue"} className="mt-4">{card.meta}</Badge>
            </Link>
          );
        })}
      </section>

      <Panel>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-cyan-300/30 bg-cyan-300/10 text-cyan-100">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Pro tip</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">
                Use Smart Schedule to auto-plan your day. Tasks are prioritised by deadline and estimated effort.
              </p>
            </div>
          </div>
          <Link href="/schedule" className="inline-flex whitespace-nowrap rounded-md border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-blue-200/50 hover:bg-blue-400/10">
            Try now
          </Link>
        </div>
      </Panel>
    </>
  );
}