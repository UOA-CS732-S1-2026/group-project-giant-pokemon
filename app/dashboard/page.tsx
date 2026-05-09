"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    activeGoals: 0,
    scheduleToday: 0,
  });

  const fetchStats = async () => {
    try {
      const [tasksRes, scheduleRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch(`/api/schedules?date=${new Date().toISOString().slice(0, 10)}`),
      ]);
      const tasksData = await tasksRes.json();
      const scheduleData = await scheduleRes.json();
      if (tasksData.success) {
        setStats((prev) => ({ ...prev, totalTasks: tasksData.data.length }));
      }
      if (scheduleData.success) {
        setStats((prev) => ({ ...prev, scheduleToday: scheduleData.data.length }));
      }
    } catch {
      console.error("Failed to fetch stats");
    }
  };

  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) { router.push("/login"); return; }
      const data = await res.json();
      setUser(data.user);
      await fetchStats();
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUser(); }, [pathname]);

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
    return (
      <div style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 28, height: 28, border: "2px solid #e5e7eb", borderTopColor: "#6b7280", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <p style={{ fontSize: 13, color: "#9ca3af" }}>Loading workspace...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const statCards = [
    { label: "Total tasks",      value: stats.totalTasks,    color: "#2563eb", bg: "#eff6ff" },
    { label: "Active goals",     value: stats.activeGoals,   color: "#7c3aed", bg: "#f5f3ff" },
    { label: "Completed",        value: stats.completedTasks,color: "#059669", bg: "#ecfdf5" },
    { label: "Scheduled today",  value: stats.scheduleToday, color: "#d97706", bg: "#fffbeb" },
  ];

  const navCards = [
    { href: "/tasks",     iconBg: "#2563eb", iconText: "T",  title: "Tasks",     desc: "Manage your daily work",  meta: `${stats.totalTasks} active` },
    { href: "/goals",     iconBg: "#7c3aed", iconText: "G",  title: "Goals",     desc: "Track milestones",        meta: `${stats.activeGoals} in progress` },
    { href: "/schedule",  iconBg: "#059669", iconText: "S",  title: "Schedule",  desc: "AI-powered planning",     meta: "Generate today" },
    { href: "/timetable", iconBg: "#d97706", iconText: "Ti", title: "Timetable", desc: "View daily layout",       meta: `${stats.scheduleToday} today` },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      <Navbar />

      <main style={{ maxWidth: 680, margin: "0 auto", padding: "32px 16px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#111827", letterSpacing: "-0.01em" }}>
            {getGreeting()}, {user?.name?.split(" ")[0]}
          </h1>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 600, flexShrink: 0 }}>
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
        </div>
        <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 32 }}>{today}</p>

        {/* Stats grid — 2 col on mobile, 4 col on wider screens via CSS */}
        <style>{`
          .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 32px; }
          .nav-grid   { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 32px; }
          @media (min-width: 560px) {
            .stats-grid { grid-template-columns: repeat(4, 1fr); }
          }
          .nav-card:hover { border-color: #d1d5db !important; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
        `}</style>

        <div className="stats-grid">
          {statCards.map((s) => (
            <div key={s.label} style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 16, padding: "14px 16px" }}>
              <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>{s.label}</p>
              <p style={{ fontSize: 28, fontWeight: 600, color: s.color, lineHeight: 1 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Section label */}
        <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>
          Workspace
        </p>

        {/* Nav cards */}
        <div className="nav-grid">
          {navCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="nav-card"
              style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 16, padding: "16px", textDecoration: "none", display: "block", transition: "border-color 0.15s, box-shadow 0.15s" }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: card.iconBg, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
                {card.iconText}
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 2 }}>{card.title}</p>
              <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 14 }}>{card.desc}</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>{card.meta}</span>
                <span style={{ fontSize: 14, color: "#d1d5db" }}>→</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Pro tip */}
        <div style={{ background: "#111827", borderRadius: 16, padding: "18px 20px", display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="16" height="16" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#f9fafb", marginBottom: 4 }}>Pro tip</p>
            <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>
              Use Smart Schedule to auto-plan your day. Tasks are prioritised by deadline and estimated effort.
            </p>
          </div>
          <Link href="/schedule" style={{ fontSize: 12, color: "#60a5fa", textDecoration: "none", whiteSpace: "nowrap", marginTop: 2, flexShrink: 0 }}>
            Try now →
          </Link>
        </div>

      </main>
    </div>
  );
}