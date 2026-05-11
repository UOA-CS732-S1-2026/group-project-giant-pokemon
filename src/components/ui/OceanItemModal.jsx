function OceanItemModal({ item, onClose }) {
  if (!item) {
    return null
  }

  const isLife = item.type === 'life'
  const statusText = isLife ? 'Restoring ocean life' : 'Polluting the ocean'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        className={`w-full max-w-lg rounded-3xl border p-6 shadow-2xl transition ${
          isLife
            ? 'border-emerald-300/30 bg-slate-950'
            : 'border-red-300/30 bg-slate-950'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div
              className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${
                isLife ? 'bg-emerald-500/20' : 'bg-red-500/20'
              }`}
            >
              {item.icon}
            </div>
            <h3 className="text-2xl font-bold text-white">{item.taskTitle}</h3>
            {item.subtaskTitle && (
              <p className="mt-2 text-sm font-semibold text-blue-200">
                Subtask: {item.subtaskTitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-3 py-1 text-sm font-bold text-slate-200 transition hover:bg-white/10 hover:text-white"
            aria-label="Close modal"
          >
            X
          </button>
        </div>

        <div className="grid gap-3 text-sm">
          <div
            className={`rounded-2xl border p-4 ${
              isLife
                ? 'border-emerald-300/20 bg-emerald-500/10 text-emerald-100'
                : 'border-red-300/20 bg-red-500/10 text-red-100'
            }`}
          >
            <p className="font-semibold">Status</p>
            <p className="mt-1">{statusText}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Detail label="Priority" value={item.priority} />
            <Detail label="Category" value={item.category} />
            <Detail label="Due date" value={item.dueDate} />
            <Detail label="Type" value={item.subtaskTitle ? 'Subtask' : 'Task'} />
          </div>

          <Detail
            label="Description"
            value={item.description || 'No description added yet.'}
          />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          Close
        </button>
      </section>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-slate-100">{value || 'Not set'}</p>
    </div>
  )
}

export default OceanItemModal
