import ProgressBar from '../components/ui/ProgressBar.jsx'
import StatCard from '../components/ui/StatCard.jsx'

const quickActions = [
  { label: 'Add Goal', page: 'goals' },
  { label: 'Add Task', page: 'tasks' },
  { label: 'Generate Schedule', page: 'schedule' },
]

function getFirstName(fullName) {
  return fullName.trim().split(' ')[0] || 'there'
}

function Dashboard({
  onNavigate,
  userProfile,
  goals,
  taskStats,
  goalStats,
  tasks,
  generatedSchedule,
  totalXP,
  oceanHealth,
  levelInfo,
  weeklyStreak,
}) {
  const scheduleItems =
    generatedSchedule.length > 0
      ? generatedSchedule.map((block) => ({
          time: block.timeRange,
          task: block.title,
        }))
      : tasks
          .filter((task) => task.status !== 'Completed')
          .slice(0, 4)
          .map((task) => ({
            time: `${task.duration} min`,
            task: task.title,
          }))

  const stats = [
    { label: "Today's Tasks", value: taskStats.activeTasks },
    { label: 'Completed', value: taskStats.completedTasks },
    { label: 'Current XP', value: `${totalXP} XP` },
    { label: 'Active Goals', value: goalStats.activeGoals },
  ]

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-blue-950/20">
        <h2 className="text-3xl font-bold text-white">
          Welcome back, {getFirstName(userProfile.fullName)}
        </h2>
        <p className="mt-2 text-slate-300">
          Here is your goal-driven plan for today.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-blue-950/20">
          <div className="mb-5">
            <h3 className="text-xl font-bold text-white">Goal Progress</h3>
            <p className="mt-1 text-sm text-slate-300">
              Track how your current goals are moving.
            </p>
          </div>

          <div className="space-y-5">
            {goals.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300">
                Add a goal to start tracking progress.
              </p>
            ) : goals.slice(0, 4).map((goal) => (
              <div key={goal.title}>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <p className="font-semibold text-white">{goal.title}</p>
                  <p className="text-sm font-semibold text-blue-200">
                    {goal.progress}%
                  </p>
                </div>
                <ProgressBar value={goal.progress} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-blue-950/20">
          <h3 className="text-xl font-bold text-white">Productivity Ocean</h3>
          <p className="mt-1 text-sm text-slate-300">
            {levelInfo.currentLevelLabel}
          </p>

          <div className="my-6 rounded-2xl bg-slate-950/60 p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-white">Ocean Health</p>
              <p className="text-sm font-semibold text-blue-200">
                {oceanHealth}%
              </p>
            </div>
            <ProgressBar value={oceanHealth} />
          </div>

          <div className="rounded-2xl border border-blue-300/20 bg-blue-500/10 p-4">
            <p className="text-sm font-medium text-blue-100">
              Keep your {weeklyStreak} day streak alive by completing one more task today.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-blue-950/20">
          <h3 className="text-xl font-bold text-white">
            Today's Schedule Preview
          </h3>

          <div className="mt-5 space-y-3">
            {scheduleItems.map((item) => (
              <div
                key={`${item.time}-${item.task}`}
                className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-slate-950/50 p-4 sm:flex-row sm:items-center sm:gap-4"
              >
                <p className="w-24 text-sm font-bold text-blue-200">
                  {item.time}
                </p>
                <p className="text-slate-100">{item.task}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-blue-950/20">
          <h3 className="text-xl font-bold text-white">Quick Actions</h3>
          <p className="mt-1 text-sm text-slate-300">
            Start building your plan from here.
          </p>

          <div className="mt-5 grid gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => onNavigate(action.page)}
                className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
