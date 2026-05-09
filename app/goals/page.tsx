"use client";

import { useCallback, useEffect, useState } from "react";
import GoalForm from "@/components/goals/GoalForm";
import GoalList from "@/components/goals/GoalList";
import type { Goal, GoalAPI, GoalStatus } from "@/types/goal";

export default function GoalsPage() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<GoalStatus>("active");
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [editingID, setEditingID] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);

    const resetForm = useCallback(() => {
        setEditingID(null);
        setTitle("");
        setDescription("");
        setStatus("active");
        setProgress(0);
        setError("");
    }, []);

    const handleCloseForm = useCallback(() => {
        resetForm();
        setIsFormOpen(false);
    }, [resetForm]);

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

    useEffect(() => {
        if (!isFormOpen) {
            return;
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape" && !loading) {
                handleCloseForm();
            }
        }

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleCloseForm, isFormOpen, loading]);

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
                     status,
                     progress,
                     tags: [],
                }),
            });

            const result = await res.json();

            if (!res.ok || !result.success) {
                throw new Error(result.message || "Failed to create goal");
                console.error("Error creating goal:", result.error || res.statusText);
            }
            
            
            handleCloseForm();// Clear form fields

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
        setIsFormOpen(true);
    }

    function handleOpenCreateForm() {
        resetForm();
        setIsFormOpen(true);
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
        <main className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top,#1d4ed8_0%,#0f172a_35%,#020617_100%)] p-4 text-white sm:p-6">
            <div className="mx-auto max-w-7xl space-y-5">
                <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-blue-950/20 backdrop-blur">
                    <h1 className="text-3xl font-bold text-white">Goal Management</h1>
                    <p className="mt-2 max-w-3xl text-slate-300">
                        Break long-term ambitions into manageable goals and keep progress visible.
                    </p>
                </section>

                <section className="space-y-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white">Your Goals</h2>
                            <p className="mt-1 text-sm text-slate-300">
                                Review, update, or clear goals as your plan changes.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-slate-950"
                            onClick={handleOpenCreateForm}
                        >
                            Add New Goal
                        </button>
                    </div>
                    <GoalList
                        goals={goals}
                        fetching={fetching}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </section>
            </div>

            {isFormOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="goal-form-title"
                    onClick={() => {
                        if (!loading) {
                            handleCloseForm();
                        }
                    }}
                >
                    <div
                        className="relative max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-white/10 p-4 shadow-2xl shadow-blue-950/40 backdrop-blur-xl sm:p-6"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_42%)]" />
                        <div className="relative">
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <h2 id="goal-form-title" className="text-xl font-bold text-white">
                                    {editingID ? "Edit Goal" : "Add New Goal"}
                                </h2>
                                <p className="mt-1 text-sm text-slate-300">
                                    Capture the details your schedule should plan around.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-300/30 text-xl leading-none text-blue-100 transition hover:border-blue-200 hover:bg-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-slate-950"
                                onClick={handleCloseForm}
                                aria-label="Close goal form"
                            >
                                ×
                            </button>
                        </div>

                        <GoalForm
                            title={title}
                            description={description}
                            status={status}
                            progress={progress}
                            loading={loading}
                            editingID={editingID}
                            error={error}
                            onTitleChange={setTitle}
                            onDescriptionChange={setDescription}
                            onStatusChange={setStatus}
                            onProgressChange={setProgress}
                            onSubmit={handleSubmit}
                            onCancelEdit={handleCloseForm}
                        />
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
