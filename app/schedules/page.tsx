"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ScheduleForm from "@/components/schedules/ScheduleForm";
import ScheduleList from "@/components/schedules/ScheduleList";
import type {
    ScheduleBlock,
    ScheduleBlockAPI,
    ScheduleBlockStatus,
} from "@/types/schedule";

function getTodayInputDate() {
    return new Date().toISOString().slice(0, 10);
}

function mapScheduleBlock(block: ScheduleBlockAPI): ScheduleBlock {
    return {
        ...block,
        id: block._id,
    };
}

export default function SchedulesPage() {
    const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
    const [date, setDate] = useState(getTodayInputDate());
    const [title, setTitle] = useState("");
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("10:00");
    const [status, setStatus] = useState<ScheduleBlockStatus>("scheduled");
    const [fetching, setFetching] = useState(false);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [actionId, setActionId] = useState<string | null>(null);
    const [error, setError] = useState("");

    const fetchSchedule = useCallback(async (selectedDate: string) => {
        try {
            setFetching(true);
            setError("");

            const response = await fetch(`/api/schedules?date=${selectedDate}`);
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || "Failed to fetch schedule");
            }

            setBlocks(result.data.map(mapScheduleBlock));
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setFetching(false);
        }
    }, []);

    useEffect(() => {
        fetchSchedule(date);
    }, [date, fetchSchedule]);

    async function handleGenerate() {
        try {
            setGenerating(true);
            setError("");

            const response = await fetch("/api/schedules/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ date }),
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || "Failed to generate schedule");
            }

            setBlocks(result.data.map(mapScheduleBlock));
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setGenerating(false);
        }
    }

    async function handleRegenerate() {
        try {
            setRegenerating(true);
            setError("");

            const response = await fetch("/api/schedules/regenerate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ date }),
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || "Failed to regenerate schedule");
            }

            setBlocks(result.data.map(mapScheduleBlock));
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setRegenerating(false);
        }
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!title.trim()) {
            setError("Title is required");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await fetch("/api/schedules", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title,
                    date,
                    startTime,
                    endTime,
                    status,
                }),
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || "Failed to add schedule block");
            }

            setTitle("");
            setStartTime("09:00");
            setEndTime("10:00");
            setStatus("scheduled");
            await fetchSchedule(date);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    }

    async function handleStatusChange(id: string, nextStatus: ScheduleBlockStatus) {
        try {
            setActionId(id);
            setError("");

            const response = await fetch(`/api/schedules/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status: nextStatus }),
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || "Failed to update schedule block");
            }

            setBlocks((currentBlocks) =>
                currentBlocks.map((block) =>
                    block.id === id ? mapScheduleBlock(result.data) : block
                )
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setActionId(null);
        }
    }

    async function handleDelete(id: string) {
        try {
            setActionId(id);
            setError("");

            const response = await fetch(`/api/schedules/${id}`, {
                method: "DELETE",
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || "Failed to delete schedule block");
            }

            setBlocks((currentBlocks) => currentBlocks.filter((block) => block.id !== id));
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setActionId(null);
        }
    }

    return (
        <main className="max-w-4xl mx-auto p-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Schedule Management</h1>
                    <p className="text-sm text-gray-600">Daily plan from mock task inputs</p>
                </div>
                <Link href="/" className="text-sm underline">
                    Back to Home
                </Link>
            </div>

            <section className="mb-6 p-4 border rounded space-y-4">
                <div>
                    <label className="block mb-1 font-medium text-sm">Schedule Date</label>
                    <input
                        type="date"
                        className="w-full border rounded px-3 py-2 sm:max-w-xs"
                        value={date}
                        onChange={(event) => setDate(event.target.value)}
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
                        disabled={generating || fetching}
                        onClick={handleGenerate}
                    >
                        {generating ? "Generating..." : "Generate Daily Schedule"}
                    </button>
                    <button
                        className="rounded border px-4 py-2 disabled:opacity-50"
                        disabled={regenerating || fetching}
                        onClick={handleRegenerate}
                    >
                        {regenerating ? "Regenerating..." : "Regenerate Missed Tasks"}
                    </button>
                </div>
            </section>

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
                    fetching={fetching}
                    actionId={actionId}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                />
            </section>
        </main>
    );
}
