"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Sparkles } from "lucide-react";
import { Alert, Badge, Button, FieldLabel, PageHeader, Panel, Select, TextArea, TextInput } from "@/components/ui/foundation";
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
  const [isFormOpen, setIsFormOpen] = useState(false);

  // AI Quick Add states
  const [nlInput, setNlInput] = useState("");
  const [nlParsing, setNlParsing] = useState(false);
  const [nlSaving, setNlSaving] = useState(false);
  const [nlPreview, setNlPreview] = useState<Array<{
    title: string;
    description?: string;
    priority: string;
    estimatedMinutes: number;
    deadline?: string;
    scheduledDate?: string;
    scheduledStartTime?: string;
  }>>([]);
  const [nlError, setNlError] = useState("");
  const [nlSuccess, setNlSuccess] = useState(false);

  async function fetchTasks() {
    try {
      setFetching(true);
      setError("");

      const res = await fetch("/api/tasks");
      const result = await res.json() as { success: boolean; data: TaskAPI[]; message?: string };

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

  const resetTaskForm = useCallback(() => {
    setEditingID(null);
    setTitle("");
    setDescription("");
    setPriority("medium");
    setEstimatedMinutes(60);
    setDeadline("");
    setScheduledDate("");
    setScheduledStartTime("");
    setError("");
  }, []);

  const handleCloseForm = useCallback(() => {
    resetTaskForm();
    setIsFormOpen(false);
  }, [resetTaskForm]);

  function handleOpenCreateForm() {
    resetTaskForm();
    setIsFormOpen(true);
  }

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

      handleCloseForm();
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
    setIsFormOpen(true);
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

  const priorityTones: Record<string, "rose" | "amber" | "emerald"> = {
    high: "rose",
    medium: "amber",
    low: "emerald",
  };

  const statusTones: Record<TaskStatus, "slate" | "cyan" | "emerald"> = {
    todo: "slate",
    in_progress: "cyan",
    completed: "emerald",
  };

  return (
    <>
      <PageHeader
        label="Tasks"
        title="Task Management"
        description="Capture, review, and schedule work without leaving the cockpit."
        actions={
          <Button type="button" onClick={handleOpenCreateForm}>
            Create Task
          </Button>
        }
      />

      <Panel>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-cyan-300/30 bg-cyan-300/10 text-cyan-100">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">AI Quick Add</h2>
            <p className="mt-1 text-sm text-slate-400">Describe your tasks and review what AI extracts before saving.</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <TextInput
              type="text"
              value={nlInput}
              onChange={(e) => { setNlInput(e.target.value); setNlSuccess(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleNlParse()}
              placeholder="e.g. lunch at 12:30 pm"
              className="flex-1"
            />
          <Button
              onClick={handleNlParse}
              disabled={nlParsing || !nlInput.trim()}
            >
              {nlParsing && <Loader2 className="h-4 w-4 animate-spin" />}
              {nlParsing ? "Parsing..." : "Parse"}
          </Button>
        </div>

        {nlError && <div className="mt-3"><Alert>{nlError}</Alert></div>}

        {nlSuccess && (
            <Alert tone="emerald">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">Tasks created successfully!</p>
              <button
                onClick={() => { setNlSuccess(false); }}
                  className="text-xs font-semibold text-emerald-100 hover:text-white"
              >
                Dismiss
              </button>
              </div>
            </Alert>
          )}

        {nlPreview.length > 0 && (
          <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                {nlPreview.length} task{nlPreview.length > 1 ? "s" : ""} found — review before saving
              </p>

            <div className="mb-4 space-y-2">
                {nlPreview.map((task: {
                  title: string;
                  description?: string;
                  priority: string;
                  estimatedMinutes: number;
                  deadline?: string;
                  scheduledDate?: string;
                  scheduledStartTime?: string;
                }, i) => (
                <div key={`${task.title}-${i}`} className="rounded-md border border-white/10 bg-slate-950/45 p-3">
                  <p className="mb-2 text-sm font-semibold text-white">{task.title}</p>
                    <div className="mb-2 flex flex-wrap gap-2">
                    <Badge tone={priorityTones[task.priority] ?? "slate"}>{task.priority}</Badge>
                    <Badge>{task.estimatedMinutes} min</Badge>
                      {task.deadline && (
                      <Badge tone="blue">Due {task.deadline}</Badge>
                      )}
                      {task.scheduledDate && task.scheduledStartTime && (
                      <Badge tone="emerald">
                          {task.scheduledDate} {task.scheduledStartTime}
                      </Badge>
                      )}
                    </div>
                    {task.description && (
                    <p className="text-xs leading-5 text-slate-400">{task.description}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
              <Button
                  onClick={handleNlSave}
                  disabled={nlSaving}
                >
                {nlSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {nlSaving ? "Saving..." : `Save ${nlPreview.length} task${nlPreview.length > 1 ? "s" : ""}`}
              </Button>
              <Button
                  onClick={() => { setNlPreview([]); setNlInput(""); }}
                variant="secondary"
                >
                  Discard
              </Button>
              </div>
            </div>
          )}
      </Panel>

      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-form-title"
          onClick={() => {
            if (!loading) {
              handleCloseForm();
            }
          }}
        >
          <div
            className="relative max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-lg border border-white/10 bg-slate-950/80 p-4 shadow-2xl shadow-blue-950/40 backdrop-blur-xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="pointer-events-none absolute inset-0 rounded-lg bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_42%)]" />
            <div className="relative">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 id="task-form-title" className="text-xl font-bold text-white">
                    {editingID ? "Edit Task" : "Create Task"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-300">
                    Capture the task details your schedule should plan around.
                  </p>
                </div>
                <button
                  type="button"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-blue-300/30 text-xl leading-none text-blue-100 transition hover:border-blue-200 hover:bg-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-slate-950"
                  onClick={handleCloseForm}
                  aria-label="Close task form"
                  disabled={loading}
                >
                  ×
                </button>
              </div>

          <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert>{error}</Alert>}

            <div>
            <FieldLabel>Title *</FieldLabel>
            <TextInput
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
              />
            </div>

            <div>
            <FieldLabel>Description</FieldLabel>
            <TextArea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Enter task description"
              />
            </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <FieldLabel>Priority *</FieldLabel>
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </div>

            <div>
              <FieldLabel>Estimated Minutes</FieldLabel>
              <TextInput
                type="number"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || 60)}
                min="1"
                max="480"
              />
            </div>

            <div>
              <FieldLabel>Deadline</FieldLabel>
              <TextInput
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className="border-t border-white/10 pt-4">
            <p className="mb-3 text-sm font-medium text-slate-200">
              Scheduled time <span className="font-normal text-slate-500">(optional, pin to a specific time)</span>
              </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                <FieldLabel>Date</FieldLabel>
                <TextInput
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                </div>
                <div>
                <FieldLabel>Start time</FieldLabel>
                <TextInput
                    type="time"
                    value={scheduledStartTime}
                    onChange={(e) => setScheduledStartTime(e.target.value)}
                  />
                </div>
              </div>
              {scheduledDate && scheduledStartTime && (
              <p className="mt-2 text-xs text-blue-200">
                  Pinned to {scheduledDate} at {scheduledStartTime} — will appear in Timetable
                </p>
              )}
            </div>

            <div className="flex gap-2">
            <Button
                type="submit"
                disabled={loading}
              >
              <Plus className="h-4 w-4" />
                {loading ? "Saving..." : editingID ? "Update Task" : "Create Task"}
            </Button>
              {editingID && (
              <Button
                  type="button"
                  onClick={handleCloseForm}
                variant="secondary"
                >
                  Cancel
              </Button>
              )}
            </div>
          </form>
            </div>
          </div>
        </div>
      )}

      <Panel>
        <h2 className="mb-3 text-xl font-semibold text-white">Your Tasks</h2>
          {fetching ? (
          <div className="py-8 text-center text-slate-400">Loading...</div>
          ) : tasks.length === 0 ? (
          <div className="py-8 text-center text-slate-400">No tasks yet. Create one.</div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                className="rounded-lg border border-white/10 bg-white/[0.04] p-4 transition hover:border-blue-200/30 hover:bg-white/[0.06]"
                >
                <div className="flex flex-col gap-3 text-white sm:flex-row sm:items-start">
                  <Select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                    className="sm:w-36"
                    >
                      <option value="todo">Todo</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                  </Select>

                    <div className="flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className={`font-semibold ${task.status === "completed" ? "text-slate-500 line-through" : "text-white"}`}>
                          {task.title}
                        </h3>
                      <Badge tone={priorityTones[task.priority]}>{task.priority}</Badge>
                      <Badge tone={statusTones[task.status]}>{task.status.replace("_", " ")}</Badge>
                        {task.scheduledDate && task.scheduledStartTime && (
                        <Badge tone="blue">
                            {task.scheduledDate} {task.scheduledStartTime}
                        </Badge>
                        )}
                      </div>
                      {task.description && (
                      <p className={`text-sm ${task.status === "completed" ? "text-slate-500" : "text-slate-300"}`}>
                          {task.description}
                        </p>
                      )}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>{task.estimatedMinutes} min</span>
                      {task.deadline && <span>Due: {task.deadline}</span>}
                      {task.scheduledDate && !task.scheduledStartTime && <span>{task.scheduledDate}</span>}
                        <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(task)}
                      className="text-sm font-semibold text-blue-200 hover:text-white"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                      className="text-sm font-semibold text-rose-200 hover:text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </Panel>
    </>
  );
}
