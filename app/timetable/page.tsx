"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

type ScheduleBlock = {
  _id: string;
  userId: string;
  taskId?: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "scheduled" | "completed" | "missed";
  createdAt: string;
  updatedAt: string;
};

type TimetableUser = {
  name?: string;
  startTime?: string;
  endTime?: string;
};

type ScheduleBlocksResponse = {
  success?: boolean;
  data?: ScheduleBlock[];
  error?: string;
};

type FreeTimeSuggestion = {
  slot: string;
  duration: string;
  suggestion: string;
  category: string;
};

// Convert "09:00 AM" to "09:00"
function convertTo24Hour(time12h: string): string {
  if (!time12h) return "09:00";
  const match = time12h.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return "09:00";
  let hour = parseInt(match[1]);
  const minute = match[2];
  const period = match[3].toUpperCase();
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return `${hour.toString().padStart(2, "0")}:${minute}`;
}

// Convert "14:30" to minutes
const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

// Convert minutes to "14:30"
const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

// Generate 30-min time slots based on user preferences
const generateTimeSlots = (start: string, end: string): string[] => {
  const slots: string[] = [];
  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);
  for (let t = startMin; t <= endMin; t += 30) {
    slots.push(minutesToTime(t));
  }
  return slots;
};

// Get task card color based on title hash
const getTaskColor = (title: string): { bg: string; border: string; text: string } => {
  const colors = [
    { bg: "#eff6ff", border: "#3b82f6", text: "#1e40af" },
    { bg: "#f0fdf4", border: "#22c55e", text: "#166534" },
    { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" },
    { bg: "#fce7f3", border: "#ec4899", text: "#9d174d" },
    { bg: "#ede9fe", border: "#8b5cf6", text: "#4c1d95" },
    { bg: "#ffedd5", border: "#f97316", text: "#9a3412" },
    { bg: "#e0f2fe", border: "#0ea5e9", text: "#0c4a6e" },
    { bg: "#dcfce7", border: "#10b981", text: "#064e3b" },
    { bg: "#fef9c3", border: "#eab308", text: "#713f12" },
  ];
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = ((hash << 5) - hash) + title.charCodeAt(i);
    hash |= 0;
  }
  return colors[Math.abs(hash) % colors.length];
};

// Format duration
const formatDuration = (start: string, end: string): string => {
  const diff = timeToMinutes(end) - timeToMinutes(start);
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
};

type MergedSlot = 
  | { type: 'task'; block: ScheduleBlock; startTime: string; endTime: string; }
  | { type: 'free'; startTime: string; endTime: string; durationMinutes: number; };

// Merge timeline and tasks into smart rows
const mergeIntoSmarterRows = (blocks: ScheduleBlock[], timeSlots: string[]): MergedSlot[] => {
  if (blocks.length === 0 && timeSlots.length > 0) {
    const start = timeSlots[0];
    const end = timeSlots[timeSlots.length - 1];
    const endNext = minutesToTime(timeToMinutes(end) + 30);
    return [{ type: 'free', startTime: start, endTime: endNext, durationMinutes: timeToMinutes(endNext) - timeToMinutes(start) }];
  }

  const sortedBlocks = [...blocks].sort((a, b) => a.startTime.localeCompare(b.startTime));
  
  const occupied = new Map<string, ScheduleBlock>();
  for (const block of sortedBlocks) {
    const startMin = timeToMinutes(block.startTime);
    const endMin = timeToMinutes(block.endTime);
    for (let t = startMin; t < endMin; t += 30) {
      const timeKey = minutesToTime(t);
      occupied.set(timeKey, block);
    }
  }

  const result: MergedSlot[] = [];
  let i = 0;
  
  while (i < timeSlots.length) {
    const currentSlot = timeSlots[i];
    const currentBlock = occupied.get(currentSlot);
    
    if (currentBlock) {
      const taskStart = currentBlock.startTime;
      const taskEnd = currentBlock.endTime;
      result.push({ type: 'task', block: currentBlock, startTime: taskStart, endTime: taskEnd });
      let j = i;
      while (j < timeSlots.length && timeSlots[j] < taskEnd) {
        j++;
      }
      i = j;
    } else {
      const freeStart = currentSlot;
      let j = i;
      while (j < timeSlots.length && !occupied.get(timeSlots[j])) {
        j++;
      }
      const freeEnd = j < timeSlots.length ? timeSlots[j] : minutesToTime(timeToMinutes(timeSlots[timeSlots.length - 1]) + 30);
      const durationMinutes = timeToMinutes(freeEnd) - timeToMinutes(freeStart);
      result.push({ type: 'free', startTime: freeStart, endTime: freeEnd, durationMinutes });
      i = j;
    }
  }
  
  return result;
};

