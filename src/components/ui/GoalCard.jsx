import ProgressBar from './ProgressBar.jsx'

function GoalCard({ goal, onEdit, onDelete }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-lg shadow-blue-950/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">{goal.title}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-100">
              {goal.type}
            </span>
            <span className="rounded-full bg-slate-950/70 px-3 py-1 text-xs font-semibold text-slate-200">
              {goal.category}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(goal)}
            className="rounded-xl border border-blue-300/30 px-3 py-2 text-sm font-semibold text-blue-100 transition hover:border-blue-200 hover:bg-blue-500/20"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(goal.id)}
            className="rounded-xl border border-red-300/30 px-3 py-2 text-sm font-semibold text-red-100 transition hover:border-red-200 hover:bg-red-500/20"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-4">
          <p className="text-sm text-slate-300">Target date: {goal.targetDate}</p>
          <p className="text-sm font-semibold text-blue-200">
            {goal.progress}%
          </p>
        </div>
        <ProgressBar value={goal.progress} />
      </div>
    </article>
  )
}

export default GoalCard
