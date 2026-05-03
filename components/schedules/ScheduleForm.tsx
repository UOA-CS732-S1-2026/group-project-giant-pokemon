"use client";

import type { FormEvent } from "react";
import type { ScheduleBlockStatus } from "@/types/schedule";

type ScheduleFormProps = {
    title: string;
    startTime: string;
    endTime: string;
    status: ScheduleBlockStatus;
    loading: boolean;
    error: string;
    onTitleChange: (value: string) => void;
    onStartTimeChange: (value: string) => void;
    onEndTimeChange: (value: string) => void;
    onStatusChange: (value: ScheduleBlockStatus) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function ScheduleForm({
    title,
    startTime,
    endTime,
    status,
    loading,
    error,
    onTitleChange,
    onStartTimeChange,
    onEndTimeChange,
    onStatusChange,
    onSubmit,
}: ScheduleFormProps) {
    return (
        <form onSubmit={onSubmit} className="mb-6 p-4 border rounded space-y-4">
            <div>
                <label className="block mb-1 font-medium text-sm">Title</label>
                <input
                    className="w-full border rounded px-3 py-2"
                    value={title}
                    onChange={(event) => onTitleChange(event.target.value)}
                    placeholder="Add a custom schedule block"
                />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <div>
                    <label className="block mb-1 font-medium text-sm">Start Time</label>
                    <input
                        type="time"
                        className="w-full border rounded px-3 py-2"
                        value={startTime}
                        onChange={(event) => onStartTimeChange(event.target.value)}
                    />
                </div>

                <div>
                    <label className="block mb-1 font-medium text-sm">End Time</label>
                    <input
                        type="time"
                        className="w-full border rounded px-3 py-2"
                        value={endTime}
                        onChange={(event) => onEndTimeChange(event.target.value)}
                    />
                </div>

                <div>
                    <label className="block mb-1 font-medium text-sm">Status</label>
                    <select
                        className="w-full border rounded px-3 py-2"
                        value={status}
                        onChange={(event) =>
                            onStatusChange(event.target.value as ScheduleBlockStatus)
                        }
                    >
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="missed">Missed</option>
                    </select>
                </div>
            </div>

            <button
                type="submit"
                className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
                disabled={loading}
            >
                {loading ? "Adding..." : "Add Schedule Block"}
            </button>

            {error && <p className="text-red-500 mt-2">{error}</p>}
        </form>
    );
}

