const priorityStyles = {
  Low: 'bg-slate-700/70 text-slate-100',
  Medium: 'bg-blue-500/20 text-blue-100',
  High: 'bg-red-500/20 text-red-100',
}

function ScheduleBlock({ block }) {
  return (
    <article
      className={`relative rounded-3xl border p-5 shadow-lg shadow-blue-950/20 ${
        block.replanned
          ? 'border-emerald-300/30 bg-emerald-500/10'
          : 'border-white/10 bg-white/10'
      }`}
    >
      <div className="absolute left-0 top-6 h-10 w-1 rounded-r-full bg-blue-500" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold text-blue-200">{block.timeRange}</p>
          <h3 className="mt-2 text-xl font-bold text-white">{block.title}</h3>
          <p className="mt-2 text-sm text-slate-300">
            Related goal: {block.relatedGoal}
          </p>
        </div>

        {block.replanned && (
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-100">
            Re-planned
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityStyles[block.priority]}`}
        >
          {block.priority}
        </span>
        <span className="rounded-full bg-slate-950/70 px-3 py-1 text-xs font-semibold text-slate-200">
          {block.category}
        </span>
        <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-100">
          {block.duration} minutes
        </span>
      </div>
    </article>
  )
}

export default ScheduleBlock
