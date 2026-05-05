import BadgeCard from '../components/ui/BadgeCard.jsx'
import LevelProgress from '../components/ui/LevelProgress.jsx'
import StatCard from '../components/ui/StatCard.jsx'

const badges = [
  {
    name: 'First Step',
    description: 'Complete your first task',
    unlocked: true,
    icon: '✓',
  },
  {
    name: 'Goal Getter',
    description: 'Create 3 goals',
    unlocked: true,
    icon: '+',
  },
  {
    name: 'Schedule Starter',
    description: 'Generate your first schedule',
    unlocked: true,
    icon: 'AI',
  },
  {
    name: 'Focus Builder',
    description: 'Complete 5 subtasks',
    unlocked: true,
    icon: '5',
  },
  {
    name: 'Streak Starter',
    description: 'Maintain a 3-day streak',
    unlocked: true,
    icon: '3',
  },
  {
    name: 'Planner Pro',
    description: 'Complete all scheduled tasks in a day',
    unlocked: false,
    icon: 'P',
  },
  {
    name: 'Comeback Mode',
    description: 'Re-plan a missed task',
    unlocked: true,
    icon: 'R',
  },
  {
    name: 'Master Scheduler',
    description: 'Reach Level 5',
    unlocked: false,
    icon: '5',
  },
]

const streakDays = [
  { day: 'Mon', status: 'completed' },
  { day: 'Tue', status: 'completed' },
  { day: 'Wed', status: 'completed' },
  { day: 'Thu', status: 'completed' },
  { day: 'Fri', status: 'active' },
  { day: 'Sat', status: 'locked' },
  { day: 'Sun', status: 'locked' },
]

const activityItems = [
  'Completed "Review project requirements" and earned 20 XP',
  'Created goal "Complete COMPSCI 732 Project"',
  "Generated today's AI schedule",
  'Re-planned missed task',
  'Completed 2 subtasks under "Build dashboard layout"',
]

function Progress({ tasks }) {
  const completedTaskCount = tasks.filter(
    (task) => task.status === 'Completed',
  ).length
  const displayedCompletedTasks = Math.max(12, completedTaskCount)

  const stats = [
    { label: 'Current Level', value: 'Level 3 Planner' },
    { label: 'Current XP', value: '240 XP' },
    { label: 'Next Level', value: '300 XP' },
    { label: 'Current Streak', value: '4 days' },
    { label: 'Tasks Completed', value: displayedCompletedTasks },
  ]

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-blue-950/20">
        <h2 className="text-3xl font-bold text-white">Your Progress</h2>
        <p className="mt-2 text-slate-300">
          Track your consistency, XP, streaks, and achievements.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </section>

      <LevelProgress currentXp={240} nextLevelXp={300} />

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-blue-950/20">
          <h3 className="text-xl font-bold text-white">Weekly Streak</h3>
          <p className="mt-1 text-sm text-slate-300">
            Complete one task today to keep your streak alive.
          </p>

          <div className="mt-5 grid grid-cols-7 gap-2">
            {streakDays.map((item) => {
              const isCompleted = item.status === 'completed'
              const isActive = item.status === 'active'

              return (
                <div
                  key={item.day}
                  className={`rounded-2xl border px-2 py-4 text-center ${
                    isCompleted
                      ? 'border-emerald-300/30 bg-emerald-500/10 text-emerald-100'
                      : isActive
                        ? 'border-blue-300/40 bg-blue-500/20 text-blue-100'
                        : 'border-white/10 bg-slate-950/50 text-slate-500'
                  }`}
                >
                  <p className="text-xs font-semibold">{item.day}</p>
                  <div className="mx-auto mt-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/60 text-sm font-bold">
                    {isCompleted ? '✓' : isActive ? '•' : '-'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-blue-950/20">
          <h3 className="text-xl font-bold text-white">Recent Activity</h3>
          <div className="mt-5 space-y-3">
            {activityItems.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-100"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-blue-950/20">
        <div className="mb-5">
          <h3 className="text-xl font-bold text-white">Achievements</h3>
          <p className="mt-1 text-sm text-slate-300">
            Unlock milestones as you plan, complete tasks, and stay consistent.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {badges.map((badge) => (
            <BadgeCard key={badge.name} badge={badge} />
          ))}
        </div>
      </section>
    </div>
  )
}

export default Progress
