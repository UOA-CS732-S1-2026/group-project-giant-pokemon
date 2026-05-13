"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, Plus, Sparkles } from "lucide-react";
import { Alert, Badge, Button, PageHeader, Panel } from "@/components/ui/foundation";

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
    { bg: "rgba(37, 99, 235, 0.18)", border: "#60a5fa", text: "#dbeafe" },
    { bg: "rgba(16, 185, 129, 0.16)", border: "#34d399", text: "#d1fae5" },
    { bg: "rgba(245, 158, 11, 0.16)", border: "#fbbf24", text: "#fef3c7" },
    { bg: "rgba(236, 72, 153, 0.16)", border: "#f472b6", text: "#fce7f3" },
    { bg: "rgba(139, 92, 246, 0.18)", border: "#a78bfa", text: "#ede9fe" },
    { bg: "rgba(249, 115, 22, 0.16)", border: "#fb923c", text: "#ffedd5" },
    { bg: "rgba(14, 165, 233, 0.16)", border: "#38bdf8", text: "#e0f2fe" },
    { bg: "rgba(20, 184, 166, 0.16)", border: "#2dd4bf", text: "#ccfbf1" },
    { bg: "rgba(99, 102, 241, 0.18)", border: "#818cf8", text: "#e0e7ff" },
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
    <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-white/10 bg-slate-950/50">
      <Loader2 className="h-7 w-7 animate-spin text-cyan-200" />
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

  if (loading) {
    return <TimetableLoading />;
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .smart-timetable {
          display: flex;
          flex-direction: column;
          background: rgba(2, 6, 23, 0.55);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 24px 60px rgba(30, 64, 175, 0.20);
          backdrop-filter: blur(20px);
        }
        .smart-row {
          display: flex;
          border-bottom: 1px solid rgba(255,255,255,0.10);
          transition: background 0.15s ease;
        }
        .smart-time-cell {
          width: 95px;
          flex-shrink: 0;
          padding: 14px 12px;
          background: rgba(15, 23, 42, 0.72);
          border-right: 1px solid rgba(255,255,255,0.10);
          font-family: 'SF Mono', 'Menlo', monospace;
          font-size: 13px;
          font-weight: 500;
          color: #bfdbfe;
        }
        .smart-content-cell {
          flex: 1;
          padding: 8px 12px;
        }
        .free-block {
          background: rgba(255,255,255,0.04);
          border-radius: 8px;
          padding: 12px 16px;
          border: 1px dashed rgba(125, 211, 252, 0.30);
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.2s;
          height: 100%;
        }
        .free-block:hover {
          background: rgba(14, 165, 233, 0.08);
          border-color: rgba(186, 230, 253, 0.50);
        }
        .task-card {
          background: rgba(255,255,255,0.05);
          border-radius: 8px;
          padding: 10px 14px;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.12);
          height: 100%;
        }
        .task-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 22px rgba(30,64,175,0.22);
        }
        .add-btn:hover {
          background: rgba(59,130,246,0.16) !important;
        }
        @media (max-width: 560px) {
          .smart-time-cell { width: 75px; padding: 12px 8px; font-size: 11px; }
          .task-card { padding: 8px 10px; }
          .free-block { padding: 10px 12px; }
        }
      `}</style>

      <PageHeader
        label="Timetable"
        title="Timetable"
        description={`Smart view · ${userStartTime} - ${userEndTime}`}
        actions={
          <Link href="/schedule" className="inline-flex items-center gap-2 rounded-md border border-blue-300/30 bg-blue-500/20 px-4 py-2.5 text-sm font-semibold text-blue-50 shadow-lg shadow-blue-950/20 transition hover:border-blue-200/60 hover:bg-blue-500/30">
            <Plus className="h-4 w-4" />
            Generate
          </Link>
        }
      />

      <Panel className="flex items-center justify-between gap-4">
          <Button onClick={() => shiftDate(-1)} variant="secondary" className="h-10 w-10 px-0">
          <ChevronLeft className="h-4 w-4" />
        </Button>
          <div className="text-center">
          <div className="text-lg font-semibold text-white">{formatDateLabel(date)}</div>
          <div className="mt-1 font-mono text-xs text-slate-400">{date}</div>
            {date !== new Date().toISOString().slice(0, 10) && (
            <button onClick={() => handleDateChange(new Date().toISOString().slice(0, 10))} className="mt-1 text-xs font-semibold text-blue-200 hover:text-white">Back to today</button>
            )}
          </div>
        <Button onClick={() => shiftDate(1)} variant="secondary" className="h-10 w-10 px-0">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </Panel>

        {/* Progress bar */}
        {totalCount > 0 && (
        <Panel>
          <div className="mb-2 flex justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Daily progress</span>
            <span className="text-xs font-semibold text-blue-100">{completedCount}/{totalCount} tasks</span>
            </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-900/80">
            <div className="h-full rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/30 transition-all" style={{ width: `${progress}%` }} />
            </div>
        </Panel>
        )}

      {error && <Alert>{error}</Alert>}

        {fetching && (
        <TimetableLoading />
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
                            style={{ fontSize: 10, padding: "4px 6px", borderRadius: 6, border: `1px solid ${colorTheme.border}40`, background: "rgba(15,23,42,0.92)", color: "#e2e8f0", cursor: "pointer" }}
                          >
                            <option value="scheduled">📋 Active</option>
                            <option value="completed">✅ Done</option>
                            <option value="missed">⏰ Missed</option>
                          </select>
                          <button onClick={() => handleDelete(block._id)} style={{ fontSize: 10, padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(253,164,175,0.35)", background: "rgba(244,63,94,0.10)", color: "#fecdd3", cursor: "pointer" }}>
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
                          <CalendarDays className="h-5 w-5 text-cyan-100" />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0" }}>Free time</div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>{hoursCount} hours · no tasks</div>
                          </div>
                        </div>
                        <span style={{ fontSize: 11, color: "#64748b" }}>available</span>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}

        {/* Free Time Suggestions - AI Suggestions */}
      <Panel>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
            <h2 className="text-lg font-semibold text-white">Free Time Suggestions</h2>
            <p className="mt-1 text-sm text-slate-400">AI recommends what to do in your free slots</p>
            </div>
          <Button
              onClick={handleGetFreeTimeSuggestions}
              disabled={loadingFreeTime}
            >
            {loadingFreeTime ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loadingFreeTime ? "Analyzing..." : "Get AI Suggestions"}
          </Button>
          </div>

          {freeTimeSuggestions !== null && (
          <div className="grid gap-3">
              {freeTimeSuggestions.length === 0 ? (
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-6 text-center">
                <p className="text-sm text-slate-400">No free slots today, fully packed.</p>
                </div>
              ) : (
                freeTimeSuggestions.map((s, i) => {
                  const isAdding = addingSlot === s.slot;
                  return (
                  <div key={`${s.slot}-${i}`} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-blue-100">{s.slot}</span>
                      <span className="text-xs text-slate-400">{s.duration}</span>
                      <Badge className="ml-auto capitalize">{s.category}</Badge>
                      </div>
                    <p className="mb-3 text-sm leading-6 text-slate-300">{s.suggestion}</p>
                      <button
                        className="add-btn"
                        onClick={() => handleAddSuggestionToTimetable(s)}
                        disabled={isAdding}
                      style={{ fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: isAdding ? "#94a3b8" : "#e2e8f0", cursor: isAdding ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 5, transition: "background 0.15s" }}
                      >
                        {isAdding && (
                          <div style={{ width: 10, height: 10, border: "1.5px solid #d1d5db", borderTopColor: "#6b7280", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                        )}
                      {isAdding ? "Adding..." : "Add to Timetable"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
      </Panel>
    </>
  );
}
