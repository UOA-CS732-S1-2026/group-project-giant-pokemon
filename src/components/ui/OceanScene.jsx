import OceanItem from './OceanItem.jsx'

const rubbishIcons = ['🧴', '🛞', '🗑️']
const lifeIcons = ['🐟', '🐠', '🐢', '🌿', '🪸']

function OceanScene({ tasks, onCompleteTask }) {
  const incompleteTasks = tasks.filter((task) => task.status !== 'Completed')
  const completedTasks = tasks.filter((task) => task.status === 'Completed')
  const hasNoTasks = tasks.length === 0
  const isCleanOcean = tasks.length > 0 && incompleteTasks.length === 0
  const hasNoMarineLife = tasks.length > 0 && completedTasks.length === 0

  return (
    <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-blue-500/25 via-cyan-500/10 to-slate-950/80 p-6 shadow-2xl shadow-blue-950/30">
      <div className="mb-5">
        <h3 className="text-xl font-bold text-white">Ocean Scene</h3>
        <p className="mt-1 text-sm text-blue-100">
          Each task becomes either floating rubbish or restored marine life.
        </p>
      </div>

      {hasNoTasks && (
        <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-8 text-center text-slate-200">
          No tasks yet. Add tasks to begin restoring your ocean.
        </div>
      )}

      {isCleanOcean && (
        <div className="mb-5 rounded-3xl border border-emerald-300/30 bg-emerald-500/15 p-5 text-center font-semibold text-emerald-100">
          All rubbish has been cleared. Your ocean is thriving.
        </div>
      )}

      {!hasNoTasks && (
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="rounded-3xl border border-red-300/20 bg-red-500/10 p-5">
            <div className="mb-4">
              <h4 className="text-lg font-bold text-white">Pollution Zone</h4>
              <p className="mt-1 text-sm text-red-100">
                {incompleteTasks.length} rubbish items remaining
              </p>
            </div>

            {incompleteTasks.length === 0 ? (
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-5 text-sm font-medium text-emerald-100">
                No rubbish remains in this zone.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {incompleteTasks.map((task, index) => (
                  <OceanItem
                    key={task.id}
                    icon={rubbishIcons[index % rubbishIcons.length]}
                    label={task.title}
                    variant="rubbish"
                    onComplete={() => onCompleteTask(task.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-emerald-300/20 bg-emerald-500/10 p-5">
            <div className="mb-4">
              <h4 className="text-lg font-bold text-white">
                Restored Life Zone
              </h4>
              <p className="mt-1 text-sm text-emerald-100">
                {completedTasks.length} marine life restored
              </p>
            </div>

            {hasNoMarineLife ? (
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5 text-sm font-medium text-slate-200">
                No marine life yet. Complete your first task to bring life back.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {completedTasks.map((task, index) => (
                  <OceanItem
                    key={task.id}
                    icon={lifeIcons[index % lifeIcons.length]}
                    label={task.title}
                    variant="life"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default OceanScene
