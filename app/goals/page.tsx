"use client";

import { set } from "mongoose";
import { setegid, title } from "process";
import { FormEvent, useEffect, useState } from "react";

// Define raw API response type for Goal
type GoalAPI = {
    _id: string;
    title: string;
    description?: string;
    status: "active" | "completed";
    targetDate?: string;
    progress: number;
    tags: string[];
    createdAt: string;
    updatedAt: string;
};
// Define a type for the Goal used in the React component, mapping _id to id
type Goal = Omit<GoalAPI, "_id"> & { 
    id: string;
};

export default function GoalsPage() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [editingID, setEditingID] = useState<string | null>(null);
    const [status, setStatus] = useState<"active" | "completed">("active");
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState("");

    // Fetch goals on component mount
    async function fetchGoals() {
        try {
            setFetching(true);
            setError("");

            const res = await fetch("/api/goals");
            const result = await res.json();

            if (!res.ok || !result.success) {
                throw new Error(result.message || "Failed to fetch goals");
                console.error("Error fetching goals:", result.error || res.statusText);
            }
            const mappedGoals: Goal[] = result.data.map((goal: GoalAPI) => ({
                ...goal,
                id: goal._id, // Map _id to id for easier use in React
            }));
            setGoals(mappedGoals);
            
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setFetching(false);
        }
    }

    useEffect(() => {
        fetchGoals();
    }, []);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>){
        // Prevent default form submission behavior
        e.preventDefault();

        if(!title.trim()){
            setError("Title is required");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const isEditing = Boolean(editingID);
            const url = isEditing ? `/api/goals/${editingID}` : "/api/goals";
            const method = isEditing ? "PUT" : "POST";

            const res = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                     title, 
                     description,
                     status: "active",
                     progress: 0,
                     tags: [],
                }),
            });

            const result = await res.json();

            if (!res.ok || !result.success) {
                throw new Error(result.message || "Failed to create goal");
                console.error("Error creating goal:", result.error || res.statusText);
            }
            
            // Clear form fields
            setTitle("");
            setDescription("");
            setStatus("active");
            setProgress(0);
            setEditingID(null);

            await fetchGoals(); // Refresh the goals list
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    }

    function handleEdit(goal: Goal) {
        setEditingID(goal.id);
        setTitle(goal.title);
        setDescription(goal.description || "");
        setStatus(goal.status);
        setProgress(goal.progress);
        setError("");
    }

    function handleCancelEdit() {
        setEditingID(null);
        setTitle("");
        setDescription("");
        setStatus("active");
        setProgress(0);
        setError("");
    }

    async function handleDelete(id: string) {
        try {
            setError("");

            const res = await fetch(`/api/goals/${id}`, {
                method: "DELETE",
            });

            const result = await res.json();

            if (!res.ok || !result.success) {
                throw new Error(result.message || "Failed to delete goal");
                console.error("Error deleting goal:", result.error || res.statusText);
            }
            
            await fetchGoals(); // Refresh the goals list
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    }

    // Render the component
    return (
        <main className="max-w-3xl mx-auto p-8">
            <h1 className="text-2xl font-bold mb-6">Goal Management</h1>

            <form onSubmit={handleSubmit} className="border rounded p-4 mb-6 space-y-4">
                <div>
                    <label className="block font-medium mb-1" htmlFor="title">Title<span className="text-red-500">*</span></label>
                    <input 
                        className="w-full border rounded px-3 py-2"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter goal title"
                    />
                </div>
                
                <div>
                    <label className="block font-medium mb-1" htmlFor="description">Description</label>
                    <textarea 
                        className="w-full border rounded px-3 py-2"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter goal description (optional)"
                    />
                </div>

                <div className="flex items-center gap-3">
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
                            onClick={handleCancelEdit}
                            className="rounded border px-4 py-2"
                        >
                            Cancel
                        </button>
                    )}
                </div>

                {error && <p className="text-red-500 mt-2">{error}</p>}
            </form>

            <section>
                <h2 className="text-xl font-semibold mb-3">Your Goals</h2>

                {fetching ? (
                    <p>Loading goals...</p>
                ) : goals.length === 0 ? (
                    <p>No goals found. Start by creating one!</p>
                ) : (
                    <ul className="space-y-3">
                        {goals.map((goal) => (
                            <li key={goal.id} className="border rounded p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <h3 className="font-semibold">{goal.title}</h3>
                                    <span className="text-sm border rounded px-2 py-1">
                                        {goal.status}
                                    </span>
                                </div>

                                {goal.description && (
                                   <p className="text-sm text-gray-600 mt-2">{goal.description}</p>
                                )}

                                <div>
                                    <label className="block text-sm font-medium mb-1">Status</label>
                                    <select className="w-full border rounded px-3 py-2"
                                        value={goal.status}
                                        onChange={(e) =>
                                            setStatus(e.target.value as "active" | "completed")
                                        }
                                        >
                                        <option value="active">Active</option>
                                        <option value="completed">Completed</option>
                                        </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Progress</label>
                                    <input 
                                        type="number"
                                        min={0}
                                        max={100}
                                        className="w-full border rounded px-3 py-2"
                                        value={progress}
                                        onChange={(e) => setProgress(parseInt(e.target.value) || 0)}
                                    />
                                </div>

                                <p className="text-sm mt-2">Progress: {goal.progress}%</p>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEdit(goal)}
                                        className="rounded border px-3 py-1 text-sm"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if (confirm("Are you sure you want to delete this goal?")){
                                            handleDelete(goal.id);
                                            }
                                        }}
                                        className="rounded border px-3 py-1 text-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </main>
    );
}

