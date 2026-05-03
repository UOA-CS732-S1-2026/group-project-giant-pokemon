"use client";

import type { ScheduleBlock, ScheduleBlockStatus } from "@/types/schedule";

type ScheduleListProps = {
    blocks: ScheduleBlock[];
    fetching: boolean;
    actionId: string | null;
    onStatusChange: (id: string, status: ScheduleBlockStatus) => void;
    onDelete: (id: string) => void;
};

export default function ScheduleList({
    blocks,
    fetching,
    actionId,
    onStatusChange,
    onDelete,
}: ScheduleListProps) {
    if (fetching) {
        return <p>Loading schedule...</p>;
    }

    if (blocks.length === 0) {
        return <p>No schedule blocks yet. Generate a daily schedule or add one manually.</p>;
    }

    return (
        <ul className="space-y-3">
            {blocks.map((block) => (
                <li key={block.id} className="p-4 border rounded">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-600">
                                {block.startTime} - {block.endTime}
                            </p>
                            <h3 className="font-semibold">{block.title}</h3>
                            {block.taskId && (
                                <p className="mt-1 text-xs text-gray-500">Task: {block.taskId}</p>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                className="rounded border px-3 py-1 text-sm"
                                value={block.status}
                                disabled={actionId === block.id}
                                onChange={(event) =>
                                    onStatusChange(
                                        block.id,
                                        event.target.value as ScheduleBlockStatus
                                    )
                                }
                            >
                                <option value="scheduled">Scheduled</option>
                                <option value="completed">Completed</option>
                                <option value="missed">Missed</option>
                            </select>

                            <button
                                className="rounded border px-3 py-1 text-sm disabled:opacity-50"
                                disabled={actionId === block.id}
                                onClick={() => {
                                    if (
                                        confirm(
                                            "Are you sure you want to delete this schedule block?"
                                        )
                                    ) {
                                        onDelete(block.id);
                                    }
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}

