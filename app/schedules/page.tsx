"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ScheduleForm from "@/components/schedules/ScheduleForm";
import ScheduleList, { type ScheduleListBlock } from "@/components/schedules/ScheduleList";
import TaskInputList, {
    type LocalTask,
    type LocalTaskInput,
} from "@/components/schedules/TaskInputList";
import {
    DEFAULT_ESTIMATED_MINUTES,
    DEMO_USER_ID,
    hasValidTimeRange,
    isTimeString,
    parseScheduleDate,
} from "@/lib/scheduler";
import type {
    EngineGeneratedBlock,
    ScheduleGenerationMeta,
    ScheduleGenerationMode,
    SchedulableTask,
} from "@/lib/scheduleEngine";
import type { ScheduleBlockStatus } from "@/types/schedule";

const TASKS_STORAGE_KEY = "taskflow:schedules:test-tasks";
const BLOCKS_STORAGE_KEY = "taskflow:schedules:test-blocks";
const INSTRUCTION_STORAGE_KEY = "taskflow:schedules:test-instruction";

type EnginePreviewResponse = {
    success: boolean;
    data?: EngineGeneratedBlock[];
    meta?: ScheduleGenerationMeta;
    error?: string;
};

const defaultTasks: LocalTask[] = [
    {
        id: "task-1",
        title: "Review lecture notes",
        status: "todo",
        priority: "high",
        deadline: "2026-05-06",
        estimatedMinutes: 90,
    },
    {
        id: "task-2",
        title: "Implement API validation",
        status: "todo",
        priority: "high",
        deadline: "2026-05-08",
        estimatedMinutes: 120,
    },
    {
        id: "task-3",
        title: "Write module test notes",
        status: "todo",
        priority: "medium",
        deadline: "2026-05-10",
        estimatedMinutes: 60,
    },
    {
        id: "task-4",
        title: "Plan weekly workout",
        status: "todo",
        priority: "low",
        estimatedMinutes: 45,
    },
];

function getTodayInputDate() {
    return new Date().toISOString().slice(0, 10);
}

