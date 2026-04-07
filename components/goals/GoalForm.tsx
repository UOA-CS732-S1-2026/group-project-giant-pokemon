"use client";

import type { FormEvent } from "react";
import type { GoalStatus } from "@/models/Goal";

type GoalFormProps = {
    title: string;
    description: string;
    status: GoalStatus;
    progress: number;
    loading: boolean;
    editingID: string | null;
    error: string;
    onTitleChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onStatusChange: (value: GoalStatus) => void;
    onProgressChange: (value: number) => void;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
    onCancelEdit: () => void;
};

export default function GoalForm({
    title,
    description,
    status,
    progress,
    loading,
    editingID,
    error,
    onTitleChange,
    onDescriptionChange,
    onStatusChange,
    onProgressChange,
    onSubmit,
    onCancelEdit,
}: GoalFormProps) {
    return (
        <form onSubmit={onSubmit} className="mb-6 p-4 border rounded space-y-4">
            <div>
                <label className="block mb-1 font-medium text-sm">Title</label>
                <input
                    className="w-full border rounded px-3 py-2"
                    value={title}
                    onChange={(e) => onTitleChange(e.target.value)}
                    placeholder="Enter a goal title"
                />
            </div>
            
            <div>
                <label className="block mb-1 font-medium text-sm">Description</label>
                <textarea
                    className="w-full border rounded px-3 py-2"
                    value={description}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                    placeholder="Enter a goal description"
                />
            </div>

            <div>
                <label className="block mb-1 font-medium text-sm">Status</label>
                <select
                    className="w-full border rounded px-3 py-2"
                    value={status}
                    onChange={(e) => onStatusChange(e.target.value as GoalStatus)}
                >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                </select>
            </div>

            <div>
                <label className="block mb-1 font-medium text-sm">Progress (%)</label>
                <input
                    type="number"
                    className="w-full border rounded px-3 py-2"
                    value={progress}
                    onChange={(e) => onProgressChange(Number(e.target.value))}
                    min={0}
                    max={100}
                />
            </div>

            <button
                type="submit"
                 className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
                 disabled={loading}
            >
                {loading 
                    ? editingID ? "Updating..." : "Creating..."
                    : editingID ? "Update Goal" : "Create Goal"}
            </button>

            {editingID && (
                <button
                    type="button"
                    className="rounded bg-gray-500 px-4 py-2 text-white ml-2 disabled:opacity-50"
                    onClick={onCancelEdit}
                    disabled={loading}
                >
                    Cancel
                </button>
            )}

            {error && <p className="text-red-500 mt-2">{error}</p>}
        </form>
    );
}  