const getFreeRowHeight = (durationMinutes: number): number => {
  const hours = durationMinutes / 60;
  const multiplier = Math.min(1.8, 1 + (hours - 0.5) * 0.18);
  return Math.max(1.0, multiplier);
};

export default function TimetablePage() {
  return (
    <Suspense fallback={<TimetableLoading />}>
      <TimetableContent />
    </Suspense>
  );
}

function TimetableLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 28, height: 28, border: "2px solid #e5e7eb", borderTopColor: "#6b7280", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function TimetableContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<TimetableUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [date, setDate] = useState(() => {
    return searchParams.get("date") || new Date().toISOString().slice(0, 10);
  });
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [freeTimeSuggestions, setFreeTimeSuggestions] = useState<FreeTimeSuggestion[] | null>(null);
  const [loadingFreeTime, setLoadingFreeTime] = useState(false);
  const [addingSlot, setAddingSlot] = useState<string | null>(null);
  
  // User preference time range
  const [userStartTime, setUserStartTime] = useState("08:00");
  const [userEndTime, setUserEndTime] = useState("22:00");
  const [timeSlots, setTimeSlots] = useState<string[]>([]);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) { router.push("/login"); return; }
      const data = (await res.json()) as { user: TimetableUser };
      setUser(data.user);
      
      // Load user's preferred time range
      const start24 = convertTo24Hour(data.user.startTime ?? "09:00 AM");
      const end24 = convertTo24Hour(data.user.endTime ?? "05:00 PM");
      setUserStartTime(start24);
      setUserEndTime(end24);
      setTimeSlots(generateTimeSlots(start24, end24));
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchBlocks = useCallback(async (targetDate: string) => {
    setFetching(true);
    setError("");
    try {
      const res = await fetch(`/api/schedules?date=${targetDate}`);
      const json = (await res.json()) as ScheduleBlocksResponse;
      if (!json.success) throw new Error(json.error || "Failed to fetch schedules.");
      setBlocks(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBlocks([]);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);
  useEffect(() => { if (user) fetchBlocks(date); }, [user, date, fetchBlocks]);

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    router.push(`/timetable?date=${newDate}`);
  };

  const handleStatusChange = async (id: string, newStatus: ScheduleBlock["status"]) => {
    setBlocks(prev => prev.map(b => b._id === id ? { ...b, status: newStatus } : b));
    try {
      const res = await fetch(`/api/schedules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      fetchBlocks(date);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this block?")) return;
    setBlocks(prev => prev.filter(b => b._id !== id));
    try {
      const res = await fetch(`/api/schedules/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      fetchBlocks(date);
    }
  };

  const handleGetFreeTimeSuggestions = async () => {
    setLoadingFreeTime(true);
    setError("");
    try {
      const res = await fetch(`/api/free-time-suggestions?date=${date}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setFreeTimeSuggestions(json.data.suggestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingFreeTime(false);
    }
  };

  const handleAddSuggestionToTimetable = async (suggestion: FreeTimeSuggestion) => {
    const parts = suggestion.slot.split("-");
    if (parts.length !== 2) return;
    const startTime = parts[0].trim();
    const endTime = parts[1].trim();
    const title = suggestion.suggestion.slice(0, 100);

    setAddingSlot(suggestion.slot);
    setError("");
    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, date, startTime, endTime, status: "scheduled" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      await fetchBlocks(date);
      setFreeTimeSuggestions(prev =>
        prev ? prev.filter(s => s.slot !== suggestion.slot) : prev
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAddingSlot(null);
    }
  };

  const shiftDate = (delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    handleDateChange(d.toISOString().slice(0, 10));
  };

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  };

  const smartRows = mergeIntoSmarterRows(blocks, timeSlots);
  const completedCount = blocks.filter(b => b.status === "completed").length;
  const totalCount = blocks.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const categoryColors: Record<string, { bg: string; color: string }> = {
    rest:        { bg: "#f0fdf4", color: "#15803d" },
    exercise:    { bg: "#eff6ff", color: "#1d4ed8" },
    learning:    { bg: "#fdf4ff", color: "#7e22ce" },
    social:      { bg: "#fff7ed", color: "#c2410c" },
    creative:    { bg: "#fef9c3", color: "#854d0e" },
    mindfulness: { bg: "#f0fdfa", color: "#0f766e" },
  };

  if (loading) {
    return <TimetableLoading />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", display: "flex" }}>
      <Sidebar />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .smart-timetable {
          display: flex;
          flex-direction: column;
          background: #fff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .smart-row {
          display: flex;
          border-bottom: 1px solid #f0f0f0;
          transition: background 0.15s ease;
        }
        .smart-time-cell {
          width: 95px;
          flex-shrink: 0;
          padding: 14px 12px;
          background: #fff;
          border-right: 1px solid #f0f0f0;
          font-family: 'SF Mono', 'Menlo', monospace;
          font-size: 13px;
          font-weight: 500;
          color: #5b6e8c;
        }
        .smart-content-cell {
          flex: 1;
          padding: 8px 12px;
        }
        .free-block {
          background: #f8fafc;
          border-radius: 12px;
          padding: 12px 16px;
          border: 1px dashed #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.2s;
          height: 100%;
        }
        .free-block:hover {
          background: #f1f5f9;
          border-color: #94a3b8;
        }
        .task-card {
          background: #f8fafc;
          border-radius: 12px;
          padding: 10px 14px;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.03);
          height: 100%;
        }
        .task-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .add-btn:hover {
          background: #f3f4f6 !important;
        }
        @media (max-width: 560px) {
          .smart-time-cell { width: 75px; padding: 12px 8px; font-size: 11px; }
          .task-card { padding: 8px 10px; }
          .free-block { padding: 10px 12px; }
        }
      `}</style>

      <main style={{ flex: 1, maxWidth: 800, margin: "0 auto", padding: "32px 20px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", letterSpacing: "-0.3px", marginBottom: 4 }}>
              Timetable
            </h1>
            <p style={{ fontSize: 13, color: "#94a3b8" }}>
              Smart view · {userStartTime} – {userEndTime}
            </p>
          </div>
          <Link
            href="/schedule"
            style={{ fontSize: 13, fontWeight: 500, color: "#fff", background: "#1e293b", borderRadius: 14, padding: "8px 18px", textDecoration: "none" }}
          >
            + Generate
          </Link>
        </div>

        {/* Date navigator */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "12px 20px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => shiftDate(-1)} style={{ width: 38, height: 38, borderRadius: 12, border: "1px solid #eef2f6", background: "#fff", cursor: "pointer", fontSize: 18, color: "#64748b" }}>‹</button>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#0f172a" }}>{formatDateLabel(date)}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2, fontFamily: "monospace" }}>{date}</div>
            {date !== new Date().toISOString().slice(0, 10) && (
              <button onClick={() => handleDateChange(new Date().toISOString().slice(0, 10))} style={{ fontSize: 11, color: "#3b82f6", background: "none", border: "none", cursor: "pointer", marginTop: 4 }}>Back to today</button>
            )}
          </div>
          <button onClick={() => shiftDate(1)} style={{ width: 38, height: 38, borderRadius: 12, border: "1px solid #eef2f6", background: "#fff", cursor: "pointer", fontSize: 18, color: "#64748b" }}>›</button>
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div style={{ background: "#fff", borderRadius: 16, padding: "12px 20px", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#64748b" }}>Daily progress</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{completedCount}/{totalCount} tasks</span>
            </div>
            <div style={{ height: 5, background: "#eef2f6", borderRadius: 10 }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "#10b981", borderRadius: 10, transition: "width 0.3s" }} />
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 14, padding: "12px 18px", marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: "#b91c1c" }}>{error}</p>
          </div>
        )}

        {fetching && (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <div style={{ width: 24, height: 24, border: "2px solid #e2e8f0", borderTopColor: "#64748b", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
        )}

        {/* Smart Timetable */}
        {!fetching && timeSlots.length > 0 && (
          <div className="smart-timetable">
            {smartRows.map((row) => {
              if (row.type === 'task') {
                const block = row.block;
                const colorTheme = getTaskColor(block.title);
                const statusColor = block.status === "completed" ? "#22c55e" : block.status === "missed" ? "#ef4444" : "#94a3b8";
                return (
                  <div key={`task-${block._id}`} className="smart-row">
                    <div className="smart-time-cell">
                      {row.startTime} – {row.endTime}
                    </div>
                    <div className="smart-content-cell">
                      <div className="task-card" style={{ borderLeft: `3px solid ${colorTheme.border}`, background: colorTheme.bg }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: colorTheme.text, textDecoration: block.status === "completed" ? "line-through" : "none" }}>
                            {block.title}
                          </span>
                          <div style={{ display: "flex", gap: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 500, background: `${colorTheme.border}20`, color: colorTheme.border, padding: "2px 8px", borderRadius: 20 }}>
                              {formatDuration(block.startTime, block.endTime)}
                            </span>
                            <span style={{ fontSize: 10, fontWeight: 500, background: `${statusColor}20`, color: statusColor, padding: "2px 8px", borderRadius: 20, textTransform: "capitalize" }}>
                              {block.status === "scheduled" ? "active" : block.status}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                          <select
                            value={block.status}
                            onChange={(e) => handleStatusChange(block._id, e.target.value as ScheduleBlock["status"])}
                            style={{ fontSize: 10, padding: "4px 6px", borderRadius: 8, border: `1px solid ${colorTheme.border}40`, background: "#fff", cursor: "pointer" }}
                          >
                            <option value="scheduled">📋 Active</option>
                            <option value="completed">✅ Done</option>
                            <option value="missed">⏰ Missed</option>
                          </select>
                          <button onClick={() => handleDelete(block._id)} style={{ fontSize: 10, padding: "4px 8px", borderRadius: 8, border: "1px solid #fee2e2", background: "#fff", color: "#ef4444", cursor: "pointer" }}>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } else {
                const heightMultiplier = getFreeRowHeight(row.durationMinutes);
                const hoursCount = (row.durationMinutes / 60).toFixed(1);
                return (
                  <div key={`free-${row.startTime}-${row.endTime}`} className="smart-row" style={{ alignItems: "stretch" }}>
                    <div className="smart-time-cell" style={{ alignSelf: "stretch" }}>
                      {row.startTime} – {row.endTime}
                    </div>
                    <div className="smart-content-cell" style={{ padding: "8px 12px" }}>
                      <div className="free-block" style={{ minHeight: `${Math.max(65, 65 * heightMultiplier)}px` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ fontSize: 20 }}>🕊️</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "#475569" }}>Free time</div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>{hoursCount} hours · no tasks</div>
                          </div>
                        </div>
                        <span style={{ fontSize: 11, color: "#cbd5e1" }}>— available —</span>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}

        {/* Free Time Suggestions - AI Suggestions */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", marginBottom: 2 }}>Free Time Suggestions</p>
              <p style={{ fontSize: 12, color: "#94a3b8" }}>AI recommends what to do in your free slots</p>
            </div>
            <button
              onClick={handleGetFreeTimeSuggestions}
              disabled={loadingFreeTime}
              style={{ fontSize: 12, fontWeight: 500, padding: "8px 16px", borderRadius: 12, border: "none", background: loadingFreeTime ? "#e5e7eb" : "#2563eb", color: loadingFreeTime ? "#9ca3af" : "#fff", cursor: loadingFreeTime ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}
            >
              {loadingFreeTime && (
                <div style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              )}
              {loadingFreeTime ? "Analyzing..." : "Get AI Suggestions"}
            </button>
          </div>

          {freeTimeSuggestions !== null && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {freeTimeSuggestions.length === 0 ? (
                <div style={{ background: "#fff", borderRadius: 14, padding: "24px", textAlign: "center" }}>
                  <p style={{ fontSize: 13, color: "#9ca3af" }}>No free slots today — fully packed!</p>
                </div>
              ) : (
                freeTimeSuggestions.map((s, i) => {
                  const cc = categoryColors[s.category] ?? { bg: "#f8fafc", color: "#475569" };
                  const isAdding = addingSlot === s.slot;
                  return (
                    <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", border: "1px solid #f3f4f6" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{s.slot}</span>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>{s.duration}</span>
                        <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 999, background: cc.bg, color: cc.color, marginLeft: "auto", textTransform: "capitalize" }}>
                          {s.category}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: "#374151", margin: "0 0 10px", lineHeight: 1.5 }}>{s.suggestion}</p>
                      <button
                        className="add-btn"
                        onClick={() => handleAddSuggestionToTimetable(s)}
                        disabled={isAdding}
                        style={{ fontSize: 11, fontWeight: 500, padding: "5px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: isAdding ? "#9ca3af" : "#374151", cursor: isAdding ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 5, transition: "background 0.15s" }}
                      >
                        {isAdding && (
                          <div style={{ width: 10, height: 10, border: "1.5px solid #d1d5db", borderTopColor: "#6b7280", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                        )}
                        {isAdding ? "Adding..." : "+ Add to Timetable"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}