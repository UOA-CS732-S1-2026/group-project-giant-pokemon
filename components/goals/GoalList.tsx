"use client";

import type { Goal } from "@/types/goal";

type GoalListProps = {
    goals: Goal[];
    fetching: boolean;
    onEdit: (goal: Goal) => void;
    onDelete: (id: string) => void;
};

export default function GoalList({
    goals, 
    fetching,
    onEdit, 
    onDelete 
}: GoalListProps) {
    if (fetching) {
        return <p>Loading goals...</p>;
    }
    
    if (goals.length === 0) {
        return <p>No goals yet. Start by creating a new goal!</p>;
    }

    return (
        <ul className="space-y-3">
            {goals.map((goal) => 
                <li key={goal.id} className="p-4 border rounded">
                    <div className="flex justify-between items-center gap-4">
                        <h3 className="font-semibold">{goal.title}</h3>
                        <span className="text-sm border rounded px-2 py-1">
                            {goal.status}
                        </span>
                    </div>

                    {goal.description && <p className="mt-2 text-sm text-gray-600">{goal.description}</p>}
                    
                    <div className="mt-3 flex items-center justify-between">
                        <p className="text-sm">Progress: {goal.progress}%</p>

                        <div className="flex items-center gap-2">
                            <button
                                className="rounded border px-3 py-1 text-sm"
                                onClick={() => onEdit(goal)}
                            >
                                Edit
                            </button>
                            <button
                                className="rounded border px-3 py-1 text-sm"
                                onClick={() => {
                                    if (confirm("Are you sure you want to delete this goal?")) {
                                        onDelete(goal.id);
                                    }
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </li>
            )}
        </ul>
    );
}

