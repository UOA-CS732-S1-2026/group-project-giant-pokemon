"use client";

import type { FormEvent } from "react";
import type { GoalStatus } from "@/types/goal";

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
    <form
      onSubmit={onSubmit}
      className="grid gap-4 lg:grid-cols-2"
    >
      <label className="block lg:col-span-2">
        <span className="mb-2 block text-sm font-medium text-slate-200">
          Goal title
        </span>
        <input
          className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter a goal title"
        />
      </label>

      <label className="block lg:col-span-2">
        <span className="mb-2 block text-sm font-medium text-slate-200">
          Description
        </span>
        <textarea
          className="min-h-28 w-full resize-y rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Enter a goal description"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-200">
          Status
        </span>
        <select
          className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
          value={status}
          onChange={(e) => onStatusChange(e.target.value as GoalStatus)}
        >
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-200">
          Progress percentage
        </span>
        <input
          type="number"
          className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
          value={progress}
          onChange={(e) => onProgressChange(Number(e.target.value))}
          min={0}
          max={100}
        />
      </label>

      {error && (
        <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200 lg:col-span-2">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row lg:col-span-2">
        <button
          type="submit"
          className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={loading}
        >
          {loading
            ? editingID
              ? "Updating..."
              : "Creating..."
            : editingID
              ? "Update Goal"
              : "Create Goal"}
        </button>

        <button
          type="button"
          className="rounded-2xl border border-blue-300/30 px-5 py-3 text-sm font-semibold text-blue-100 transition hover:border-blue-200 hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onCancelEdit}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
