"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Loader2 } from "lucide-react";
import { Alert, Badge, Button, FieldLabel, PageHeader, Panel, Select, TextArea, TextInput } from "@/components/ui/foundation";

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

    const priorityTone = (p: string): "rose" | "amber" | "emerald" => {
        if (p === "high") return "rose";
        if (p === "medium") return "amber";
        return "emerald";
    };

    const blockStatusTone = (s: string): "emerald" | "rose" | "slate" => {
        if (s === "completed") return "emerald";
        if (s === "missed") return "rose";
        return "slate";
    };

    return (
        <>
            <PageHeader
                label="Schedule"
                title="Daily Schedule"
                description="Generate and manage your daily schedule with rule or AI planning."
                actions={
                    <Link href="/timetable" className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-blue-200/50 hover:bg-blue-400/10">
                        <CalendarDays className="h-4 w-4" />
                        View Timetable
                    </Link>
                }
            />

            {error && <Alert>{error}</Alert>}

            <div className="flex flex-col items-stretch gap-5 xl:flex-row xl:items-start">
                <div className="grid min-w-0 gap-5 overflow-hidden xl:w-[300px] xl:flex-none 2xl:w-[320px]">
                    <Panel className="overflow-hidden">
                        <h2 className="text-lg font-semibold text-white">Engine Controls</h2>
                        <div className="mt-5 grid gap-4">
                            <div>
                                <FieldLabel>Engine Mode</FieldLabel>
                                <div className="inline-flex rounded-md border border-white/10 bg-slate-900/70 p-1">
                                    {(["rule", "ai"] as const).map((m) => (
                                        <button
                                            key={m}
                                            onClick={() => setMode(m)}
                                            className={`rounded-sm px-4 py-2 text-sm font-semibold transition ${mode === m ? "bg-blue-500/25 text-white" : "text-slate-400 hover:text-white"}`}
                                        >
                                            {m === "ai" ? "AI" : "Rule"}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <FieldLabel>Schedule Date</FieldLabel>
                                <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                            </div>
                            <div>
                                <FieldLabel>AI Instruction optional</FieldLabel>
                                <TextArea value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="e.g. Move easy low-priority tasks earlier as warm-up work." rows={4} />
                            </div>
                        </div>
                        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                            <Button onClick={handleGenerate} disabled={generating || tasks.length === 0} className="w-full">
                                {generating && <Loader2 className="h-4 w-4 animate-spin" />}
                                {generating ? "Generating..." : "Generate Daily Schedule"}
                            </Button>
                            <Button onClick={handleRegenerate} disabled={regenerating || tasks.length === 0} variant="secondary" className="w-full">
                                {regenerating && <Loader2 className="h-4 w-4 animate-spin" />}
                                {regenerating ? "Regenerating..." : "Regenerate"}
                            </Button>
                            <Button onClick={handleClearAll} disabled={clearing} variant="danger" className="w-full sm:col-span-2 xl:col-span-1">
                                {clearing ? "Clearing..." : "Clear All"}
                            </Button>
                        </div>
                    </Panel>

                    <Panel>
                        <h2 className="text-lg font-semibold text-white">Add Fixed Block</h2>
                        <p className="mt-1 text-sm text-slate-400">Fixed blocks, like lunch or meetings, are treated as occupied by the engine.</p>
                        <form onSubmit={handleSubmit} className="mt-5">
                            <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Lunch break, Team meeting" />
                            <div className="mt-4 grid grid-cols-1 gap-3">
                                <div>
                                    <FieldLabel>Start Time</FieldLabel>
                                    <TextInput type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                                </div>
                                <div>
                                    <FieldLabel>End Time</FieldLabel>
                                    <TextInput type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                                </div>
                                <div>
                                    <FieldLabel>Status</FieldLabel>
                                    <Select value={status} onChange={(e) => setStatus(e.target.value as ScheduleBlockStatus)}>
                                        <option value="scheduled">Scheduled</option>
                                        <option value="completed">Completed</option>
                                        <option value="missed">Missed</option>
                                    </Select>
                                </div>
                            </div>
                            <Button type="submit" disabled={submitting} className="mt-4 w-full">
                                {submitting ? "Adding..." : "Add Fixed Block"}
                            </Button>
                        </form>
                    </Panel>

                    <Panel>
                        <div className="mb-4 flex items-center justify-between gap-4">
                            <h2 className="text-lg font-semibold text-white">Active Tasks <span className="text-sm font-normal text-slate-400">({tasks.length})</span></h2>
                            <button onClick={fetchTasks} className="text-sm font-semibold text-blue-200 hover:text-white">
                                {loadingTasks ? "Refreshing..." : "Refresh"}
                            </button>
                        </div>
                        {tasks.length === 0 ? (
                            <div className="py-8 text-center">
                                <p className="mb-2 text-sm text-slate-400">No active tasks found.</p>
                                <Link href="/tasks" className="text-sm font-semibold text-blue-200 hover:text-white">Go to Tasks to create some</Link>
                            </div>
                        ) : (
                            <div className="grid gap-2">
                                {tasks.map((task) => (
                                    <div key={task.id} className="grid min-w-0 gap-2 overflow-hidden rounded-md border border-white/10 bg-white/[0.04] px-3 py-3">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <Badge tone={priorityTone(task.priority)}>{task.priority}</Badge>
                                            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{task.title}</span>
                                        </div>
                                        <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-slate-400">
                                            <span className="shrink-0">{task.estimatedMinutes} min</span>
                                            {task.deadline && <span>due {task.deadline.slice(0, 10)}</span>}
                                            {task.scheduledDate && task.scheduledStartTime && (
                                                <Badge tone="blue" className="max-w-full overflow-hidden text-ellipsis">
                                                    {task.scheduledDate} {task.scheduledStartTime}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Panel>
                </div>

                <div className="grid min-w-0 flex-1 gap-5">
                    {engineMeta && (
                        <Panel>
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <h2 className="text-lg font-semibold text-white">Engine Result</h2>
                                <Badge>Requested: {engineMeta.requestedMode} / Used: {engineMeta.usedMode}</Badge>
                            </div>
                            {engineMeta.fallback && (
                                <div className="mb-4"><Alert tone="amber">
                                    {engineMeta.fallback.code}: {engineMeta.fallback.message}
                                </Alert></div>
                            )}
                            {engineMeta.scheduleSummary && (
                                <div className="mb-4">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Summary</p>
                                    <p className="text-sm text-slate-300">{engineMeta.scheduleSummary}</p>
                                </div>
                            )}
                            {engineMeta.instructionDeviations.length > 0 && (
                                <div className="mb-4">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Instruction Notes</p>
                                    {engineMeta.instructionDeviations.map((item, index) => (
                                        <div key={index} className="py-1 text-sm text-slate-300">
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {engineMeta.unscheduled.length > 0 && (
                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Unscheduled</p>
                                    {engineMeta.unscheduled.map((item) => (
                                        <div key={item.taskId} className="py-1 text-sm text-slate-300">
                                            <span className="font-semibold text-white">{item.title}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {engineMeta.unscheduled.length === 0 && (
                                <p className="text-sm text-slate-400">All tasks fit within the normal schedule window.</p>
                            )}
                        </Panel>
                    )}

                    <Panel>
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">Daily Schedule</h2>
                            {loadingBlocks && <Loader2 className="h-5 w-5 animate-spin text-cyan-200" />}
                        </div>
                        {blocks.length === 0 && !loadingBlocks ? (
                            <div className="rounded-md border border-white/10 bg-white/[0.04] px-6 py-10 text-center text-sm text-slate-400">
                                No blocks yet. Generate a schedule or add a fixed block.
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {blocks.map((block) => (
                                    <div key={block._id} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                            <div className="font-mono text-sm text-blue-100 sm:w-28">
                                                <div className="font-semibold">{block.startTime}</div>
                                                <div className="text-slate-500">{block.endTime}</div>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className={`truncate text-sm font-semibold ${block.status === "completed" ? "text-slate-500 line-through" : "text-white"}`}>{block.title}</p>
                                                {block.taskId && <p className="mt-1 truncate text-xs text-slate-500">Task: {block.taskId}</p>}
                                            </div>
                                            <Badge tone={blockStatusTone(block.status)}>{block.status}</Badge>
                                        </div>
                                        <div className="mt-3 flex flex-wrap items-center gap-2 sm:pl-28">
                                            <span className="mr-1 text-xs text-slate-500">Mark as:</span>
                                            {(["scheduled", "completed", "missed"] as const).map((nextStatus) => (
                                                <button
                                                    key={nextStatus}
                                                    onClick={() => handleStatusChange(block._id, nextStatus)}
                                                    disabled={actionId === block._id}
                                                    className={`rounded-sm border px-2 py-1 text-xs font-semibold capitalize transition disabled:opacity-50 ${block.status === nextStatus ? "border-blue-300/30 bg-blue-500/20 text-blue-50" : "border-white/10 bg-white/5 text-slate-300 hover:text-white"}`}
                                                >
                                                    {nextStatus}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => { if (confirm("Delete this block?")) handleDelete(block._id); }}
                                                disabled={actionId === block._id}
                                                className="ml-auto rounded-sm border border-rose-300/30 bg-rose-400/10 px-2 py-1 text-xs font-semibold text-rose-100 transition hover:bg-rose-400/20 disabled:opacity-50"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Panel>
                </div>
            </div>
        </>
    );
}
