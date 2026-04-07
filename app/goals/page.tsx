"use client";

import { useEffect, useState } from "react";
import GoalForm from "@/components/goals/GoalForm";
import GoalList from "@/components/goals/GoalList";
import type { Goal, GoalAPI, GoalStatus } from "@/types/goal";



export default function GoalsPage() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<"active" | "completed">("active");
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [editingID, setEditingID] = useState<string | null>(null);
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
            
            
            handleCancelEdit();// Clear form fields

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
                onCancelEdit={handleCancelEdit}
            />  

            <section>
                <h2 className="text-xl font-semibold mb-3">Your Goals</h2>
                <GoalList
                    goals={goals}
                    fetching={fetching}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </section>
        </main>
    );
}

