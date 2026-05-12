"use client";

import { useEffect, useState } from "react";
import type { Task, TaskAPI, TaskPriority, TaskStatus } from "@/types/task";
// ============ Schedule Engine Adapter Layer ============

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

// ============ TasksPage with AI Quick Add ============

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [deadline, setDeadline] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledStartTime, setScheduledStartTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [editingID, setEditingID] = useState<string | null>(null);
  const [error, setError] = useState("");

  // AI Quick Add states
  const [nlInput, setNlInput] = useState("");
  const [nlParsing, setNlParsing] = useState(false);
  const [nlSaving, setNlSaving] = useState(false);
  const [nlPreview, setNlPreview] = useState<any[]>([]);
  const [nlError, setNlError] = useState("");
  const [nlSuccess, setNlSuccess] = useState(false);

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
        scheduledDate: task.scheduledDate,
        scheduledStartTime: task.scheduledStartTime,
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
    setScheduledDate("");
    setScheduledStartTime("");
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

    if (scheduledDate && !/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) {
      setError("Scheduled date must be in YYYY-MM-DD format");
      return;
    }

    if (scheduledStartTime && !/^\d{2}:\d{2}$/.test(scheduledStartTime)) {
      setError("Start time must be in HH:MM format");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const isEditing = Boolean(editingID);
      const url = isEditing ? `/api/tasks/${editingID}` : "/api/tasks";
      const method = isEditing ? "PUT" : "POST";

      const body: {
        title: string;
        description: string;
        priority: TaskPriority;
        estimatedMinutes: number;
        deadline?: string;
        scheduledDate?: string;
        scheduledStartTime?: string;
        status?: TaskStatus;
      } = {
        title,
        description,
        priority,
        estimatedMinutes,
      };

      if (deadline) body.deadline = deadline;
      if (scheduledDate) body.scheduledDate = scheduledDate;
      if (scheduledStartTime) body.scheduledStartTime = scheduledStartTime;
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
    setScheduledDate(task.scheduledDate || "");
    setScheduledStartTime(task.scheduledStartTime || "");
    setError("");
  }

  // AI Quick Add handlers
  async function handleNlParse() {
    if (!nlInput.trim()) return;
    setNlParsing(true);
    setNlError("");
    setNlPreview([]);
    setNlSuccess(false);
    try {
      const res = await fetch("/api/tasks/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: nlInput }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || "Parse failed");
      setNlPreview(result.data);
    } catch (err) {
      setNlError(err instanceof Error ? err.message : String(err));
    } finally {
      setNlParsing(false);
    }
  }

  async function handleNlSave() {
    if (!nlPreview.length) return;
    setNlSaving(true);
    setNlError("");
    try {
      await Promise.all(
        nlPreview.map((task) =>
          fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(task),
          })
        )
      );
      setNlSuccess(true);
      setNlPreview([]);
      setNlInput("");
      await fetchTasks();
    } catch (err) {
      setNlError(err instanceof Error ? err.message : String(err));
    } finally {
      setNlSaving(false);
    }
  }

  const priorityColors: Record<string, { bg: string; color: string }> = {
    high:   { bg: "#fef2f2", color: "#b91c1c" },
    medium: { bg: "#fffbeb", color: "#92400e" },
    low:    { bg: "#f0fdf4", color: "#14532d" },
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-3xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6 text-black">Task Management</h1>

        {/* AI Quick Add Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2">AI Quick Add</h2>
          <p className="text-sm text-gray-500 mb-4">
            Describe your tasks — AI will extract all of them at once
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={nlInput}
              onChange={(e) => { setNlInput(e.target.value); setNlSuccess(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleNlParse()}
              placeholder="e.g. lunch at 12:30 pm"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
            />
            <button
              onClick={handleNlParse}
              disabled={nlParsing || !nlInput.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
            >
              {nlParsing && (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {nlParsing ? "Parsing..." : "Parse"}
            </button>
          </div>

          {nlError && (
            <p className="text-sm text-red-600 mt-2">{nlError}</p>
          )}

          {nlSuccess && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
              <p className="text-sm text-green-700 font-medium">Tasks created successfully!</p>
              <button
                onClick={() => { setNlSuccess(false); }}
                className="text-xs text-green-600 hover:text-green-800"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Preview */}
          {nlPreview.length > 0 && (
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                {nlPreview.length} task{nlPreview.length > 1 ? "s" : ""} found — review before saving
              </p>

              <div className="space-y-2 mb-4">
                {nlPreview.map((task, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-lg p-3">
                    <p className="font-semibold text-gray-800 text-sm mb-2">{task.title}</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[task.priority]?.bg || "bg-gray-100"} ${priorityColors[task.priority]?.color || "text-gray-600"}`}>
                        {task.priority}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {task.estimatedMinutes} min
                      </span>
                      {task.deadline && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                          Due {task.deadline}
                        </span>
                      )}
                      {task.scheduledDate && task.scheduledStartTime && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600">
                          {task.scheduledDate} {task.scheduledStartTime}
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-xs text-gray-500">{task.description}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleNlSave}
                  disabled={nlSaving}
                  className="px-4 py-1.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
                >
                  {nlSaving && (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {nlSaving ? "Saving..." : `Save ${nlPreview.length} task${nlPreview.length > 1 ? "s" : ""}`}
                </button>
                <button
                  onClick={() => { setNlPreview([]); setNlInput(""); }}
                  className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Create/Edit Task Form */}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
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

            {/* Scheduled time */}
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Scheduled time <span className="text-gray-400 font-normal">(optional — pin to a specific time)</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start time</label>
                  <input
                    type="time"
                    value={scheduledStartTime}
                    onChange={(e) => setScheduledStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              {scheduledDate && scheduledStartTime && (
                <p className="text-xs text-blue-600 mt-2">
                  Pinned to {scheduledDate} at {scheduledStartTime} — will appear in Timetable
                </p>
              )}
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
          <h2 className="text-xl font-semibold mb-3 text-black">Your Tasks</h2>
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
                  <div className="flex items-start gap-3 text-black">
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
                        {task.scheduledDate && task.scheduledStartTime && (
                          <span className="text-xs px-2 py-1 rounded-full text-blue-600 bg-blue-50">
                            {task.scheduledDate} {task.scheduledStartTime}
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p className={`text-sm ${task.status === "completed" ? "text-gray-400" : "text-gray-600"}`}>
                          {task.description}
                        </p>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-gray-400">
                        <span>⏱️ {task.estimatedMinutes} min</span>
                        {task.deadline && <span>📅 Due: {task.deadline}</span>}
                        {task.scheduledDate && !task.scheduledStartTime && <span>📌 {task.scheduledDate}</span>}
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