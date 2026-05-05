const statusStyles = {
  Pending: 'bg-slate-700/70 text-slate-100',
  'In Progress': 'bg-blue-500/20 text-blue-100',
  Completed: 'bg-emerald-500/20 text-emerald-100',
}

const priorityStyles = {
  Low: 'bg-slate-700/70 text-slate-100',
  Medium: 'bg-blue-500/20 text-blue-100',
  High: 'bg-red-500/20 text-red-100',
}

function TaskCard({
  task,
  onEdit,
  onDelete,
  onMarkComplete,
  onToggleSubtask,
}) {
  const isCompleted = task.status === 'Completed'

  return (
    <article
      className={`rounded-3xl border border-white/10 bg-white/10 p-5 shadow-lg shadow-blue-950/20 transition ${
        isCompleted ? 'opacity-80' : ''
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">{task.title}</h3>
          <p className="mt-2 text-sm text-slate-300">
            Related goal: {task.relatedGoal}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityStyles[task.priority]}`}
            >
              {task.priority}
            </span>
            <span className="rounded-full bg-slate-950/70 px-3 py-1 text-xs font-semibold text-slate-200">
              {task.category}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[task.status]}`}
            >
              {task.status}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onMarkComplete(task.id)}
            disabled={isCompleted}
            className="rounded-xl border border-emerald-300/30 px-3 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-200 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Mark Complete
          </button>
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="rounded-xl border border-blue-300/30 px-3 py-2 text-sm font-semibold text-blue-100 transition hover:border-blue-200 hover:bg-blue-500/20"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            className="rounded-xl border border-red-300/30 px-3 py-2 text-sm font-semibold text-red-100 transition hover:border-red-200 hover:bg-red-500/20"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
        <p>Due date: {task.dueDate}</p>
        <p>Estimated duration: {task.duration} minutes</p>
      </div>

      <div className="mt-5">
        <p className="mb-3 text-sm font-semibold text-slate-200">Subtasks</p>
        <div className="space-y-2">
          {task.subtasks.map((subtask) => (
            <label
              key={subtask.id}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100"
            >
              <input
                type="checkbox"
                checked={subtask.completed}
                onChange={() => onToggleSubtask(task.id, subtask.id)}
                className="h-4 w-4 accent-blue-500"
              />
              <span className={subtask.completed ? 'line-through opacity-70' : ''}>
                {subtask.title}
              </span>
            </label>
          ))}
        </div>
      </div>
    </article>
  )
}

export default TaskCard
