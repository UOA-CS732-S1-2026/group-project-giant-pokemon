"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import type {
    ScheduleGenerationMode,
    ScheduleGenerationMeta,
    EngineOccupiedBlock,
    ScheduleWindowConfig,
} from "@/lib/scheduleEngine/types";
import type { ScheduleBlockStatus } from "@/types/schedule";

type ScheduleBlockAPI = {
    _id: string;
    userId: string;
    taskId?: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    status: ScheduleBlockStatus;
    createdAt: string;
    updatedAt: string;
};

type DBTask = {
    id: string;
    title: string;
    priority: "low" | "medium" | "high";
    status: "todo" | "in_progress" | "completed";
    estimatedMinutes: number;
    deadline?: string;
    scheduledDate?: string;
    scheduledStartTime?: string;
};

function getTodayInputDate(): string {
    return new Date().toISOString().slice(0, 10);
}

function isTimeString(value: unknown): value is string {
    return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function timeToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

function hasValidTimeRange(start: string, end: string): boolean {
    return timeToMinutes(start) < timeToMinutes(end);
}

function calcEndTime(start: string, minutes: number): string {
    const total = timeToMinutes(start) + minutes;
    return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

async function apiGetTasks(): Promise<DBTask[]> {
    const res = await fetch("/api/tasks");
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? "Failed to fetch tasks.");
    return json.data.map((t: {
        _id: string;
        title: string;
        priority: string;
        status: string;
        estimatedMinutes: number;
        deadline?: string;
        scheduledDate?: string;
        scheduledStartTime?: string;
    }) => ({
        id: t._id,
        title: t.title,
        priority: t.priority,
        status: t.status,
        estimatedMinutes: t.estimatedMinutes || 60,
        deadline: t.deadline,
        scheduledDate: t.scheduledDate,
        scheduledStartTime: t.scheduledStartTime,
    }));
}

async function apiGetBlocks(date: string): Promise<ScheduleBlockAPI[]> {
    const res = await fetch(`/api/schedules?date=${date}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? "Failed to fetch blocks.");
    return json.data as ScheduleBlockAPI[];
}

async function apiCreateBlock(body: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    status: ScheduleBlockStatus;
    taskId?: string;
}): Promise<ScheduleBlockAPI> {
    const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? "Failed to create block.");
    return json.data as ScheduleBlockAPI;
}

async function apiPatchBlock(
    id: string,
    update: Partial<Pick<ScheduleBlockAPI, "title" | "date" | "startTime" | "endTime" | "status" | "taskId">>
): Promise<ScheduleBlockAPI> {
    const res = await fetch(`/api/schedules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? "Failed to update block.");
    return json.data as ScheduleBlockAPI;
}

async function apiDeleteBlock(id: string): Promise<void> {
    const res = await fetch(`/api/schedules/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? "Failed to delete block.");
}

async function apiEnginePreview(body: {
    date: string;
    mode: ScheduleGenerationMode;
    tasks: DBTask[];
    occupiedBlocks: EngineOccupiedBlock[];
    instruction?: string;
    window?: Partial<ScheduleWindowConfig>;
}): Promise<{ data: ScheduleBlockAPI[]; meta: ScheduleGenerationMeta }> {
    const res = await fetch("/api/engine-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? "Engine preview failed.");
    return { data: json.data as ScheduleBlockAPI[], meta: json.meta as ScheduleGenerationMeta };
}

export default function SchedulePage() {
    const [blocks, setBlocks] = useState<ScheduleBlockAPI[]>([]);
    const [tasks, setTasks] = useState<DBTask[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [date, setDate] = useState(getTodayInputDate());
    const [title, setTitle] = useState("");
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("10:00");
    const [status, setStatus] = useState<ScheduleBlockStatus>("scheduled");
    const [mode, setMode] = useState<ScheduleGenerationMode>("rule");
    const [instruction, setInstruction] = useState("");
    const [loadingBlocks, setLoadingBlocks] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [actionId, setActionId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [engineMeta, setEngineMeta] = useState<ScheduleGenerationMeta | null>(null);

    const fetchTasks = useCallback(async () => {
        setLoadingTasks(true);
        try {
            const data = await apiGetTasks();
            setTasks(data.filter((t) => t.status !== "completed"));
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoadingTasks(false);
        }
    }, []);

    useEffect(() => { fetchTasks(); }, [fetchTasks]);

    const fetchBlocks = useCallback(async (targetDate: string) => {
        setLoadingBlocks(true);
        setError("");
        try {
            const data = await apiGetBlocks(targetDate);
            setBlocks(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoadingBlocks(false);
        }
    }, []);

    useEffect(() => { fetchBlocks(date); }, [date, fetchBlocks]);

    async function handleGenerate() {
        setGenerating(true);
        setError("");
        try {
            const occupiedBlocks: EngineOccupiedBlock[] = blocks
                .filter((b) => b.status === "scheduled" || b.status === "completed")
                .map((b) => ({ taskId: b.taskId, title: b.title, startTime: b.startTime, endTime: b.endTime, status: b.status }));

            const scheduledTaskIds = new Set(blocks.map((b) => b.taskId).filter(Boolean) as string[]);
            const tasksToSchedule = tasks.filter((t) => !scheduledTaskIds.has(t.id));

            if (tasksToSchedule.length === 0) {
                setError("All tasks are already scheduled for this date.");
                return;
            }

            // 有固定时间的 task 直接创建，不走引擎
            console.log("date:", date);
            console.log("tasksToSchedule:", tasksToSchedule.map(t => ({
                title: t.title,
                scheduledDate: t.scheduledDate,
                scheduledStartTime: t.scheduledStartTime,
            })));

            const pinnedTasks = tasksToSchedule.filter(
                (t) => t.scheduledDate === date && t.scheduledStartTime
            );
            const freeTasks = tasksToSchedule.filter(
                (t) => !(t.scheduledDate === date && t.scheduledStartTime)
            );

            console.log("pinnedTasks:", pinnedTasks.map(t => ({ title: t.title, id: t.id })));
            console.log("freeTasks:", freeTasks.map(t => ({ title: t.title, id: t.id })));

            const pinnedCreated = await Promise.all(
                pinnedTasks.map((t) =>
                    apiCreateBlock({
                        title: t.title,
                        date,
                        startTime: t.scheduledStartTime!,
                        endTime: calcEndTime(t.scheduledStartTime!, t.estimatedMinutes),
                        status: "scheduled",
                        taskId: t.id,
                    })
                )
            );

            const pinnedOccupied: EngineOccupiedBlock[] = pinnedCreated.map((b) => ({
                taskId: b.taskId,
                title: b.title,
                startTime: b.startTime,
                endTime: b.endTime,
                status: b.status,
            }));

            let engineCreated: ScheduleBlockAPI[] = [];
            if (freeTasks.length > 0) {
                const { data: previewBlocks, meta } = await apiEnginePreview({
                    date,
                    mode,
                    tasks: freeTasks,
                    occupiedBlocks: [...occupiedBlocks, ...pinnedOccupied],
                    instruction: instruction || undefined,
                });
                setEngineMeta(meta);
                engineCreated = await Promise.all(
                    previewBlocks.map((b) =>
                        apiCreateBlock({ title: b.title, date, startTime: b.startTime, endTime: b.endTime, status: b.status, taskId: b.taskId })
                    )
                );
            }

            setBlocks((current) =>
                [...current, ...pinnedCreated, ...engineCreated].sort((a, b) =>
                    a.startTime.localeCompare(b.startTime)
                )
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setGenerating(false);
        }
    }
    async function handleRegenerate() {
        setRegenerating(true);
        setError("");
        try {
            const fixedBlocks = blocks.filter((b) => b.status === "completed");
            const fixedTaskIds = new Set(fixedBlocks.map((b) => b.taskId).filter(Boolean) as string[]);
            const tasksToReplan = tasks.filter((t) => !fixedTaskIds.has(t.id));
            const occupiedBlocks: EngineOccupiedBlock[] = fixedBlocks.map((b) => ({
                taskId: b.taskId, title: b.title, startTime: b.startTime, endTime: b.endTime, status: b.status,
            }));

            const pinnedTasks = tasksToReplan.filter(
                (t) => t.scheduledDate === date && t.scheduledStartTime
            );
            const freeTasks = tasksToReplan.filter(
                (t) => !(t.scheduledDate === date && t.scheduledStartTime)
            );

            await Promise.all(blocks.filter((b) => b.status !== "completed").map((b) => apiDeleteBlock(b._id)));

            const pinnedCreated = await Promise.all(
                pinnedTasks.map((t) =>
                    apiCreateBlock({
                        title: t.title,
                        date,
                        startTime: t.scheduledStartTime!,
                        endTime: calcEndTime(t.scheduledStartTime!, t.estimatedMinutes),
                        status: "scheduled",
                        taskId: t.id,
                    })
                )
            );

            const pinnedOccupied: EngineOccupiedBlock[] = pinnedCreated.map((b) => ({
                taskId: b.taskId, title: b.title, startTime: b.startTime, endTime: b.endTime, status: b.status,
            }));

            let engineCreated: ScheduleBlockAPI[] = [];
            if (freeTasks.length > 0) {
                const { data: previewBlocks, meta } = await apiEnginePreview({
                    date, mode, tasks: freeTasks,
                    occupiedBlocks: [...occupiedBlocks, ...pinnedOccupied],
                    instruction: instruction || undefined,
                });
                setEngineMeta(meta);
                engineCreated = await Promise.all(
                    previewBlocks.map((b) =>
                        apiCreateBlock({ title: b.title, date, startTime: b.startTime, endTime: b.endTime, status: b.status, taskId: b.taskId })
                    )
                );
            }

            setBlocks(
                [...fixedBlocks, ...pinnedCreated, ...engineCreated].sort((a, b) =>
                    a.startTime.localeCompare(b.startTime)
                )
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setRegenerating(false);
        }
    }

    async function handleClearAll() {
        if (!confirm("Delete all schedule blocks for this date?")) return;
        setClearing(true);
        setError("");
        try {
            await Promise.all(blocks.map((b) => apiDeleteBlock(b._id)));
            setBlocks([]);
            setEngineMeta(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setClearing(false);
        }
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!title.trim()) { setError("Title is required."); return; }
        if (!isTimeString(startTime) || !isTimeString(endTime)) { setError("Invalid time format."); return; }
        if (!hasValidTimeRange(startTime, endTime)) { setError("Start time must be before end time."); return; }
        setSubmitting(true);
        setError("");
        try {
            const newBlock = await apiCreateBlock({ title: title.trim(), date, startTime, endTime, status });
            setBlocks((current) => [...current, newBlock].sort((a, b) => a.startTime.localeCompare(b.startTime)));
            setTitle(""); setStartTime("09:00"); setEndTime("10:00"); setStatus("scheduled");
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setSubmitting(false);
        }
    }

    async function handleStatusChange(id: string, nextStatus: ScheduleBlockStatus) {
        setActionId(id);
        try {
            const updated = await apiPatchBlock(id, { status: nextStatus });
            setBlocks((current) => current.map((b) => (b._id === id ? updated : b)));
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setActionId(null);
        }
    }

    async function handleDelete(id: string) {
        setActionId(id);
        try {
            await apiDeleteBlock(id);
            setBlocks((current) => current.filter((b) => b._id !== id));
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setActionId(null);
        }
    }

    const priorityColor = (p: string) => {
        if (p === "high") return { background: "#fef2f2", color: "#b91c1c" };
        if (p === "medium") return { background: "#fffbeb", color: "#92400e" };
        return { background: "#f0fdf4", color: "#15803d" };
    };

    const blockStatusStyle = (s: string) => {
        if (s === "completed") return { bg: "#f0fdf4", color: "#15803d", dot: "#22c55e" };
        if (s === "missed") return { bg: "#fef2f2", color: "#b91c1c", dot: "#ef4444" };
        return { bg: "#f8fafc", color: "#475569", dot: "#94a3b8" };
    };

    return (
        <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
            
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 16px" }}>

                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 600, color: "#111827", letterSpacing: "-0.01em", marginBottom: 2 }}>Schedule</h1>
                        <p style={{ fontSize: 13, color: "#9ca3af" }}>Generate and manage your daily schedule</p>
                    </div>
                    <Link href="/timetable" style={{ fontSize: 13, fontWeight: 500, color: "#fff", background: "#111827", borderRadius: 10, padding: "8px 16px", textDecoration: "none" }}>
                        View Timetable
                    </Link>
                </div>

                {error && (
                    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
                        <p style={{ fontSize: 13, color: "#b91c1c", margin: 0 }}>{error}</p>
                    </div>
                )}

                <div style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 16, padding: "20px", marginBottom: 16 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 16 }}>Engine Controls</p>
                    <div style={{ marginBottom: 16 }}>
                        <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>Engine Mode</p>
                        <div style={{ display: "inline-flex", border: "1px solid #e5e7eb", borderRadius: 10, padding: 3, background: "#f9fafb" }}>
                            {(["rule", "ai"] as const).map((m) => (
                                <button key={m} onClick={() => setMode(m)} style={{ fontSize: 13, fontWeight: 500, padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer", background: mode === m ? "#111827" : "transparent", color: mode === m ? "#fff" : "#6b7280" }}>
                                    {m === "ai" ? "AI" : "Rule"}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>Schedule Date</p>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 12px", color: "#111827", background: "#fff", outline: "none" }} />
                    </div>
                    <div style={{ marginBottom: 20 }}>
                        <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>AI Instruction <span style={{ color: "#d1d5db" }}>(optional)</span></p>
                        <textarea value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="e.g. Move easy low-priority tasks earlier as warm-up work." style={{ width: "100%", fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 12px", color: "#111827", background: "#fff", outline: "none", minHeight: 80, resize: "vertical", boxSizing: "border-box" }} />
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        <button onClick={handleGenerate} disabled={generating || tasks.length === 0} style={{ fontSize: 13, fontWeight: 500, padding: "9px 18px", borderRadius: 10, border: "none", cursor: generating || tasks.length === 0 ? "not-allowed" : "pointer", background: "#111827", color: "#fff", opacity: generating || tasks.length === 0 ? 0.5 : 1 }}>
                            {generating ? "Generating..." : "Generate Daily Schedule"}
                        </button>
                        <button onClick={handleRegenerate} disabled={regenerating || tasks.length === 0} style={{ fontSize: 13, fontWeight: 500, padding: "9px 18px", borderRadius: 10, border: "1px solid #e5e7eb", cursor: regenerating || tasks.length === 0 ? "not-allowed" : "pointer", background: "#fff", color: "#374151", opacity: regenerating || tasks.length === 0 ? 0.5 : 1 }}>
                            {regenerating ? "Regenerating..." : "Regenerate (keep completed)"}
                        </button>
                        <button onClick={handleClearAll} disabled={clearing} style={{ fontSize: 13, fontWeight: 500, padding: "9px 18px", borderRadius: 10, border: "1px solid #fecaca", cursor: clearing ? "not-allowed" : "pointer", background: "#fff", color: "#ef4444", opacity: clearing ? 0.5 : 1 }}>
                            {clearing ? "Clearing..." : "Clear All"}
                        </button>
                    </div>
                </div>

                <div style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 16, padding: "20px", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                        <p style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
                            Active Tasks <span style={{ fontSize: 13, fontWeight: 400, color: "#9ca3af" }}>({tasks.length})</span>
                        </p>
                        <button onClick={fetchTasks} style={{ fontSize: 12, color: "#6b7280", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                            {loadingTasks ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>
                    {tasks.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "24px 0" }}>
                            <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 8 }}>No active tasks found.</p>
                            <Link href="/tasks" style={{ fontSize: 13, color: "#111827", fontWeight: 500, textDecoration: "underline" }}>Go to Tasks to create some</Link>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {tasks.map((task) => (
                                <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "1px solid #f3f4f6", borderRadius: 10 }}>
                                    <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 999, ...priorityColor(task.priority) }}>{task.priority}</span>
                                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "#111827" }}>{task.title}</span>
                                    <span style={{ fontSize: 12, color: "#9ca3af" }}>{task.estimatedMinutes} min</span>
                                    {task.deadline && <span style={{ fontSize: 11, color: "#9ca3af" }}>due {task.deadline.slice(0, 10)}</span>}
                                    {task.scheduledDate && task.scheduledStartTime && (
                                        <span style={{ fontSize: 11, color: "#2563eb", background: "#eff6ff", padding: "2px 8px", borderRadius: 999 }}>
                                            {task.scheduledDate} {task.scheduledStartTime}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {engineMeta && (
                    <div style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 16, padding: "20px", marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                            <p style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>Engine Result</p>
                            <span style={{ fontSize: 12, color: "#9ca3af" }}>Requested: {engineMeta.requestedMode} · Used: {engineMeta.usedMode}</span>
                        </div>
                        {engineMeta.fallback && (
                            <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#92400e" }}>
                                {engineMeta.fallback.code}: {engineMeta.fallback.message}
                            </div>
                        )}
                        {engineMeta.scheduledReasoning.length > 0 && (
                            <div style={{ marginBottom: 12 }}>
                                <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.05em", marginBottom: 6 }}>REASONING</p>
                                {engineMeta.scheduledReasoning.map((item) => (
                                    <div key={item.taskId} style={{ fontSize: 13, color: "#374151", padding: "5px 0", borderBottom: "1px solid #f9fafb" }}>
                                        <span style={{ fontWeight: 500 }}>{item.title}:</span> {item.reasoning}
                                    </div>
                                ))}
                            </div>
                        )}
                        {engineMeta.overflow.length > 0 && (
                            <div style={{ marginBottom: 12 }}>
                                <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.05em", marginBottom: 6 }}>OVERFLOW</p>
                                {engineMeta.overflow.map((item) => (
                                    <div key={item.taskId} style={{ fontSize: 13, color: "#374151", padding: "5px 0" }}>
                                        <span style={{ fontWeight: 500 }}>{item.title}:</span> {item.reason}
                                    </div>
                                ))}
                            </div>
                        )}
                        {engineMeta.unscheduled.length > 0 && (
                            <div>
                                <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.05em", marginBottom: 6 }}>UNSCHEDULED</p>
                                {engineMeta.unscheduled.map((item) => (
                                    <div key={item.taskId} style={{ fontSize: 13, color: "#374151", padding: "5px 0" }}>
                                        <span style={{ fontWeight: 500 }}>{item.title}:</span> {item.reason}
                                    </div>
                                ))}
                            </div>
                        )}
                        {engineMeta.overflow.length === 0 && engineMeta.unscheduled.length === 0 && (
                            <p style={{ fontSize: 13, color: "#9ca3af" }}>All tasks fit within the normal schedule window.</p>
                        )}
                    </div>
                )}

                <div style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 16, padding: "20px", marginBottom: 16 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 4 }}>Add Fixed Block</p>
                    <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>Fixed blocks (e.g. lunch, meetings) are treated as occupied by the engine.</p>
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: 12 }}>
                            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Lunch break, Team meeting" style={{ width: "100%", fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 12px", color: "#111827", background: "#fff", outline: "none", boxSizing: "border-box" }} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                            <div>
                                <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Start Time</p>
                                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ width: "100%", fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 10px", color: "#111827", background: "#fff", outline: "none", boxSizing: "border-box" }} />
                            </div>
                            <div>
                                <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>End Time</p>
                                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={{ width: "100%", fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 10px", color: "#111827", background: "#fff", outline: "none", boxSizing: "border-box" }} />
                            </div>
                            <div>
                                <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Status</p>
                                <select value={status} onChange={(e) => setStatus(e.target.value as ScheduleBlockStatus)} style={{ width: "100%", fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 10px", color: "#111827", background: "#fff", outline: "none", boxSizing: "border-box" }}>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="completed">Completed</option>
                                    <option value="missed">Missed</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" disabled={submitting} style={{ fontSize: 13, fontWeight: 500, padding: "9px 18px", borderRadius: 10, border: "none", cursor: submitting ? "not-allowed" : "pointer", background: "#111827", color: "#fff", opacity: submitting ? 0.5 : 1 }}>
                            {submitting ? "Adding..." : "Add Fixed Block"}
                        </button>
                    </form>
                </div>

                <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <p style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>Daily Schedule</p>
                        {loadingBlocks && <div style={{ width: 16, height: 16, border: "2px solid #e5e7eb", borderTopColor: "#6b7280", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />}
                    </div>
                    {blocks.length === 0 && !loadingBlocks ? (
                        <div style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 16, padding: "48px 24px", textAlign: "center" }}>
                            <p style={{ fontSize: 14, color: "#9ca3af" }}>No blocks yet. Generate a schedule or add a fixed block.</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {blocks.map((block) => {
                                const s = blockStatusStyle(block.status);
                                return (
                                    <div key={block._id} style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 16, padding: "14px 16px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                                            <div style={{ width: 3, height: 36, borderRadius: 99, background: s.dot, flexShrink: 0 }} />
                                            <div style={{ minWidth: 80, flexShrink: 0 }}>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", fontFamily: "monospace" }}>{block.startTime}</div>
                                                <div style={{ fontSize: 12, color: "#9ca3af", fontFamily: "monospace" }}>{block.endTime}</div>
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontSize: 14, fontWeight: 500, color: "#111827", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: block.status === "completed" ? "line-through" : "none" }}>
                                                    {block.title}
                                                </p>
                                                {block.taskId && <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0" }}>Task: {block.taskId}</p>}
                                            </div>
                                            <div style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 999, flexShrink: 0, textTransform: "capitalize" }}>
                                                {block.status}
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 15 }}>
                                            <span style={{ fontSize: 11, color: "#9ca3af", marginRight: 6 }}>Mark as:</span>
                                            {(["scheduled", "completed", "missed"] as const).map((s) => (
                                                <button key={s} onClick={() => handleStatusChange(block._id, s)} disabled={actionId === block._id} style={{ fontSize: 11, fontWeight: block.status === s ? 600 : 400, padding: "4px 10px", borderRadius: 999, border: `1px solid ${block.status === s ? "#d1d5db" : "#f3f4f6"}`, background: block.status === s ? "#f3f4f6" : "#fff", color: block.status === s ? "#111827" : "#6b7280", cursor: "pointer", textTransform: "capitalize" }}>
                                                    {s}
                                                </button>
                                            ))}
                                            <button onClick={() => { if (confirm("Delete this block?")) handleDelete(block._id); }} disabled={actionId === block._id} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 999, border: "1px solid #fee2e2", background: "#fff", color: "#ef4444", cursor: "pointer", marginLeft: "auto" }}>
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}