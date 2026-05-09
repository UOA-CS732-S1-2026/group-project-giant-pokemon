"use client";

import { useEffect, useState } from "react";
import type { Task, TaskAPI, TaskPriority, TaskStatus } from "@/types/task";
import Navbar from "@/components/Navbar";

// ============ Schedule Engine Adapter Layer (NEW - does not affect existing UI) ============

// Contract-compliant SchedulableTask type
export type SchedulableTask = {
  id: string;
  goalId?: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress";
  priority: "low" | "medium" | "high";
  deadline?: string;
  estimatedMinutes: number;
};

// Convert Task to SchedulableTask (contract compliant)
export function toSchedulableTask(task: Task): SchedulableTask {
  return {
    id: task.id,
    goalId: undefined,
    title: task.title,
    description: task.description,
    status: task.status === "completed" ? "todo" : task.status,
    priority: task.priority,
    deadline: task.deadline,
    estimatedMinutes: task.estimatedMinutes || 60,
  };
}

// Get schedulable tasks (contract compliant: filter completed)
export function getSchedulableTasks(tasks: Task[]): SchedulableTask[] {
  return tasks
    .filter(task => task.status !== "completed")
    .map(toSchedulableTask);
}

// Validate tasks against contract requirements
export function validateSchedulableTasks(tasks: SchedulableTask[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const task of tasks) {
    if (!task.id) errors.push(`Task missing id: ${task.title}`);
    if (ids.has(task.id)) errors.push(`Duplicate task id: ${task.id}`);
    ids.add(task.id);
    if (!task.title || task.title.trim() === "") errors.push(`Task ${task.id} has blank title`);
    if (!task.priority) errors.push(`Task ${task.id} missing priority`);
    if (task.priority && !["low", "medium", "high"].includes(task.priority)) {
      errors.push(`Task ${task.id} invalid priority: ${task.priority}`);
    }
    if (task.status && !["todo", "in_progress"].includes(task.status)) {
      errors.push(`Task ${task.id} invalid status: ${task.status}`);
    }
    if (task.deadline && !/^\d{4}-\d{2}-\d{2}$/.test(task.deadline)) {
      errors.push(`Task ${task.id} invalid deadline format: ${task.deadline}`);
    }
    if (task.estimatedMinutes !== undefined && (task.estimatedMinutes < 1 || task.estimatedMinutes > 480)) {
      errors.push(`Task ${task.id} invalid estimatedMinutes: ${task.estimatedMinutes}`);
    }
  }

  if (tasks.length > 50) {
    errors.push(`Too many tasks: ${tasks.length} (max 50)`);
  }

  return { valid: errors.length === 0, errors };
}

// ============ Existing TasksPage - COMPLETELY UNCHANGED BELOW ============

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [editingID, setEditingID] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function fetchTasks() {
    try {
      setFetching(true);
      setError("");

      const res = await fetch("/api/tasks");
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch tasks");
      }

      const mappedTasks: Task[] = result.data.map((task: TaskAPI) => ({
        id: task._id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        estimatedMinutes: task.estimatedMinutes,
        deadline: task.deadline,
        userId: task.userId,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      }));

      setTasks(mappedTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  function handleCancelEdit() {
    setEditingID(null);
    setTitle("");
    setDescription("");
    setPriority("medium");
    setEstimatedMinutes(60);
    setDeadline("");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (estimatedMinutes < 1 || estimatedMinutes > 480) {
      setError("Estimated minutes must be between 1 and 480");
      return;
    }

    if (deadline && !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
      setError("Deadline must be in YYYY-MM-DD format");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const isEditing = Boolean(editingID);
      const url = isEditing ? `/api/tasks/${editingID}` : "/api/tasks";
      const method = isEditing ? "PUT" : "POST";

      const body: any = {
        title,
        description,
        priority,
        estimatedMinutes,
      };

      if (deadline) body.deadline = deadline;
      if (isEditing) {
        const task = tasks.find(t => t.id === editingID);
        if (task) body.status = task.status;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to save task");
      }

      handleCancelEdit();
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(task: Task, newStatus: TaskStatus) {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...task, status: newStatus }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to update task");
      }

      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleDelete(taskId: string) {
    if (!confirm("Delete this task?")) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to delete task");
      }

      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function handleEdit(task: Task) {
    setEditingID(task.id);
    setTitle(task.title);
    setDescription(task.description || "");
    setPriority(task.priority);
    setEstimatedMinutes(task.estimatedMinutes);
    setDeadline(task.deadline || "");
    setError("");
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="max-w-3xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Task Management</h1>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingID ? "Edit Task" : "Create Task"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter task title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter task description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Minutes (1-480)
              </label>
              <input
                type="number"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || 60)}
                min="1"
                max="480"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Saving..." : editingID ? "Update Task" : "Create Task"}
              </button>
              {editingID && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Task List */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Your Tasks</h2>
          {fetching ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No tasks yet. Create one!</div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white rounded-lg shadow p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start gap-3">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                      className="mt-1 text-sm border rounded px-2 py-1"
                    >
                      <option value="todo">Todo</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold ${task.status === "completed" ? "line-through text-gray-400" : "text-gray-800"}`}>
                          {task.title}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          task.priority === "high" ? "text-red-600 bg-red-50" :
                          task.priority === "medium" ? "text-yellow-600 bg-yellow-50" :
                          "text-green-600 bg-green-50"
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                      {task.description && (
                        <p className={`text-sm ${task.status === "completed" ? "text-gray-400" : "text-gray-600"}`}>
                          {task.description}
                        </p>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-gray-400">
                        <span>⏱️ {task.estimatedMinutes} min</span>
                        {task.deadline && <span>📅 Due: {task.deadline}</span>}
                        <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(task)}
                        className="text-blue-500 hover:text-blue-700 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}