"use client";

import type { Goal } from "@/types/goal";

const statusStyles: Record<Goal["status"], string> = {
    active: "bg-blue-500/20 text-blue-100",
    completed: "bg-emerald-500/20 text-emerald-100",
};

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
  onDelete,
}: GoalListProps) {
  if (fetching) {
    return (
      <p className="rounded-lg border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300">
        Loading goals...
      </p>
    );
  }

  if (goals.length === 0) {
    return (
      <p className="rounded-lg border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300">
        No goals yet. Start by creating a new goal!
      </p>
    );
  }

  return (
    <ul className="grid gap-4 xl:grid-cols-2">
      {goals.map((goal) => (
        <li
          key={goal.id}
          className="rounded-lg border border-white/10 bg-slate-950/55 p-5 shadow-2xl shadow-blue-950/20 backdrop-blur-xl"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">{goal.title}</h3>
              {goal.description && (
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {goal.description}
                </p>
              )}
            </div>

            <span
              className={`w-fit whitespace-nowrap rounded-sm border border-white/10 px-2 py-1 text-xs font-semibold ${statusStyles[goal.status]}`}
            >
              {goal.status}
            </span>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-4">
              <p className="text-sm text-slate-300">Progress</p>
              <p className="text-sm font-semibold text-blue-200">
                {goal.progress}%
              </p>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-900/80">
              <div
                className="h-full rounded-full bg-blue-500 shadow-lg shadow-blue-500/40 transition-all"
                style={{ width: `${goal.progress}%` }}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md border border-blue-300/30 bg-blue-500/20 px-3 py-2 text-sm font-semibold text-blue-100 transition hover:border-blue-200 hover:bg-blue-500/30"
              onClick={() => onEdit(goal)}
            >
              Edit
            </button>
            <button
              type="button"
              className="rounded-md border border-red-300/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-100 transition hover:border-red-200 hover:bg-red-500/20"
              onClick={() => {
                if (confirm("Are you sure you want to delete this goal?")) {
                  onDelete(goal.id);
                }
              }}
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
