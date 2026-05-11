import ProgressBar from './ProgressBar.jsx'

const levels = [
  'Level 1 Starter',
  'Level 2 Organizer',
  'Level 3 Planner',
  'Level 4 Achiever',
  'Level 5 Master Scheduler',
]

function LevelProgress({ currentXp, nextLevelXp }) {
  const progressValue =
    nextLevelXp === 0 ? 100 : Math.round((currentXp / nextLevelXp) * 100)
  const xpNeeded = Math.max(nextLevelXp - currentXp, 0)

  return (
    <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-blue-950/20">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Level Progress</h3>
          <p className="mt-1 text-sm text-slate-300">
            {currentXp} / {nextLevelXp} XP
          </p>
        </div>
        <p className="text-sm font-semibold text-blue-200">
          {xpNeeded} XP needed to reach the next level
        </p>
      </div>

      <ProgressBar value={progressValue} />

      <div className="mt-5 grid gap-2 sm:grid-cols-5">
        {levels.map((level) => {
          const isCurrentLevel = level === 'Level 3 Planner'

          return (
            <div
              key={level}
              className={`rounded-2xl border px-3 py-3 text-center text-xs font-semibold ${
                isCurrentLevel
                  ? 'border-blue-300/40 bg-blue-500/20 text-blue-100'
                  : 'border-white/10 bg-slate-950/50 text-slate-300'
              }`}
            >
              {level}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default LevelProgress