function createLocalId(prefix: string) {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return `${prefix}-${crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getEmptyTaskInput(): LocalTaskInput {
    return {
        title: "",
        priority: "medium",
        estimatedMinutes: "60",
        deadline: "",
    };
}

function toStoredDate(date: string) {
    return `${date}T00:00:00.000Z`;
}

function readStoredTasks() {
    if (typeof window === "undefined") {
        return defaultTasks;
    }

    const storedTasks = window.localStorage.getItem(TASKS_STORAGE_KEY);

    if (!storedTasks) {
        return defaultTasks;
    }

    try {
        return JSON.parse(storedTasks) as LocalTask[];
    } catch {
        return defaultTasks;
    }
}

function readStoredBlocks() {
    if (typeof window === "undefined") {
        return {};
    }

    const storedBlocks = window.localStorage.getItem(BLOCKS_STORAGE_KEY);

    if (!storedBlocks) {
        return {};
    }

    try {
        return JSON.parse(storedBlocks) as Record<string, ScheduleListBlock[]>;
    } catch {
        return {};
    }
}

function readStoredInstruction() {
    if (typeof window === "undefined") {
        return "";
    }

    return window.localStorage.getItem(INSTRUCTION_STORAGE_KEY) ?? "";
}

export default function SchedulesPage() {
    const [storedBlocksByDate, setStoredBlocksByDate] = useState<
        Record<string, ScheduleListBlock[]>
    >({});
    const [tasks, setTasks] = useState<LocalTask[]>(defaultTasks);
    const [taskInput, setTaskInput] = useState<LocalTaskInput>(getEmptyTaskInput());
    const [date, setDate] = useState(getTodayInputDate());
    const [title, setTitle] = useState("");
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("10:00");
    const [status, setStatus] = useState<ScheduleBlockStatus>("scheduled");
    const [mode, setMode] = useState<ScheduleGenerationMode>("rule");
    const [instruction, setInstruction] = useState("");
    const [hydrated, setHydrated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [actionId, setActionId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [taskError, setTaskError] = useState("");
    const [engineMeta, setEngineMeta] = useState<ScheduleGenerationMeta | null>(null);
    const blocks = storedBlocksByDate[date] ?? [];

    useEffect(() => {
        setTasks(readStoredTasks());
        setStoredBlocksByDate(readStoredBlocks());
        setInstruction(readStoredInstruction());
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (typeof window === "undefined" || !hydrated) {
            return;
        }

        window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    }, [hydrated, tasks]);

    useEffect(() => {
        if (typeof window === "undefined" || !hydrated) {
            return;
        }

        window.localStorage.setItem(INSTRUCTION_STORAGE_KEY, instruction);
    }, [hydrated, instruction]);

    useEffect(() => {
        if (typeof window === "undefined" || !hydrated) {
            return;
        }

        window.localStorage.setItem(
            BLOCKS_STORAGE_KEY,
            JSON.stringify(storedBlocksByDate)
        );
    }, [hydrated, storedBlocksByDate]);

    function saveBlocksForDate(nextBlocks: ScheduleListBlock[]) {
        const sortedBlocks = [...nextBlocks].sort((first, second) =>
            first.startTime.localeCompare(second.startTime)
        );

        setStoredBlocksByDate((currentBlocksByDate) => ({
            ...currentBlocksByDate,
            [date]: sortedBlocks,
        }));
    }

    function handleAddTask(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setTaskError("");

        if (!taskInput.title.trim()) {
            setTaskError("Task title is required");
            return;
        }

        const minutes = Number(taskInput.estimatedMinutes);

        if (taskInput.estimatedMinutes && (!Number.isFinite(minutes) || minutes <= 0)) {
            setTaskError("Estimated minutes must be greater than 0");
            return;
        }

        setTasks((currentTasks) => [
            ...currentTasks,
            {
                id: createLocalId("task"),
                title: taskInput.title.trim(),
                status: "todo",
                priority: taskInput.priority,
                deadline: taskInput.deadline || undefined,
                estimatedMinutes: taskInput.estimatedMinutes
                    ? Math.round(minutes)
                    : DEFAULT_ESTIMATED_MINUTES,
            },
        ]);
        setTaskInput(getEmptyTaskInput());
    }

    function handleDeleteTask(id: string) {
        setTasks((currentTasks) => currentTasks.filter((task) => task.id !== id));
    }

    async function handleGenerate() {
        setGenerating(true);
        setError("");

        if (!parseScheduleDate(date)) {
            setError("Date must use YYYY-MM-DD format.");
            setGenerating(false);
            return;
        }

        try {
            const completedBlocks = blocks.filter((block) => block.status === "completed");
            const result = await callScheduleEngine({
                date,
                mode,
                tasks: toSchedulableTasks(tasks),
                occupiedBlocks: completedBlocks,
                instruction,
            });
            const generatedBlocks = toLocalScheduleBlocks(result.data ?? []);

            setEngineMeta(result.meta ?? null);
            saveBlocksForDate([...completedBlocks, ...generatedBlocks]);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setGenerating(false);
        }
    }

    async function handleRegenerate() {
        setRegenerating(true);
        setError("");

        if (!parseScheduleDate(date)) {
            setError("Date must use YYYY-MM-DD format.");
            setRegenerating(false);
            return;
        }

        const fixedBlocks = blocks.filter((block) => block.fixed);
        const fixedTaskIds = new Set(
            fixedBlocks
                .map((block) => block.taskId)
                .filter((taskId): taskId is string => Boolean(taskId))
        );
        const tasksToReplan = tasks.filter((task) => !fixedTaskIds.has(task.id));

        try {
            const result = await callScheduleEngine({
                date,
                mode,
                tasks: toSchedulableTasks(tasksToReplan),
                occupiedBlocks: toFixedOccupiedBlocks(fixedBlocks),
                instruction,
            });
            const generatedBlocks = toLocalScheduleBlocks(result.data ?? []);

            setEngineMeta(result.meta ?? null);
            saveBlocksForDate([...fixedBlocks, ...generatedBlocks]);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setRegenerating(false);
        }
    }

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!title.trim()) {
            setError("Title is required");
            return;
        }

        if (!isTimeString(startTime) || !isTimeString(endTime)) {
            setError("Start time and end time must use HH:mm format.");
            return;
        }

        if (!hasValidTimeRange(startTime, endTime)) {
            setError("Start time must be before end time.");
            return;
        }

        setLoading(true);
        setError("");

        saveBlocksForDate([
            ...blocks,
            {
                id: createLocalId("block"),
                userId: DEMO_USER_ID,
                title: title.trim(),
                date: toStoredDate(date),
                startTime,
                endTime,
                status,
                fixed: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        ]);
        setTitle("");
        setStartTime("09:00");
        setEndTime("10:00");
        setStatus("scheduled");
        setLoading(false);
    }

    function handleStatusChange(id: string, nextStatus: ScheduleBlockStatus) {
        setActionId(id);
        setError("");

        saveBlocksForDate(
            blocks.map((block) =>
                block.id === id
                    ? { ...block, status: nextStatus, updatedAt: new Date().toISOString() }
                    : block
            )
        );
        setActionId(null);
    }

    function handleFixedChange(id: string, fixed: boolean) {
        setActionId(id);
        setError("");

        saveBlocksForDate(
            blocks.map((block) =>
                block.id === id ? { ...block, fixed, updatedAt: new Date().toISOString() } : block
            )
        );
        setActionId(null);
    }

    function handleDelete(id: string) {
        setActionId(id);
        setError("");
        saveBlocksForDate(blocks.filter((block) => block.id !== id));
        setActionId(null);
    }

    return (
        <main className="max-w-6xl mx-auto p-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Schedule Management</h1>
                    <p className="text-sm text-gray-600">
                        Browser-only test scheduling from editable task inputs
                    </p>
                </div>
                <Link href="/" className="text-sm underline">
                    Back to Home
                </Link>
            </div>

            <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
                <TaskInputList
                    tasks={tasks}
                    taskInput={taskInput}
                    error={taskError}
                    onTaskInputChange={setTaskInput}
                    onAddTask={handleAddTask}
                    onDeleteTask={handleDeleteTask}
                />

                <div>
                    <section className="mb-6 p-4 border rounded space-y-4">
                        <div>
                            <label className="block mb-1 font-medium text-sm">
                                Engine Mode
                            </label>
                            <div className="inline-flex rounded border p-1">
                                <button
                                    type="button"
                                    className={`rounded px-3 py-1 text-sm ${
                                        mode === "rule" ? "bg-black text-white" : ""
                                    }`}
                                    onClick={() => setMode("rule")}
                                >
                                    Rule
                                </button>
                                <button
                                    type="button"
                                    className={`rounded px-3 py-1 text-sm ${
                                        mode === "ai" ? "bg-black text-white" : ""
                                    }`}
                                    onClick={() => setMode("ai")}
                                >
                                    AI
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 font-medium text-sm">
                                Schedule Date
                            </label>
                            <input
                                type="date"
                                className="w-full border rounded px-3 py-2 sm:max-w-xs"
                                value={date}
                                onChange={(event) => setDate(event.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block mb-1 font-medium text-sm">
                                AI Rescheduling Instruction
                            </label>
                            <textarea
                                className="min-h-24 w-full rounded border px-3 py-2 text-sm"
                                value={instruction}
                                onChange={(event) => setInstruction(event.target.value)}
                                placeholder="Example: Move one or two easy low-priority tasks earlier as warm-up work."
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
                                disabled={generating}
                                onClick={handleGenerate}
                            >
                                {generating ? "Generating..." : "Generate Daily Schedule"}
                            </button>
                            <button
                                className="rounded border px-4 py-2 disabled:opacity-50"
                                disabled={regenerating}
                                onClick={handleRegenerate}
                            >
                                {regenerating ? "Regenerating..." : "Regenerate Available Time"}
                            </button>
                        </div>
                    </section>

                    {engineMeta && (
                        <section className="mb-6 p-4 border rounded space-y-3">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <h2 className="text-lg font-semibold">Engine Result</h2>
                                <p className="text-sm text-gray-600">
                                    Requested: {engineMeta.requestedMode} · Used:{" "}
                                    {engineMeta.usedMode}
                                </p>
                            </div>

                            {engineMeta.fallback && (
                                <div className="rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
                                    {engineMeta.fallback.code}: {engineMeta.fallback.message}
                                </div>
                            )}

                            {engineMeta.scheduledReasoning.length > 0 && (
                                <div>
                                    <h3 className="font-medium text-sm">Reasoning</h3>
                                    <ul className="mt-2 space-y-1 text-sm text-gray-700">
                                        {engineMeta.scheduledReasoning.map((item) => (
                                            <li key={item.taskId}>
                                                {item.title}: {item.reasoning}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {engineMeta.overflow.length > 0 && (
                                <div>
                                    <h3 className="font-medium text-sm">Overflow</h3>
                                    <ul className="mt-2 space-y-1 text-sm text-gray-700">
                                        {engineMeta.overflow.map((item) => (
                                            <li key={item.taskId}>
                                                {item.title}: {item.reason}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {engineMeta.unscheduled.length > 0 && (
                                <div>
                                    <h3 className="font-medium text-sm">Unscheduled</h3>
                                    <ul className="mt-2 space-y-1 text-sm text-gray-700">
                                        {engineMeta.unscheduled.map((item) => (
                                            <li key={item.taskId}>
                                                {item.title}: {item.reason}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {engineMeta.overflow.length === 0 &&
                                engineMeta.unscheduled.length === 0 && (
                                    <p className="text-sm text-gray-600">
                                        All selected tasks fit within the normal schedule window.
                                    </p>
                                )}
                        </section>
                    )}

                    <ScheduleForm
                        title={title}
                        startTime={startTime}
                        endTime={endTime}
                        status={status}
                        loading={loading}
                        error={error}
                        onTitleChange={setTitle}
                        onStartTimeChange={setStartTime}
                        onEndTimeChange={setEndTime}
                        onStatusChange={setStatus}
                        onSubmit={handleSubmit}
                    />

                    <section>
                        <h2 className="text-xl font-semibold mb-3">Daily Schedule</h2>
                        <ScheduleList
                            blocks={blocks}
                            fetching={false}
                            actionId={actionId}
                            onFixedChange={handleFixedChange}
                            onStatusChange={handleStatusChange}
                            onDelete={handleDelete}
                        />
                    </section>
                </div>
            </div>
        </main>
    );
}

function toSchedulableTasks(tasks: LocalTask[]): SchedulableTask[] {
    return tasks.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        deadline: task.deadline,
        estimatedMinutes: task.estimatedMinutes ?? DEFAULT_ESTIMATED_MINUTES,
    }));
}

function toLocalScheduleBlocks(
    blocks: EngineGeneratedBlock[]
): ScheduleListBlock[] {
    const now = new Date().toISOString();

    return blocks.map((block) => ({
        ...block,
        id: createLocalId("block"),
        fixed: false,
        createdAt: now,
        updatedAt: now,
    }));
}

function toFixedOccupiedBlocks(blocks: ScheduleListBlock[]): ScheduleListBlock[] {
    return blocks.map((block) => ({
        ...block,
        status: block.status === "missed" ? "scheduled" : block.status,
    }));
}

async function callScheduleEngine({
    date,
    mode,
    tasks,
    occupiedBlocks,
    instruction,
}: {
    date: string;
    mode: ScheduleGenerationMode;
    tasks: SchedulableTask[];
    occupiedBlocks: ScheduleListBlock[];
    instruction: string;
}): Promise<EnginePreviewResponse> {
    const response = await fetch("/api/schedules/engine", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            date,
            mode,
            tasks,
            occupiedBlocks,
            instruction,
        }),
    });
    const result = (await response.json()) as EnginePreviewResponse;

    if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to run schedule engine.");
    }

    return result;
}
