import BadgeCard from '../components/ui/BadgeCard.jsx'
import LevelProgress from '../components/ui/LevelProgress.jsx'
import OceanScene from '../components/ui/OceanScene.jsx'
import ProgressBar from '../components/ui/ProgressBar.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import {
  calculateOceanStats,
} from '../utils/progressCalculations.js'

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

function getOceanStatus(health) {
  if (health === 100) {
    return 'Thriving'
  }

  if (health >= 71) {
    return 'Healthy'
  }

  if (health >= 31) {
    return 'Recovering'
  }

  return 'Polluted'
}

function getOceanStatusMessage(health) {
  if (health === 100) {
    return 'Your ocean is clean and thriving!'
  }

  if (health >= 71) {
    return 'Your ocean is healthy. Almost fully restored.'
  }

  if (health >= 31) {
    return 'Your ocean is recovering. Keep completing tasks.'
  }

  return 'Your ocean is polluted. Complete tasks to remove rubbish.'
}

function ProductivityOcean({ tasks, totalXP, levelInfo }) {
  const {
    totalTasks,
    totalSubtasks,
    completedTasks,
    completedSubtasks,
    remainingTasks,
    oceanHealth,
  } = calculateOceanStats(tasks)
  const oceanStatus = getOceanStatus(oceanHealth)

  const stats = [
    { label: 'Total Tasks', value: totalTasks },
    { label: 'Total Subtasks', value: totalSubtasks },
    { label: 'Completed Tasks', value: completedTasks },
    { label: 'Completed Subtasks', value: completedSubtasks },
    { label: 'Ocean Health', value: `${oceanHealth}%` },
    { label: 'Total XP', value: `${totalXP} XP` },
    { label: 'Current Level', value: levelInfo.label },
    { label: 'Next Level XP', value: levelInfo.nextLevelXP },
  ]

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-blue-950/20">
        <h2 className="text-3xl font-bold text-white">Productivity Ocean</h2>
        <p className="mt-2 text-slate-300">
          Complete tasks to clean your ocean and bring marine life back.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-blue-950/20">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Ocean Health</h3>
          <p className="mt-1 text-sm text-slate-300">
              {getOceanStatusMessage(oceanHealth)}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {remainingTasks} task units still need work.
            </p>
          </div>
          <p className="text-sm font-semibold text-blue-200">{oceanStatus}</p>
        </div>
        <ProgressBar value={oceanHealth} />
      </section>

      <OceanScene tasks={tasks} />

      <section className="rounded-3xl border border-blue-300/20 bg-blue-500/10 p-6 shadow-lg shadow-blue-950/20">
        <h3 className="text-xl font-bold text-white">
          How Productivity Ocean works
        </h3>
        <p className="mt-2 text-sm leading-6 text-blue-100">
          Each task you create adds rubbish to the ocean. Completing tasks
          removes rubbish and restores marine life. Your ocean health shows how
          much of your work is complete.
        </p>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-blue-950/20">
          <h3 className="text-xl font-bold text-white">Ocean Rewards</h3>
          <p className="mt-1 text-sm text-slate-300">
            XP, level and streaks support your clean-ocean journey.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <StatCard label="Current XP" value={`${totalXP} XP`} />
            <StatCard label="Level" value={levelInfo.label} />
            <StatCard label="Streak" value="4 days" />
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-blue-950/20">
          <h3 className="text-xl font-bold text-white">Weekly Streak</h3>
          <p className="mt-1 text-sm text-slate-300">
            Complete one task today to keep your ocean recovering.
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
      </section>

      <LevelProgress currentXp={totalXP} nextLevelXp={levelInfo.nextLevelXP} />

      <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-blue-950/20">
        <div className="mb-5">
          <h3 className="text-xl font-bold text-white">Achievements</h3>
          <p className="mt-1 text-sm text-slate-300">
            Unlock milestones as your productivity ocean recovers.
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

export default ProductivityOcean
