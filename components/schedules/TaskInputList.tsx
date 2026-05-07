"use client";

import type { FormEvent } from "react";
import type { MockTaskPriority } from "@/lib/mockTasks";

export type LocalTaskInput = {
    title: string;
    priority: MockTaskPriority;
    estimatedMinutes: string;
    deadline: string;
};

export type LocalTask = {
    id: string;
    title: string;
    priority: MockTaskPriority;
    status: "todo";
    estimatedMinutes?: number;
    deadline?: string;
};

type TaskInputListProps = {
    tasks: LocalTask[];
    taskInput: LocalTaskInput;
    error: string;
    onTaskInputChange: (taskInput: LocalTaskInput) => void;
    onAddTask: (event: FormEvent<HTMLFormElement>) => void;
    onDeleteTask: (id: string) => void;
};

export default function TaskInputList({
    tasks,
    taskInput,
    error,
    onTaskInputChange,
    onAddTask,
    onDeleteTask,
}: TaskInputListProps) {
    return (
        <aside className="space-y-4">
            <div>
                <h2 className="text-xl font-semibold">Task Input</h2>
                <p className="text-sm text-gray-600">Saved in this browser for testing</p>
            </div>

            <form onSubmit={onAddTask} className="p-4 border rounded space-y-4">
                <div>
                    <label className="block mb-1 font-medium text-sm">Task Title</label>
                    <input
                        className="w-full border rounded px-3 py-2"
                        value={taskInput.title}
                        onChange={(event) =>
                            onTaskInputChange({ ...taskInput, title: event.target.value })
                        }
                        placeholder="Add a task for scheduling"
                    />
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <div>
                        <label className="block mb-1 font-medium text-sm">Priority</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={taskInput.priority}
                            onChange={(event) =>
                                onTaskInputChange({
                                    ...taskInput,
                                    priority: event.target.value as MockTaskPriority,
                                })
                            }
                        >
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>

                    <div>
                        <label className="block mb-1 font-medium text-sm">Minutes</label>
                        <input
                            type="number"
                            min={1}
                            className="w-full border rounded px-3 py-2"
                            value={taskInput.estimatedMinutes}
                            onChange={(event) =>
                                onTaskInputChange({
                                    ...taskInput,
                                    estimatedMinutes: event.target.value,
                                })
                            }
                            placeholder="60"
                        />
                    </div>
                </div>

                <div>
                    <label className="block mb-1 font-medium text-sm">Deadline</label>
                    <input
                        type="date"
                        className="w-full border rounded px-3 py-2"
                        value={taskInput.deadline}
                        onChange={(event) =>
                            onTaskInputChange({ ...taskInput, deadline: event.target.value })
                        }
                    />
                </div>

                <button type="submit" className="rounded bg-black px-4 py-2 text-white">
                    Add Task
                </button>

                {error && <p className="text-red-500 text-sm">{error}</p>}
            </form>

            <ul className="space-y-3">
                {tasks.map((task) => (
                    <li key={task.id} className="p-4 border rounded">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="font-semibold">{task.title}</h3>
                                <p className="mt-1 text-sm text-gray-600">
                                    {task.priority} priority
                                    {task.estimatedMinutes
                                        ? ` · ${task.estimatedMinutes} min`
                                        : ""}
                                </p>
                                {task.deadline && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        Deadline: {task.deadline}
                                    </p>
                                )}
                            </div>
                            <button
                                type="button"
                                className="rounded border px-3 py-1 text-sm"
                                onClick={() => onDeleteTask(task.id)}
                            >
                                Delete
                            </button>
                        </div>
                    </li>
                ))}
            </ul>

            {tasks.length === 0 && (
                <p className="text-sm text-gray-600">No task inputs yet.</p>
            )}
        </aside>
    );
}

